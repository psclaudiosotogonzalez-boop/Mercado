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

  /* Los cuatro niveles siguen armando partidas válidas */
  for (const n of [1, 2, 3, 4]) {
    const r = await p.evaluate(nivel => {
      Juego.config.modoPago = 'nivel'; Juego.config.listaManual = null;
      nuevaPartida(nivel);
      const total = totalLista(Juego.lista);
      const enBilletera = Object.entries(Juego.billetera).reduce((s, [v, c]) => s + Number(v) * c, 0);
      return { items: Juego.lista.length, total, presupuesto: Juego.presupuesto, enBilletera,
               ok: Number.isFinite(total) && total > 0 && enBilletera >= total && enBilletera === Juego.presupuesto };
    }, n);
    ck(r.ok, `nivel ${n}: ${r.items} productos, total $${r.total}, billetera $${r.enBilletera}`);
  }

  /* Pago exacto completo, con clics reales */
  const exacto = await p.evaluate(() => {
    Juego.config.modoPago = 'exacto'; Juego.config.exigirTotal = 'nunca';
    nuevaPartida(1);
    Juego.lista.forEach(q => ponerEnCarro(PRODUCTOS.filter(x => x.id === q.id)[0], q.modo, { cantidad: q.cantidad, gramos: q.gramos }));
    irACaja();
    Juego.pago = descomponer(totalCarro());
    intentarPagar();
    return document.querySelector('.pantalla.activa').id;
  });
  ck(exacto === 'pantalla-boleta', 'una compra con pago exacto llega a la boleta');

  /* Confirmación del total en nivel 1 sigue vigente */
  const total1 = await p.evaluate(() => {
    Juego.config.exigirTotal = 'siempre'; Juego.config.modoPago = 'exacto';
    nuevaPartida(1);
    Juego.lista.forEach(q => ponerEnCarro(PRODUCTOS.filter(x => x.id === q.id)[0], q.modo, { cantidad: q.cantidad, gramos: q.gramos }));
    const hay = !!document.querySelector('.comprobar');
    irACaja();
    return { hay, bloqueado: document.querySelector('.pantalla.activa').id === 'pantalla-mercado' };
  });
  ck(total1.hay && total1.bloqueado, 'el nivel 1 sigue pidiendo calcular el total antes de pagar');

  /* Desafíos y feria siguen vivos */
  const otros = await p.evaluate(() => {
    iniciarDesafios(0);
    Desafio.respuesta = String(DESAFIOS[0].respuesta);
    comprobarDesafio();
    const desafioOk = Desafio.resuelto;
    usarCatalogo('botalcura');
    const feriaOk = PRODUCTOS_BOTALCURA.filter(x => x.id === 'leche')[0].unidad === 900;
    return { desafioOk, feriaOk };
  });
  ck(otros.desafioOk, 'el modo Desafíos sigue funcionando');
  ck(otros.feriaOk, 'la feria de Botalcura conserva sus precios');

  /* El teclado numérico del profesor sigue andando */
  const teclado = await p.evaluate(() => {
    Juego.config.presupuestoAuto = false; pintarConfig(); mostrarPantalla('config');
    document.querySelectorAll('.chip-numero')[0].click();
    const abre = !!document.getElementById('teclado-modal');
    if (abre) {
      ['7','5','0','0'].forEach(k => [...document.querySelectorAll('#teclado-modal .tecla')].find(x => x.textContent.trim() === k).click());
      const visor = document.querySelector('.teclado-modal__visor').textContent;
      [...document.querySelectorAll('#teclado-modal .tecla')].find(x => x.textContent.trim() === '✓').click();
      return { abre, visor };
    }
    return { abre };
  });
  ck(teclado.abre && teclado.visor === '$7.500', `el teclado numérico funciona (${teclado.visor})`);

  ck(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await b.close();
  console.log(fallos ? `\n${fallos} fallos` : '\n✓ Regresión OK');
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
