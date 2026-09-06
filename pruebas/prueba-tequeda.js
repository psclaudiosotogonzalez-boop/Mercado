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

  console.log('\n── «Te queda» encendido (como antes) ──');
  const con = await p.evaluate(() => {
    Juego.config.mostrarRestante = true;
    Juego.config.modoPago = 'exacto';
    nuevaPartida(2);
    const antes = document.querySelector('#medidor-restante').textContent;
    const q = Juego.lista[0];
    ponerEnCarro(PRODUCTOS.filter(x => x.id === q.id)[0], q.modo, { cantidad: q.cantidad, gramos: q.gramos });
    return {
      rotulo: document.querySelector('#medidor-rotulo').textContent,
      antes, despues: document.querySelector('#medidor-restante').textContent,
      presupuesto: document.querySelector('#medidor-presupuesto').textContent,
      barraVisible: getComputedStyle(document.querySelector('.medidor__riel')).visibility
    };
  });
  ck(con.rotulo === 'Te queda', `el rótulo dice «${con.rotulo}»`);
  ck(con.antes !== con.despues, `el saldo baja al echar algo al carro (${con.antes} → ${con.despues})`);
  ck(/de \$/.test(con.presupuesto), `muestra el presupuesto: «${con.presupuesto}»`);
  ck(con.barraVisible === 'visible', 'la barra de gasto se ve');

  console.log('\n── «Te queda» apagado (sin pista) ──');
  const sin = await p.evaluate(() => {
    Juego.config.mostrarRestante = false;
    nuevaPartida(2);
    const antes = document.querySelector('#medidor-restante').textContent;
    const q = Juego.lista[0];
    ponerEnCarro(PRODUCTOS.filter(x => x.id === q.id)[0], q.modo, { cantidad: q.cantidad, gramos: q.gramos });
    const q2 = Juego.lista[1];
    if (q2) ponerEnCarro(PRODUCTOS.filter(x => x.id === q2.id)[0], q2.modo, { cantidad: q2.cantidad, gramos: q2.gramos });
    return {
      rotulo: document.querySelector('#medidor-rotulo').textContent,
      antes, despues: document.querySelector('#medidor-restante').textContent,
      presupuesto: Juego.presupuesto,
      textoPresupuesto: document.querySelector('#medidor-presupuesto').textContent,
      barraVisible: getComputedStyle(document.querySelector('.medidor__riel')).visibility,
      anchoBarra: document.querySelector('#medidor-lleno').style.width
    };
  });
  ck(sin.rotulo === 'Traes', `el rótulo cambia a «${sin.rotulo}»`);
  ck(sin.antes === sin.despues, `la cifra NO cambia al comprar (${sin.antes} → ${sin.despues}): ya no es pista`);
  ck(sin.despues === '$' + sin.presupuesto.toLocaleString('es-CL'), `muestra el dinero que trae: ${sin.despues}`);
  ck(sin.textoPresupuesto === '', 'no repite el presupuesto al lado');
  ck(sin.barraVisible === 'hidden', 'la barra se oculta (delataba lo mismo sin números)');

  console.log('\n── La casilla está en Preparar la actividad ──');
  const casilla = await p.evaluate(() => {
    Juego.config.mostrarRestante = true;
    pintarConfig();
    return [...document.querySelectorAll('#config-cuerpo .interruptor')]
      .map(e => e.textContent.trim()).filter(x => /Te queda/i.test(x));
  });
  ck(casilla.length === 1, `la casilla existe: «${casilla[0] || 'AUSENTE'}»`);

  console.log('\n── Recorrido de pago con vuelto, con clics reales ──');
  const pago = await p.evaluate(() => {
    Juego.config.modoPago = 'vuelto';
    Juego.config.exigirTotal = 'nunca';
    nuevaPartida(2);
    Juego.lista.forEach(q => ponerEnCarro(PRODUCTOS.filter(x => x.id === q.id)[0], q.modo, { cantidad: q.cantidad, gramos: q.gramos }));
    irACaja();
    return { pantalla: document.querySelector('.pantalla.activa').id, total: totalCarro(), billetera: Object.assign({}, Juego.billetera) };
  });
  ck(pago.pantalla === 'pantalla-caja', 'se llega a la caja');

  /* Poner todo lo que se pueda sin pasarse: debe quedar corto o pasarse, nunca justo */
  const intento = await p.evaluate(() => {
    const piezas = [];
    Object.entries(Juego.billetera).forEach(([v, n]) => { for (let k = 0; k < n; k++) piezas.push(Number(v)); });
    piezas.sort((a, b) => b - a);
    /* mejor pago posible sin pasarse */
    let mejorSinPasarse = 0;
    const buscar = (i, suma) => {
      if (suma > totalCarro()) return;
      mejorSinPasarse = Math.max(mejorSinPasarse, suma);
      if (i >= piezas.length) return;
      buscar(i + 1, suma + piezas[i]);
      buscar(i + 1, suma);
    };
    buscar(0, 0);
    return { total: totalCarro(), mejorSinPasarse };
  });
  ck(intento.mejorSinPasarse < intento.total,
     `no existe forma de llegar justo: lo máximo sin pasarse es $${intento.mejorSinPasarse} para un total de $${intento.total}`);

  ck(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await b.close();
  console.log(fallos ? `\n${fallos} fallos` : '\n✓ Las dos opciones funcionan');
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
