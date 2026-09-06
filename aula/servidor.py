#!/usr/bin/env python3
"""
Mercado — Servidor de aula
==========================

Permite que varias tablets o celulares trabajen en la misma partida, con el
computador del profesor haciendo de central.

Todo ocurre dentro de la red del colegio: no usa internet, no manda datos a
ningún servicio externo y no guarda nada en disco. Al cerrar la ventana, la
sala desaparece.

Solo necesita Python. No hay que instalar librerías.

    python servidor.py
"""

import json
import os
import random
import socket
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

PUERTO = 8080
CARPETA = os.path.dirname(os.path.abspath(__file__))
# Nada fuera de esta carpeta se entrega por la red. Ver Handler.archivo().
RAIZ_SERVIDA = os.path.realpath(CARPETA)
JUEGO = "Mercado (archivo unico).html"

# Una sala se borra sola si nadie la toca en este tiempo
CADUCIDAD = 60 * 60 * 6

# Cuánto silencio hace falta para marcar una tablet como "sin señal".
#
# No se la saca de la lista: los navegadores de tablet frenan los temporizadores
# cuando la pantalla se atenúa o el estudiante cambia de aplicación, así que
# alguien que está pensando puede pasar un rato sin dar señales. Antes se los
# borraba y desaparecían del tablero en plena actividad. Ahora solo se avisa,
# y el profesor decide si saca a alguien.
SILENCIO = 45

salas = {}
candado = threading.Lock()


class Sala:
    """Una clase en curso: quiénes están y en qué desafío van."""

    def __init__(self):
        self.alumnos = {}        # nombre -> ultima vez que dio señales
        self.fichas = {}         # nombre -> qué tablet lo está usando
        self.respuestas = {}     # nombre -> {valor, correcta, estrategias}
        self.progreso = {}       # nombre -> en qué va de la compra
        self.historial = {}      # nombre -> lo que respondió en cada actividad
        self.grupos = {}         # id -> puesto de feria con sus integrantes
        self.actividad = None    # la compra que el profesor mandó a las tablets
        self.desafio = 0
        self.revelado = False
        self.version = 0         # sube con cada cambio; las tablets lo miran
        self.tocada = time.time()

    def cambio(self):
        self.version += 1
        self.tocada = time.time()

    def sin_senal(self):
        """Quiénes llevan rato sin dar señales, sin sacarlos de la lista."""
        ahora = time.time()
        return {n: round(ahora - visto) for n, visto in self.alumnos.items()
                if ahora - visto > SILENCIO}

    def anotar(self, nombre, clave, datos):
        """Guarda lo que respondió, para poder verlo después en Seguimiento."""
        self.historial.setdefault(nombre, {})[clave] = datos

    def resumen(self):
        return {
            "version": self.version,
            "desafio": self.desafio,
            "revelado": self.revelado,
            "alumnos": list(self.alumnos.keys()),
            "respuestas": self.respuestas,
            "progreso": self.progreso,
            "actividad": self.actividad,
            "historial": self.historial,
            "grupos": self.grupos,
            "sinSenal": self.sin_senal(),
        }


def limpiar_salas():
    """Borra las salas viejas para no acumular memoria."""
    while True:
        time.sleep(600)
        with candado:
            for codigo in [c for c, s in salas.items() if time.time() - s.tocada > CADUCIDAD]:
                del salas[codigo]


