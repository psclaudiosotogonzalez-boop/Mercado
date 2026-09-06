const puppeteer = require('puppeteer-core');
const path = require('path');
const RUTA_JUEGO = path.resolve(__dirname, '..', 'Mercado (archivo unico).html');
const CHROMIUM = process.env.CHROMIUM || '/tmp/chromium';

let fallos = 0;
const ck = (c, m) => { if (!c) { console.log('  ✗ ' + m); fallos++; } else console.log('  ✓ ' + m); };

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROMIUM, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage();
  const errores = [];
  p.on('pageerror', e => errores.push(e.message));
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto('file://' + RUTA_JUEGO + '', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));

  /* ═══ Modo vuelto: NUNCA se debe poder pagar justo ═══ */
  console.log('\n── Pago con vuelto: no se puede pagar justo ──');
  const r = await p.evaluate(() => {
    Juego.config.modoPago = 'vuelto';
    Juego.config.listaManual = null;
    const malos = [];
    let ajustados = 0;
    for (let i = 0; i < 150; i++) {
      const nivel = 1 + (i % 4);
      const partida = armarPartida(nivel);
      const total = totalLista(partida.lista);
      const enBilletera = Object.entries(partida.billetera).reduce((s, [v, n]) => s + Number(v) * n, 0);
      if (puedePagarJusto(partida.billetera, total)) {
        malos.push({ nivel, total, billetera: partida.billetera });
      }
      if (enBilletera < total) malos.push({ nivel, total, motivo: 'no alcanza', enBilletera });
      if (enBilletera !== partida.presupuesto) malos.push({ nivel, total, motivo: 'billetera ≠ presupuesto' });
    }
    return { malos, total: 150 };
  });
  ck(r.malos.length === 0, `en 150 partidas con vuelto, ninguna permite pagar justo (fallos: ${r.malos.length})`);
  if (r.malos.length) console.log('   ', JSON.stringify(r.malos.slice(0, 3)));

  /* El caso exacto de la captura: total $14.000 */
  const caso = await p.evaluate(() => {
    Juego.config.modoPago = 'vuelto';
    for (let i = 0; i < 200; i++) {
      const partida = armarPartida(2);
      if (totalLista(partida.lista) === 14000) {
        return { encontrado: true, billetera: partida.billetera, justo: puedePagarJusto(partida.billetera, 14000) };
      }
    }
    return { encontrado: false };
  });
  if (caso.encontrado) {
    ck(!caso.justo, `con total $14.000 la billetera ya no paga justo: ${JSON.stringify(caso.billetera)}`);
  } else {
    console.log('  · no salió un total de $14.000 en la muestra (no es un fallo)');
  }

  /* ═══ Modo exacto: SÍ debe poder pagarse justo ═══ */
  console.log('\n── Pago exacto: sigue siendo posible ──');
  const ex = await p.evaluate(() => {
    Juego.config.modoPago = 'exacto';
    const malos = [];
    for (let i = 0; i < 100; i++) {
      const partida = armarPartida(1 + (i % 4));
      const total = totalLista(partida.lista);
      if (!puedePagarJusto(partida.billetera, total)) malos.push({ total, billetera: partida.billetera });
    }
    return malos;
  });
  ck(ex.length === 0, `en 100 partidas con pago exacto, todas se pueden pagar justo (fallos: ${ex.length})`);
  if (ex.length) console.log('   ', JSON.stringify(ex.slice(0, 3)));

  /* ═══ El vuelto que resulta es razonable ═══ */
  const vueltos = await p.evaluate(() => {
    Juego.config.modoPago = 'vuelto';
    const datos = [];
    for (let i = 0; i < 40; i++) {
      const partida = armarPartida(2);
      const total = totalLista(partida.lista);
      /* El mínimo que se puede pagar sin quedar corto */
      const piezas = [];
      Object.entries(partida.billetera).forEach(([v, n]) => { for (let k = 0; k < n; k++) piezas.push(Number(v)); });
      piezas.sort((a, b) => b - a);
      let mejor = Infinity;
      const buscar = (i, suma) => {
        if (suma >= total) { mejor = Math.min(mejor, suma); return; }
        if (i >= piezas.length) return;
        buscar(i + 1, suma + piezas[i]);
        buscar(i + 1, suma);
      };
      buscar(0, 0);
      datos.push(mejor - total);
    }
    return datos;
  });
  const maxVuelto = Math.max(...vueltos);
  const minVuelto = Math.min(...vueltos);
  ck(minVuelto > 0, `el vuelto mínimo siempre es mayor que cero (mín ${minVuelto})`);
  ck(maxVuelto <= 20000, `el vuelto no se dispara a montos absurdos (máx $${maxVuelto})`);

  ck(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await b.close();
  console.log(fallos ? `\n${fallos} fallos` : '\n✓ El vuelto es obligatorio cuando corresponde');
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
