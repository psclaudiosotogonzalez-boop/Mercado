const puppeteer = require('puppeteer-core');
const CHROMIUM = process.env.CHROMIUM || '/tmp/chromium';
const BASE = 'http://localhost:8080';
let fallos = 0;
const ck = (c, m) => { if (!c) { console.log('  ✗ ' + m); fallos++; } else console.log('  ✓ ' + m); };
const esperar = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const nav = await puppeteer.launch({ executablePath: CHROMIUM, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const errores = [];
  const profe = await nav.newPage();
  profe.on('pageerror', e => errores.push(e.message));
  await profe.setViewport({ width: 1280, height: 900 });
  await profe.goto(BASE, { waitUntil: 'networkidle0' });
  await esperar(600);
  await profe.evaluate(() => { pintarAula(); mostrarPantalla('aula'); abrirClase(); });
  await esperar(800);
  const codigo = await profe.evaluate(() => Aula.codigo);

  const tabs = [];
  for (const n of ['Ana', 'Beto', 'Caro']) {
    const p = await nav.newPage();
    p.on('pageerror', e => errores.push(n + ': ' + e.message));
    await p.setViewport({ width: 820, height: 1180, isMobile: true, hasTouch: true });
    await p.goto(BASE, { waitUntil: 'networkidle0' });
    await p.evaluate((c, nn) => {
      pintarAula(); mostrarPantalla('aula'); pintarEntrada();
      document.querySelectorAll('#aula-cuerpo .entrada')[0].value = c;
      document.querySelectorAll('#aula-cuerpo .entrada')[1].value = nn;
      [...document.querySelectorAll('#aula-cuerpo .btn')].find(x => x.textContent === 'Entrar').click();
    }, codigo, n);
    tabs.push({ n, p });
    await esperar(150);
  }
  await esperar(1200);

  /* El profesor manda una compra con vuelto y «Te queda» apagado */
  await profe.evaluate(() => {
    Juego.config.nivel = 2;
    Juego.config.modoPago = 'vuelto';
    Juego.config.mostrarRestante = false;
    Juego.config.mostrarSumaBandeja = false;
    Juego.config.presupuestoAuto = true;
    Juego.config.listaManual = null;
    Aula.vista = 'compras'; pintarProfesor(); mandarCompra();
  });
  await esperar(1900);

  const enTablets = await Promise.all(tabs.map(t => t.p.evaluate(() => ({
    pantalla: document.querySelector('.pantalla.activa').id,
    lista: Juego.lista.map(x => `${x.id}:${x.cantidad || x.gramos}`).join('|'),
    billetera: JSON.stringify(Juego.billetera),
    total: totalLista(Juego.lista),
    justo: puedePagarJusto(Juego.billetera, totalLista(Juego.lista)),
    rotulo: document.querySelector('#medidor-rotulo').textContent,
    sumaBandeja: Juego.config.mostrarSumaBandeja,
    modoPago: Juego.config.modoPago
  }))));

  ck(enTablets.every(x => x.pantalla === 'pantalla-mercado'), 'las 3 tablets reciben la compra');
  ck(new Set(enTablets.map(x => x.billetera)).size === 1, 'todas reciben la MISMA billetera');
  ck(enTablets.every(x => !x.justo),
     `ninguna puede pagar justo (total $${enTablets[0].total}, billetera ${enTablets[0].billetera})`);
  ck(enTablets.every(x => x.rotulo === 'Traes'), 'el ajuste de «Te queda» viaja con la actividad');

  ck(enTablets.every(x => x.sumaBandeja === false), 'el ajuste de la suma de la bandeja también viaja');

  ck(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.slice(0,2).join(' | ') : ''));
  await nav.close();
  console.log(fallos ? `\n${fallos} fallos` : '\n✓ El modo aula respeta las dos opciones nuevas');
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
