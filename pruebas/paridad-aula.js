/* ============================================================================
   paridad-aula.js — Los dos servidores de aula tienen que responder igual
   ----------------------------------------------------------------------------
   Hay dos implementaciones del mismo servidor:

     electron/servidor.cjs   el que usa la app de escritorio (Node)
     aula/servidor.py        el respaldo que lanza «Iniciar modo aula.bat»

   Esta prueba recorre una clase completa —entrar, responder, mandar una compra,
   una ronda entera de feria en parejas, sacar a alguien— contra los dos, y
   compara respuesta por respuesta. Si tocas uno y no el otro, falla aquí y no
   en medio de la clase.

   No necesita instalar nada: usa el fetch de Node y levanta los dos servidores
   por su cuenta.

       node paridad-aula.js            # los dos (necesita python en el PATH)
       node paridad-aula.js --solo-node
   ========================================================================== */

const path = require('path');
const { spawn } = require('child_process');
const { iniciarServidor } = require(path.resolve(__dirname, '..', 'electron', 'servidor.cjs'));

const SOLO_NODE = process.argv.indexOf('--solo-node') >= 0;
const PUERTO_NODE = 9331;
const PUERTO_PY = 9332;

let fallos = 0;
const ck = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const esperar = ms => new Promise(r => setTimeout(r, ms));

