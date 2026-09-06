const puppeteer = require('puppeteer-core');
const path = require('path');
const RUTA_JUEGO = path.resolve(__dirname, '..', 'Mercado (archivo unico).html');
const CHROMIUM = process.env.CHROMIUM || '/tmp/chromium';

let fallos = 0;
const ck = (c, m) => { if (!c) { console.log('  ✗ ' + m); fallos++; } else console.log('  ✓ ' + m); };
const esperar = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROMIUM, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage();
  const errores = [];
  p.on('pageerror', e => errores.push(e.message));
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto('file://' + RUTA_JUEGO + '', { waitUntil: 'networkidle0' });
  await esperar(400);

  const irACajaCon = async (mostrar) => p.evaluate(m => {
    Juego.config.mostrarSumaBandeja = m;
    Juego.config.modoPago = 'vuelto';
    Juego.config.exigirTotal = 'nunca';
    nuevaPartida(2);
    Juego.lista.forEach(q => ponerEnCarro(PRODUCTOS.filter(x => x.id === q.id)[0], q.modo, { cantidad: q.cantidad, gramos: q.gramos }));
    irACaja();
    /* pone una sola pieza, insuficiente */
    const menor = Math.min(...Object.keys(Juego.billetera).map(Number));
    ponerEnBandeja(menor);
    return {
      texto: document.querySelector('#caja-cuerpo').innerText,
      total: totalCarro(), puesto: totalPagado(),
      totalTexto: pesos(totalCarro()), puestoTexto: pesos(totalPagado())
    };
  }, mostrar);

  console.log('\n── Suma de la bandeja apagada (lo que pediste) ──');
  const sin = await irACajaCon(false);
  ck(!sin.texto.includes(sin.puestoTexto), `no aparece la suma de lo puesto (${sin.puestoTexto})`);
  ck(!/Faltan \$/.test(sin.texto), 'tampoco aparece «Faltan $…»');
  ck(/Cuenta lo que pusiste/.test(sin.texto), 'aparece el recordatorio neutro en su lugar');
  ck(sin.texto.includes(sin.totalTexto), `el total a pagar sí se sigue viendo (${sin.totalTexto})`);

  /* El botón Pagar tampoco debe delatar la diferencia */
  const aviso = await p.evaluate(() => { intentarPagar(); return (document.querySelector('.aviso') || {}).textContent || ''; });
  await esperar(200);
  ck(!/\$/.test(aviso), `el aviso al pagar no dice cifras: «${aviso}»`);

  console.log('\n── Suma de la bandeja encendida (como antes) ──');
  const con = await irACajaCon(true);
  ck(con.texto.includes(con.puestoTexto), `vuelve a mostrar la suma puesta (${con.puestoTexto})`);
  ck(/Faltan \$/.test(con.texto), 'y el «Faltan $…»');
  const aviso2 = await p.evaluate(() => { intentarPagar(); return (document.querySelector('.aviso') || {}).textContent || ''; });
  await esperar(200);
  ck(/\$/.test(aviso2), `y el aviso vuelve a dar la cifra: «${aviso2}»`);

  console.log('\n── La casilla está en Preparar la actividad ──');
  const casilla = await p.evaluate(() => {
    pintarConfig();
    return [...document.querySelectorAll('#config-cuerpo .interruptor')]
      .map(e => e.textContent.trim()).filter(x => /bandeja/i.test(x));
  });
  ck(casilla.length === 1, `existe la casilla: «${casilla[0] || 'AUSENTE'}»`);

  console.log('\n── Se puede pagar igual, contando ──');
  const paga = await p.evaluate(() => {
    Juego.config.mostrarSumaBandeja = false;
    Juego.config.modoPago = 'vuelto'; Juego.config.exigirTotal = 'nunca';
    nuevaPartida(2);
    Juego.lista.forEach(q => ponerEnCarro(PRODUCTOS.filter(x => x.id === q.id)[0], q.modo, { cantidad: q.cantidad, gramos: q.gramos }));
    irACaja();
    /* paga poniendo de mayor a menor hasta cubrir */
    const piezas = Object.keys(Juego.billetera).map(Number).sort((a, b) => b - a);
    let intentos = 0;
    while (totalPagado() < totalCarro() && intentos++ < 40) {
      const v = piezas.find(x => disponible(x) > 0);
      if (!v) break;
      ponerEnBandeja(v);
    }
    intentarPagar();
    return document.querySelector('.pantalla.activa').id;
  });
  ck(paga === 'pantalla-vuelto' || paga === 'pantalla-boleta', `la compra se completa igual (llegó a ${paga})`);

  ck(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await b.close();
  console.log(fallos ? `\n${fallos} fallos` : '\n✓ La suma de la bandeja ya no es pista');
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
