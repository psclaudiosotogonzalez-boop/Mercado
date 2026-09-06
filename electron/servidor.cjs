/* ============================================================================
   servidor.cjs — Modo aula, dentro de la aplicación
   ----------------------------------------------------------------------------
   Es el mismo servidor que «aula/servidor.py», traducido a Node para que viva
   dentro de la app de escritorio: así el profesor no tiene que instalar Python
   ni arrancar una ventana negra aparte. Las rutas, los nombres de los campos y
   la forma de las respuestas son idénticos, porque el juego que corre en las
   tablets no cambió ni una línea.

   «aula/servidor.py» se conserva como respaldo: si algún día la app falla en la
   sala, el .bat de siempre sigue levantando exactamente esto mismo.

   Diferencia deliberada con la versión Python: aquí NO se sirven archivos
   sueltos de la carpeta. El juego es un solo HTML autocontenido, así que se
   entrega ese y nada más; no hay ninguna ruta que pueda apuntar a otro archivo
   del computador del profesor.
   ========================================================================== */

const http = require('http');
const os = require('os');

/* Una sala se borra sola si nadie la toca en este tiempo */
const CADUCIDAD = 60 * 60 * 6;

/* Cuánto silencio hace falta para marcar una tablet como «sin señal».
   No se la saca de la lista: los navegadores de tablet frenan los temporizadores
   cuando la pantalla se atenúa o el estudiante cambia de aplicación, así que
   alguien que está pensando puede pasar un rato sin dar señales. */
const SILENCIO = 45;

const ahora = () => Date.now() / 1000;

/** Una clase en curso: quiénes están y en qué van. */
class Sala {
  constructor() {
    this.alumnos = {};      // nombre -> última vez que dio señales
    this.fichas = {};       // nombre -> qué tablet lo está usando
    this.respuestas = {};   // nombre -> {valor, correcta, estrategias}
    this.progreso = {};     // nombre -> en qué va de la compra
    this.historial = {};    // nombre -> lo que respondió en cada actividad
    this.grupos = {};       // id -> puesto de feria con sus integrantes
    this.actividad = null;  // la compra que el profesor mandó a las tablets
    this.desafio = 0;
    this.revelado = false;
    this.version = 0;       // sube con cada cambio; las tablets lo miran
    this.tocada = ahora();
  }

  cambio() {
    this.version += 1;
    this.tocada = ahora();
  }

  /** Quiénes llevan rato sin dar señales, sin sacarlos de la lista. */
  sinSenal() {
    const t = ahora();
    const salida = {};
    for (const nombre of Object.keys(this.alumnos)) {
      const callado = t - this.alumnos[nombre];
      if (callado > SILENCIO) salida[nombre] = Math.round(callado);
    }
    return salida;
  }

  /** Guarda lo que respondió, para poder verlo después en Seguimiento. */
  anotar(nombre, clave, datos) {
    if (!this.historial[nombre]) this.historial[nombre] = {};
    this.historial[nombre][clave] = datos;
  }

  resumen() {
    return {
      version: this.version,
      desafio: this.desafio,
      revelado: this.revelado,
      alumnos: Object.keys(this.alumnos),
      respuestas: this.respuestas,
      progreso: this.progreso,
      actividad: this.actividad,
      historial: this.historial,
      grupos: this.grupos,
      sinSenal: this.sinSenal()
    };
  }
}

/** La dirección que los estudiantes escriben en la tablet. */
function ipLocal() {
  const redes = os.networkInterfaces();
  let respaldo = null;
  for (const nombre of Object.keys(redes)) {
    for (const cara of redes[nombre] || []) {
      if (cara.family !== 'IPv4' || cara.internal) continue;
      /* Las 169.254.x.x son de «no encontré router»: sirven de último recurso,
         pero se prefiere cualquier otra. */
      if (cara.address.indexOf('169.254.') === 0) { respaldo = respaldo || cara.address; continue; }
      return cara.address;
    }
  }
  return respaldo || '127.0.0.1';
}