async function get(puerto, ruta) {
  const r = await fetch(`http://127.0.0.1:${puerto}${ruta}`);
  const txt = await r.text();
  try { return JSON.parse(txt); } catch (e) { return { _status: r.status }; }
}
async function post(puerto, ruta, cuerpo) {
  const r = await fetch(`http://127.0.0.1:${puerto}${ruta}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo)
  });
  return r.json();
}

/* Se ignora lo que por fuerza cambia entre dos ejecuciones: el código de la
   sala y el sello de tiempo de la actividad. */
function normalizar(x) {
  return JSON.stringify(x, (k, v) => (k === 'sinSenal' ? Object.keys(v || {}) : v))
    .replace(/"compra\d+"/g, '"compraX"');
}

/** Una clase entera, paso a paso. Devuelve lo que respondió el servidor. */
async function clase(puerto) {
  const paso = [];
  const anota = async (nombre, promesa) => paso.push([nombre, await promesa]);

  const c = (await get(puerto, '/api/abrir')).codigo;
  paso.push(['abrir', { seisDigitos: /^\d{6}$/.test(String(c)) }]);

  await anota('entrar Ana',            get(puerto, `/api/entrar?c=${c}&n=Ana&f=tabA`));
  await anota('Ana recarga',           get(puerto, `/api/entrar?c=${c}&n=Ana&f=tabA`));
  await anota('otra Ana, otra tablet', get(puerto, `/api/entrar?c=${c}&n=Ana&f=tabB`));
  await anota('entrar Beto',           get(puerto, `/api/entrar?c=${c}&n=Beto&f=tabB`));
  await anota('entrar sin nombre',     get(puerto, `/api/entrar?c=${c}&n=&f=tabC`));
  await anota('código que no existe',  get(puerto, `/api/entrar?c=000000&n=Zoe&f=tabZ`));

  await anota('responder Ana',    get(puerto, `/api/responder?c=${c}&n=Ana&v=2460&ok=1&e=sumar,mental`));
  await anota('responder Beto',   get(puerto, `/api/responder?c=${c}&n=Beto&v=1500&ok=0&e=`));
  await anota('ir al desafío 3',  get(puerto, `/api/ir-a?c=${c}&d=3`));
  await anota('responder Ana d3', get(puerto, `/api/responder?c=${c}&n=Ana&v=7&ok=1&e=probar`));
  await anota('revelar',          get(puerto, `/api/revelar?c=${c}&v=1`));

  await anota('mandar una compra', post(puerto, '/api/actividad', {
    codigo: c,
    actividad: {
      sello: 111, resumen: 'Precio fijo',
      partida: { nivel: 1, catalogo: 'mercado', lista: [{ id: 'leche', subtotal: 1200 }],
                 presupuesto: 5000, billetera: { 1000: 5 }, modoProducto: {} },
      config: { nivel: 1 }
    }
  }));
  await anota('Ana comprando', get(puerto, `/api/progreso?c=${c}&n=Ana&f=comprando&i=2&g=0&p=5000&s=-1&ok=0`));
  await anota('Ana terminó',   get(puerto, `/api/progreso?c=${c}&n=Ana&f=listo&i=3&g=4200&p=5000&s=3&ok=1`));

  await anota('armar los puestos', post(puerto, '/api/parejas', {
    codigo: c, grupos: [{ id: 'p0', miembros: ['Ana', 'Beto'], billetera: { 1000: 10 } }]
  }));
  await anota('feria: pedido',   get(puerto, `/api/feria?c=${c}&n=Ana&g=p0&a=pedido&v=leche:2,huevo:6`));
  await anota('feria: cobro',    get(puerto, `/api/feria?c=${c}&n=Beto&g=p0&a=cobro&v=3120`));
  await anota('feria: disputa',  get(puerto, `/api/feria?c=${c}&n=Ana&g=p0&a=disputa&v=3120`));
  await anota('feria: acepta',   get(puerto, `/api/feria?c=${c}&n=Beto&g=p0&a=aceptar_propuesta&v=`));
  await anota('feria: pago',     get(puerto, `/api/feria?c=${c}&n=Ana&g=p0&a=pago&v=5000`));
  await anota('feria: vuelto',   get(puerto, `/api/feria?c=${c}&n=Beto&g=p0&a=vuelto&v=1880`));
  await anota('feria: revisión', get(puerto, `/api/feria?c=${c}&n=Ana&g=p0&a=revision&v=bien&cb=1&vb=1&rb=1`));
  await anota('feria: siguiente', get(puerto, `/api/feria?c=${c}&n=Beto&g=p0&a=siguiente&v=`));
  await anota('feria: puesto que no existe', get(puerto, `/api/feria?c=${c}&n=Ana&g=pZ&a=pedido&v=`));

  await anota('sacar a Beto',            get(puerto, `/api/sacar?c=${c}&n=Beto`));
  await anota('Beto vuelve, otra tablet', get(puerto, `/api/entrar?c=${c}&n=Beto&f=tabQ`));
  await anota('Ana se despide',          get(puerto, `/api/salir?c=${c}&n=Ana`));
  await anota('acción inventada',        get(puerto, `/api/inventada?c=${c}`));

  const estado = await get(puerto, `/api/estado?c=${c}`);
  paso.push(['estado final', estado]);
  paso.push(['ruta que no es api', await get(puerto, '/otra-cosa')]);

  return { paso, estado };
}

/** Levanta aula/servidor.py en un puerto de prueba. Devuelve null si no hay Python. */
function levantarPython() {
  const guion = `
import importlib.util, sys
from http.server import ThreadingHTTPServer
spec = importlib.util.spec_from_file_location("servidor", r"${path.resolve(__dirname, '..', 'aula', 'servidor.py')}")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
s = ThreadingHTTPServer(("127.0.0.1", ${PUERTO_PY}), m.Handler)
print("listo", flush=True)
s.serve_forever()
`;
  for (const cmd of ['python', 'python3', 'py']) {
    try {
      const p = spawn(cmd, ['-c', guion], { stdio: ['ignore', 'pipe', 'pipe'] });
      if (p.pid) return p;
    } catch (e) { /* probamos el siguiente nombre */ }
  }
  return null;
}

(async () => {
  const srv = await iniciarServidor({ juegoHtml: '<html>juego</html>', puerto: PUERTO_NODE });
  const node = await clase(srv.puerto);

  console.log('== El servidor de la app, por su cuenta ==');
  ck(node.estado.alumnos.length === 1 && node.estado.alumnos[0] === 'Beto', 'queda solo Beto tras sacarlo y que Ana se despida');
  ck(!!node.paso.find(p => p[0] === 'otra Ana, otra tablet')[1].error, 'dos estudiantes con el mismo nombre no se pisan');
  ck(!node.paso.find(p => p[0] === 'Ana recarga')[1].error, 'la misma tablet reconecta sin problema');
  ck(!node.paso.find(p => p[0] === 'Beto vuelve, otra tablet')[1].error, 'al sacar a alguien, su nombre queda libre');
  ck(node.paso.find(p => p[0] === 'ruta que no es api')[1]._status === 404, 'no se sirve ningún archivo suelto');
  const g = node.estado.grupos.p0;
  ck(g && g.ronda === 1 && g.etapa === 'pedido' && g.hechas.length === 1, 'la feria cerró una ronda y volvió al pedido');
  ck(g && g.hechas[0].cobro === 3120, 'la ronda quedó anotada con su cobro');
  ck(Object.keys(node.estado.historial.Ana || {}).length === 3, 'el historial de Ana guarda 2 desafíos y 1 compra');

  if (!SOLO_NODE) {
    const py = levantarPython();
    if (!py) {
      console.log('\n  (sin Python en el PATH: me salto la comparación con el respaldo)');
    } else {
      await new Promise(r => { py.stdout.once('data', r); setTimeout(r, 4000); });
      await esperar(300);
      console.log('\n== Paridad con el respaldo en Python ==');
      try {
        const pyClase = await clase(PUERTO_PY);
        /* Diferencia buscada: el servidor de la app no sirve archivos sueltos,
           así que su 404 no repite la ruta pedida. Lo demás debe calzar. */
        const aparte = ['ruta que no es api'];
        let distintos = 0;
        for (let i = 0; i < node.paso.length; i++) {
          const [nombre, aNode] = node.paso[i];
          const aPy = pyClase.paso[i][1];
          if (aparte.indexOf(nombre) >= 0) {
            ck(aNode._status === 404 && aPy._status === 404, `${nombre}: los dos dan 404 (el texto difiere a propósito)`);
            continue;
          }
          if (normalizar(aNode) !== normalizar(aPy)) {
            distintos++;
            console.log(`  ✗ ${nombre}\n      app    : ${normalizar(aNode).slice(0, 200)}\n      python : ${normalizar(aPy).slice(0, 200)}`);
          }
        }
        ck(distintos === 0, `${node.paso.length - aparte.length} llamadas idénticas en los dos servidores`);
      } finally {
        py.kill();
      }
    }
  }

  await srv.detener();
  console.log(fallos ? `\n${fallos} fallos` : '\n✓ Paridad OK');
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