def ip_local():
    """La dirección que los estudiantes escriben en la tablet."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass                                   # sin ruido en la consola

    # --- Respuestas -------------------------------------------------------
    def json(self, datos):
        cuerpo = json.dumps(datos).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def archivo(self, nombre):
        # La ruta llega tal como la escribió el cliente. Sin comprobar dónde
        # termina apuntando, un "/../.." entregaba cualquier archivo del
        # computador del profesor a quien estuviera en la red del colegio.
        ruta = os.path.realpath(os.path.join(CARPETA, nombre))
        dentro = ruta == RAIZ_SERVIDA or ruta.startswith(RAIZ_SERVIDA + os.sep)
        if not dentro or not os.path.isfile(ruta):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(f"No encuentro {nombre}".encode("utf-8"))
            return
        with open(ruta, "rb") as f:
            cuerpo = f.read()
        tipo = "text/html; charset=utf-8" if nombre.endswith(".html") else "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    # --- Rutas ------------------------------------------------------------
    def do_POST(self):
        """Recibe lo que no cabe en una dirección: la compra dirigida y los
        puestos de feria, que llevan listas completas de productos y billetes.
        Así todas las tablets trabajan con exactamente los mismos datos."""
        u = urlparse(self.path)
        largo = int(self.headers.get("Content-Length", "0"))
        try:
            datos = json.loads(self.rfile.read(largo).decode("utf-8"))
        except Exception:
            return self.json({"error": "no entendí los datos"})

        with candado:
            sala = salas.get(datos.get("codigo", ""))
            if sala is None:
                return self.json({"error": "Ese código no existe"})

            if u.path == "/api/actividad":
                sala.actividad = datos.get("actividad")
                sala.grupos = {}
                sala.progreso = {}
                sala.respuestas = {}          # el historial se conserva
                sala.revelado = False
                sala.cambio()
                return self.json({"ok": True})

            if u.path == "/api/parejas":
                sala.grupos = {}
                sala.actividad = None
                for g in datos.get("grupos", []):
                    g.update({"ronda": 0, "etapa": "pedido", "pedido": [],
                              "cobro": None, "propuesta": None, "pago": 0,
                              "vuelto": None, "revision": None, "hechas": []})
                    sala.grupos[g["id"]] = g
                sala.cambio()
                return self.json({"ok": True})

        self.send_response(404)
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        ruta = u.path

        if ruta in ("/", "/jugar", "/index.html"):
            return self.archivo(JUEGO)

        if not ruta.startswith("/api/"):
            return self.archivo(ruta.lstrip("/"))

        accion = ruta[5:]
        with candado:
            # El profesor abre la sala
            if accion == "abrir":
                codigo = str(random.randint(100000, 999999))
                while codigo in salas:
                    codigo = str(random.randint(100000, 999999))
                salas[codigo] = Sala()
                return self.json({"codigo": codigo})

            sala = salas.get(q.get("c", ""))
            if sala is None:
                return self.json({"error": "Ese código no existe"})

            # Un estudiante entra
            if accion == "entrar":
                nombre = (q.get("n") or "").strip()[:20]
                ficha = (q.get("f") or "").strip()[:40]
                if not nombre:
                    return self.json({"error": "Falta el nombre"})

                # Dos estudiantes que se llaman igual compartían ficha, respuestas
                # y progreso, y en el tablero aparecía uno solo. Cada tablet manda
                # una ficha propia: si el nombre ya lo tiene OTRA tablet, se avisa;
                # si la ficha coincide es la misma volviendo tras recargarse y
                # entra sin más. Sin ficha (navegador que no deja guardar nada) se
                # la deja pasar igual, como antes.
                duena = sala.fichas.get(nombre)
                if duena and ficha and duena != ficha:
                    return self.json({"error": "Ya hay alguien con ese nombre. "
                                               "Agrega tu apellido, o pídele al profesor "
                                               "que te saque de la lista."})
                sala.fichas[nombre] = ficha or duena or ""
                sala.alumnos[nombre] = time.time()
                sala.cambio()
                return self.json({"ok": True, "desafio": sala.desafio, "revelado": sala.revelado})

            # Un estudiante cuenta en qué va de su compra
            if accion == "progreso":
                nombre = q.get("n", "")
                sala.alumnos[nombre] = time.time()
                dato = {
                    "fase": q.get("f", ""),
                    "items": int(q.get("i", "0") or 0),
                    "gastado": int(q.get("g", "0") or 0),
                    "presupuesto": int(q.get("p", "0") or 0),
                    "estrellas": int(q.get("s", "-1") or -1),
                    "completo": q.get("ok", "0") == "1",
                }
                sala.progreso[nombre] = dato
                if dato["fase"] == "listo" and sala.actividad:
                    sala.anotar(nombre, "compra%s" % sala.actividad.get("sello", ""),
                                dict(dato, resumen=sala.actividad.get("resumen", "Compra")))
                sala.cambio()
                return self.json({"ok": True})

            # El profesor lleva a todos al mismo desafío
            if accion == "ir-a":
                sala.desafio = int(q.get("d", "0"))
                sala.respuestas = {}
                sala.progreso = {}
                sala.actividad = None      # se vuelve a los desafíos
                sala.revelado = False
                sala.cambio()
                return self.json({"ok": True})

            # El profesor muestra las respuestas para comentarlas
            if accion == "revelar":
                sala.revelado = q.get("v", "1") == "1"
                sala.cambio()
                return self.json({"ok": True})

            # Un estudiante responde
            if accion == "responder":
                nombre = q.get("n", "")
                sala.alumnos[nombre] = time.time()
                dato = {
                    "valor": q.get("v", ""),
                    "correcta": q.get("ok", "0") == "1",
                    "estrategias": [e for e in (q.get("e", "") or "").split(",") if e],
                }
                sala.respuestas[nombre] = dato
                sala.anotar(nombre, "d%d" % sala.desafio, dict(dato, desafio=sala.desafio))
                sala.cambio()
                return self.json({"ok": True})

            # El profesor saca a alguien de la lista
            if accion == "sacar":
                nombre = q.get("n", "")
                sala.alumnos.pop(nombre, None)
                sala.fichas.pop(nombre, None)       # el nombre queda libre otra vez
                sala.respuestas.pop(nombre, None)
                sala.progreso.pop(nombre, None)
                sala.cambio()
                return self.json({"ok": True})

            # Una tablet se despide
            if accion == "salir":
                sala.alumnos.pop(q.get("n", ""), None)
                sala.fichas.pop(q.get("n", ""), None)
                sala.cambio()
                return self.json({"ok": True})

            # Avanza el trabajo de un puesto de feria
            if accion == "feria":
                g = sala.grupos.get(q.get("g", ""))
                if not g:
                    return self.json({"error": "ese puesto no existe"})
                nombre = q.get("n", "")
                sala.alumnos[nombre] = time.time()
                paso = q.get("a", "")

                if paso == "pedido":
                    g["pedido"] = [x for x in (q.get("v", "") or "").split(",") if x]
                    g["etapa"] = "cobro"
                elif paso == "cobro":
                    g["cobro"] = int(q.get("v", "0") or 0)
                    g["etapa"] = "pago"
                elif paso == "pago":
                    g["pago"] = int(q.get("v", "0") or 0)
                    g["etapa"] = "vuelto"
                elif paso == "vuelto":
                    g["vuelto"] = int(q.get("v", "0") or 0)
                    g["etapa"] = "revision"
                elif paso == "disputa":
                    # El comprador no acepta el cobro y dice cuál cree que es
                    # el monto correcto. Queda pendiente de que el feriante lo
                    # revise: puede aceptarlo o preferir recalcular él mismo.
                    g["propuesta"] = int(q.get("v", "0") or 0)
                    g["etapa"] = "disputa"
                elif paso == "aceptar_propuesta":
                    # El feriante está de acuerdo: el monto que dijo el
                    # comprador pasa a ser el cobro, y se sigue pagando con él.
                    g["cobro"] = g.get("propuesta")
                    g["propuesta"] = None
                    g["etapa"] = "pago"
                elif paso == "rechazar_propuesta":
                    # El feriante prefiere recalcular por su cuenta, sin usar
                    # el número que propuso el comprador.
                    g["propuesta"] = None
                    g["cobro"] = None
                    g["pago"] = 0
                    g["etapa"] = "cobro"
                elif paso == "revision":
                    g["revision"] = q.get("v", "")
                    g["etapa"] = "cierre"
                    g["hechas"].append({
                        "ronda": g["ronda"], "pedido": g["pedido"],
                        "cobro": g["cobro"], "pago": g["pago"],
                        "vuelto": g["vuelto"], "revision": g["revision"],
                        "cobroBien": q.get("cb", "0") == "1",
                        "vueltoBien": q.get("vb", "0") == "1",
                        "revisionBien": q.get("rb", "0") == "1",
                    })
                elif paso == "siguiente":
                    g["ronda"] += 1
                    g["etapa"] = "pedido"
                    g["pedido"] = []; g["cobro"] = None; g["propuesta"] = None; g["pago"] = 0
                    g["vuelto"] = None; g["revision"] = None

                sala.cambio()
                return self.json({"ok": True})

            # Todos preguntan por novedades
            if accion == "estado":
                sala.tocada = time.time()
                nombre = q.get("n")
                if nombre and nombre in sala.alumnos:
                    sala.alumnos[nombre] = time.time()
                return self.json(sala.resumen())

        return self.json({"error": "no encuentro esa acción"})


def main():
    if not os.path.isfile(os.path.join(CARPETA, JUEGO)):
        print(f"\n  ⚠  No encuentro «{JUEGO}».")
        print("     Deja este archivo en la misma carpeta que el juego.\n")
        input("     Presiona Enter para cerrar...")
        return

    threading.Thread(target=limpiar_salas, daemon=True).start()
    ip = ip_local()

    print("\n" + "=" * 58)
    print("  MERCADO — Modo aula")
    print("=" * 58)
    print("\n  En las tablets de los estudiantes, escribir:\n")
    print(f"      http://{ip}:{PUERTO}\n")
    print("  Se abrirá tu pantalla de profesor en el navegador.")
    print("  Para terminar la clase, cierra esta ventana.\n")
    print("=" * 58 + "\n")

    try:
        webbrowser.open(f"http://localhost:{PUERTO}")
    except Exception:
        pass

    servidor = ThreadingHTTPServer(("0.0.0.0", PUERTO), Handler)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n  Clase terminada.\n")


if __name__ == "__main__":
    try:
        main()
    except OSError as e:
        print(f"\n  ⚠  No pude abrir el puerto {PUERTO}: {e}")
        print("     Puede que ya esté corriendo otra copia del servidor.\n")
        input("     Presiona Enter para cerrar...")
        sys.exit(1)