/* --- Utilidades de petición ----------------------------------------------- */
const entero = (v, porDefecto) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : (porDefecto === undefined ? 0 : porDefecto);
};

function responderJson(res, datos) {
  const cuerpo = Buffer.from(JSON.stringify(datos), 'utf8');
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': cuerpo.length
  });
  res.end(cuerpo);
}

function noEncontrado(res, texto) {
  const cuerpo = Buffer.from(texto || 'No encuentro eso', 'utf8');
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': cuerpo.length });
  res.end(cuerpo);
}

/* ============================================================================
   Arranque
   ----------------------------------------------------------------------------
   iniciarServidor({ juegoHtml, puerto }) devuelve una promesa con
   { puerto, ip, url, detener }. Si el puerto preferido está ocupado prueba los
   siguientes, porque en el computador del profesor puede haber quedado otra
   copia corriendo.
   ========================================================================== */
function iniciarServidor(opciones) {
  const juegoHtml = Buffer.from(opciones.juegoHtml, 'utf8');
  const puertoPreferido = opciones.puerto || 8080;
  const intentos = opciones.intentos || 12;

  const salas = {};

  const limpieza = setInterval(() => {
    const t = ahora();
    for (const codigo of Object.keys(salas)) {
      if (t - salas[codigo].tocada > CADUCIDAD) delete salas[codigo];
    }
  }, 600 * 1000);
  if (limpieza.unref) limpieza.unref();

  /* --- El juego ---------------------------------------------------------- */
  function servirJuego(res) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': juegoHtml.length
    });
    res.end(juegoHtml);
  }

  /* --- POST: la compra dirigida y los puestos de feria --------------------
     Van por POST porque llevan listas completas de productos y billetes, que no
     caben en una dirección. Así todas las tablets trabajan con los mismos datos. */
  function manejarPost(req, res, ruta) {
    let crudo = '';
    let excedido = false;
    req.on('data', trozo => {
      crudo += trozo;
      if (crudo.length > 4 * 1024 * 1024) { excedido = true; req.destroy(); }
    });
    req.on('end', () => {
      if (excedido) return;
      let datos;
      try { datos = JSON.parse(crudo); } catch (e) { return responderJson(res, { error: 'no entendí los datos' }); }

      const sala = salas[datos && datos.codigo];
      if (!sala) return responderJson(res, { error: 'Ese código no existe' });

      if (ruta === '/api/actividad') {
        sala.actividad = datos.actividad;
        sala.grupos = {};
        sala.progreso = {};
        sala.respuestas = {};          // el historial se conserva
        sala.revelado = false;
        sala.cambio();
        return responderJson(res, { ok: true });
      }

      if (ruta === '/api/parejas') {
        sala.grupos = {};
        sala.actividad = null;
        for (const g of datos.grupos || []) {
          Object.assign(g, {
            ronda: 0, etapa: 'pedido', pedido: [],
            cobro: null, propuesta: null, pago: 0,
            vuelto: null, revision: null, hechas: []
          });
          sala.grupos[g.id] = g;
        }
        sala.cambio();
        return responderJson(res, { ok: true });
      }

      return noEncontrado(res);
    });
  }

  /* --- GET: todo lo demás ------------------------------------------------- */
  function manejarGet(req, res, ruta, q) {
    if (ruta === '/' || ruta === '/jugar' || ruta === '/index.html') return servirJuego(res);

    /* El juego es un solo archivo autocontenido: no hay más que servir. */
    if (ruta.indexOf('/api/') !== 0) return noEncontrado(res);

    const accion = ruta.slice(5);

    /* El profesor abre la sala */
    if (accion === 'abrir') {
      let codigo = String(Math.floor(100000 + Math.random() * 900000));
      while (salas[codigo]) codigo = String(Math.floor(100000 + Math.random() * 900000));
      salas[codigo] = new Sala();
      return responderJson(res, { codigo: codigo });
    }

    const sala = salas[q.get('c') || ''];
    if (!sala) return responderJson(res, { error: 'Ese código no existe' });

    /* Un estudiante entra */
    if (accion === 'entrar') {
      const nombre = (q.get('n') || '').trim().slice(0, 20);
      const ficha = (q.get('f') || '').trim().slice(0, 40);
      if (!nombre) return responderJson(res, { error: 'Falta el nombre' });

      /* Dos estudiantes que se llaman igual compartían ficha, respuestas y
         progreso, y en el tablero aparecía uno solo. Cada tablet manda una ficha
         propia: si el nombre ya lo tiene OTRA tablet, se avisa; si la ficha
         coincide es la misma volviendo tras recargarse. */
      const duena = sala.fichas[nombre];
      if (duena && ficha && duena !== ficha) {
        return responderJson(res, { error: 'Ya hay alguien con ese nombre. Agrega tu apellido, o pídele al profesor que te saque de la lista.' });
      }
      sala.fichas[nombre] = ficha || duena || '';
      sala.alumnos[nombre] = ahora();
      sala.cambio();
      return responderJson(res, { ok: true, desafio: sala.desafio, revelado: sala.revelado });
    }

    /* Un estudiante cuenta en qué va de su compra */
    if (accion === 'progreso') {
      const nombre = q.get('n') || '';
      sala.alumnos[nombre] = ahora();
      const dato = {
        fase: q.get('f') || '',
        items: entero(q.get('i')),
        gastado: entero(q.get('g')),
        presupuesto: entero(q.get('p')),
        estrellas: entero(q.get('s'), -1),
        completo: q.get('ok') === '1'
      };
      sala.progreso[nombre] = dato;
      if (dato.fase === 'listo' && sala.actividad) {
        sala.anotar(nombre, 'compra' + (sala.actividad.sello || ''),
          Object.assign({}, dato, { resumen: sala.actividad.resumen || 'Compra' }));
      }
      sala.cambio();
      return responderJson(res, { ok: true });
    }

    /* El profesor lleva a todos al mismo desafío */
    if (accion === 'ir-a') {
      sala.desafio = entero(q.get('d'));
      sala.respuestas = {};
      sala.progreso = {};
      sala.actividad = null;          // se vuelve a los desafíos
      sala.revelado = false;
      sala.cambio();
      return responderJson(res, { ok: true });
    }

    /* El profesor muestra las respuestas para comentarlas */
    if (accion === 'revelar') {
      sala.revelado = (q.get('v') || '1') === '1';
      sala.cambio();
      return responderJson(res, { ok: true });
    }

    /* Un estudiante responde */
    if (accion === 'responder') {
      const nombre = q.get('n') || '';
      sala.alumnos[nombre] = ahora();
      const dato = {
        valor: q.get('v') || '',
        correcta: q.get('ok') === '1',
        estrategias: (q.get('e') || '').split(',').filter(Boolean)
      };
      sala.respuestas[nombre] = dato;
      sala.anotar(nombre, 'd' + sala.desafio, Object.assign({}, dato, { desafio: sala.desafio }));
      sala.cambio();
      return responderJson(res, { ok: true });
    }

    /* El profesor saca a alguien de la lista */
    if (accion === 'sacar') {
      const nombre = q.get('n') || '';
      delete sala.alumnos[nombre];
      delete sala.fichas[nombre];     // el nombre queda libre otra vez
      delete sala.respuestas[nombre];
      delete sala.progreso[nombre];
      sala.cambio();
      return responderJson(res, { ok: true });
    }

    /* Una tablet se despide */
    if (accion === 'salir') {
      const nombre = q.get('n') || '';
      delete sala.alumnos[nombre];
      delete sala.fichas[nombre];
      sala.cambio();
      return responderJson(res, { ok: true });
    }

    /* Avanza el trabajo de un puesto de feria */
    if (accion === 'feria') {
      const g = sala.grupos[q.get('g') || ''];
      if (!g) return responderJson(res, { error: 'ese puesto no existe' });
      const nombre = q.get('n') || '';
      sala.alumnos[nombre] = ahora();
      const paso = q.get('a') || '';

      if (paso === 'pedido') {
        g.pedido = (q.get('v') || '').split(',').filter(Boolean);
        g.etapa = 'cobro';
      } else if (paso === 'cobro') {
        g.cobro = entero(q.get('v'));
        g.etapa = 'pago';
      } else if (paso === 'pago') {
        g.pago = entero(q.get('v'));
        g.etapa = 'vuelto';
      } else if (paso === 'vuelto') {
        g.vuelto = entero(q.get('v'));
        g.etapa = 'revision';
      } else if (paso === 'disputa') {
        /* El comprador no acepta el cobro y dice cuál cree que es el monto
           correcto. Queda pendiente de que el feriante lo revise: puede
           aceptarlo o preferir recalcular él mismo. */
        g.propuesta = entero(q.get('v'));
        g.etapa = 'disputa';
      } else if (paso === 'aceptar_propuesta') {
        /* El feriante está de acuerdo: el monto que dijo el comprador pasa a ser
           el cobro, y se sigue pagando con él. */
        g.cobro = g.propuesta;
        g.propuesta = null;
        g.etapa = 'pago';
      } else if (paso === 'rechazar_propuesta') {
        /* El feriante prefiere recalcular por su cuenta, sin usar el número que
           propuso el comprador. */
        g.propuesta = null;
        g.cobro = null;
        g.pago = 0;
        g.etapa = 'cobro';
      } else if (paso === 'revision') {
        g.revision = q.get('v') || '';
        g.etapa = 'cierre';
        g.hechas.push({
          ronda: g.ronda, pedido: g.pedido,
          cobro: g.cobro, pago: g.pago,
          vuelto: g.vuelto, revision: g.revision,
          cobroBien: q.get('cb') === '1',
          vueltoBien: q.get('vb') === '1',
          revisionBien: q.get('rb') === '1'
        });
      } else if (paso === 'siguiente') {
        g.ronda += 1;
        g.etapa = 'pedido';
        g.pedido = []; g.cobro = null; g.propuesta = null; g.pago = 0;
        g.vuelto = null; g.revision = null;
      }

      sala.cambio();
      return responderJson(res, { ok: true });
    }

    /* Todos preguntan por novedades */
    if (accion === 'estado') {
      sala.tocada = ahora();
      const nombre = q.get('n');
      if (nombre && sala.alumnos[nombre] != null) sala.alumnos[nombre] = ahora();
      return responderJson(res, sala.resumen());
    }

    return responderJson(res, { error: 'no encuentro esa acción' });
  }

  /* --- El servidor --------------------------------------------------------- */
  const servidor = http.createServer((req, res) => {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch (e) {
      return noEncontrado(res);
    }
    try {
      if (req.method === 'POST') return manejarPost(req, res, url.pathname);
      if (req.method === 'GET') return manejarGet(req, res, url.pathname, url.searchParams);
      return noEncontrado(res);
    } catch (e) {
      /* Una petición rota de una tablet no puede tumbar la clase entera */
      console.error('[aula] petición con problemas:', e && e.message);
      try { responderJson(res, { error: 'algo salió mal' }); } catch (e2) { /* ya respondió */ }
    }
  });

  return new Promise((listo, falla) => {
    let puerto = puertoPreferido;
    let restantes = intentos;

    servidor.on('error', err => {
      if (err.code === 'EADDRINUSE' && restantes-- > 0) {
        puerto += 1;
        servidor.listen(puerto, '0.0.0.0');
        return;
      }
      falla(err);
    });

    servidor.on('listening', () => {
      const ip = ipLocal();
      listo({
        puerto: puerto,
        ip: ip,
        /* La ventana del profesor se abre en la dirección de red, no en
           127.0.0.1: así la pantalla «En la tablet, escribir» muestra la
           dirección que de verdad tienen que escribir los estudiantes. */
        url: 'http://' + ip + ':' + puerto + '/',
        urlLocal: 'http://127.0.0.1:' + puerto + '/',
        salas: salas,
        detener: () => new Promise(fin => { clearInterval(limpieza); servidor.close(fin); })
      });
    });

    servidor.listen(puerto, '0.0.0.0');
  });
}

module.exports = { iniciarServidor, Sala, ipLocal, SILENCIO, CADUCIDAD };
