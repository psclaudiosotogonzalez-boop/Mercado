#!/usr/bin/env python3
"""
construir.py — Genera "Mercado (archivo unico).html"

Toma el proyecto en carpetas y lo empaqueta en un solo archivo HTML con el CSS,
el JavaScript y las imagenes del dinero incrustadas. Ese archivo funciona aunque
se abra suelto, sin las carpetas al lado.

Uso:  python3 construir.py
"""

import base64
import pathlib
import re

RAIZ = pathlib.Path(__file__).parent
SALIDA = RAIZ / "Mercado (archivo unico).html"

# El orden importa: cada archivo usa lo definido en los anteriores.
JS = ["util.js", "data.js", "svg.js", "lista.js", "mercado.js", "caja.js", "desafios.js", "feria.js", "aula.js", "app.js"]


def como_data_uri(ruta: pathlib.Path) -> str:
    """Convierte una imagen en una URL de datos incrustable."""
    datos = base64.b64encode(ruta.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{datos}"


def main() -> None:
    html = (RAIZ / "index.html").read_text(encoding="utf-8")
    css = (RAIZ / "css" / "style.css").read_text(encoding="utf-8")

    # --- JavaScript: se concatena en orden y se incrustan las imagenes -------
    partes = []
    for nombre in JS:
        codigo = (RAIZ / "js" / nombre).read_text(encoding="utf-8")

        # Reemplaza cada ruta 'img/...png' por su contenido en base64. Se hace en
        # todos los modulos, no solo en data.js: el dinero vive en data.js y los
        # pictogramas de los productos en svg.js.
        def incrustar(m):
            ruta = RAIZ / m.group(1)
            if not ruta.exists():
                raise SystemExit(f"Falta la imagen: {ruta}")
            return f"'{como_data_uri(ruta)}'"

        codigo = re.sub(r"'(img/[^']+\.png)'", incrustar, codigo)

        # Cada modulo va en su propio bloque <script>. Si un navegador viejo no
        # entendiera uno de ellos, los demas siguen funcionando en vez de caerse
        # el juego completo, igual que en la version en carpetas.
        partes.append(f"<script>\n/* ===== {nombre} ===== */\n{codigo}\n</script>")

    js = "\n".join(partes)

    # --- Sustituye las etiquetas externas por bloques en linea --------------
    html = html.replace(
        '<link rel="stylesheet" href="css/style.css">',
        f"<style>\n{css}\n</style>",
    )

    bloque_scripts = re.search(
        r'<script src="js/util\.js"></script>.*?<script src="js/app\.js"></script>',
        html,
        re.S,
    )
    if not bloque_scripts:
        raise SystemExit("No encontre las etiquetas <script> en index.html")

    html = html.replace(bloque_scripts.group(0), js)

    # Aviso al principio del archivo, para quien lo abra en un editor
    html = html.replace(
        "<head>",
        "<head>\n<!-- Archivo unico autocontenido. Generado por construir.py.\n"
        "     Para editar el juego, usa la version en carpetas. -->",
    )

    SALIDA.write_text(html, encoding="utf-8")
    print(f"Listo: {SALIDA.name}  ({SALIDA.stat().st_size // 1024} KB)")

    # El modo aula sirve su propia copia del juego. Copiarla a mano se olvida, y
    # entonces las tablets reciben la version anterior: un fallo que solo aparece
    # en plena clase y cuesta mucho de entender ahi.
    copia = RAIZ / "aula" / SALIDA.name
    if copia.parent.is_dir():
        copia.write_text(html, encoding="utf-8")
        print(f"Copiado a:  aula/{SALIDA.name}")


if __name__ == "__main__":
    main()
