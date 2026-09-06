/* ============================================================================
   util.js — Herramientas compartidas
   Formato de moneda chilena, sonidos, confeti, atajos de DOM y guardado local.
   ========================================================================== */

/* --- Compatibilidad ------------------------------------------------------- */
/* Algunas tablets escolares traen navegadores antiguos. Estos dos rellenos
   evitan que el juego se caiga entero en esos equipos. */
if (!Object.entries) {
  Object.entries = function (obj) { return Object.keys(obj).map(function (k) { return [k, obj[k]]; }); };
}
/** Aplana un nivel de arreglos anidados (reemplaza Array.prototype.flat). */
function aplanar(arr) {
  var salida = [];
  for (var i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) salida = salida.concat(arr[i]); else salida.push(arr[i]);
  }
  return salida;
}

/* --- DOM ------------------------------------------------------------------ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/** Crea un elemento con clases, atributos e hijos en una sola llamada. */
function el(tag, props = {}, ...hijos) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') nodo.className = v;
    else if (k === 'html') nodo.innerHTML = v;
    else if (k === 'text') nodo.textContent = v;
    else if (k.startsWith('on')) nodo.addEventListener(k.slice(2), v);
    else if (v !== null && v !== false) nodo.setAttribute(k, v);
  }
  aplanar(hijos).forEach(h => h && nodo.append(h));
  return nodo;
}

/* --- Números y moneda ----------------------------------------------------- */

/* El formato se arma a mano en vez de usar toLocaleString: esa función depende
   de datos de idioma que algunos navegadores de tablet no traen, y ahí los
   montos aparecerían como "$11000" en vez de "$11.000". El punto de miles es
   justamente lo que el estudiante tiene que aprender a leer. */

/** 1500 → "1.500" (punto de miles, sin símbolo) */
function miles(n) {
  let entero = String(Math.round(Math.abs(n)));
  let salida = '';
  while (entero.length > 3) {
    salida = '.' + entero.slice(-3) + salida;
    entero = entero.slice(0, -3);
  }
  return (n < 0 ? '-' : '') + entero + salida;
}

/** 1500 → "$1.500" */
function pesos(n) {
  return '$' + miles(n);
}

/* Los meses van escritos a mano por la misma razón que el formato de moneda:
   toLocaleDateString depende de datos de idioma que algunas tablets del colegio
   no traen, y ahí la fecha de la boleta salía en inglés o en cifras sueltas. */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Fecha en palabras: "6 de septiembre de 2026". */
function fechaLarga(f) {
  return f.getDate() + ' de ' + MESES[f.getMonth()] + ' de ' + f.getFullYear();
}

/** 750 → "750 g" · 1000 → "1 kg" · 1500 → "1,5 kg" (coma decimal chilena) */
function peso(gramos) {
  if (gramos < 1000) return gramos + ' g';
  const kg = gramos / 1000;
  return (kg % 1 === 0 ? String(kg) : String(kg).replace('.', ',')) + ' kg';
}

/** Entero aleatorio entre min y max, ambos incluidos. */
function entre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Un elemento al azar del arreglo. */
function alAzar(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Copia barajada del arreglo (Fisher–Yates). */
function barajar(arr) {
  const c = arr.slice();
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/* --- Descomposición en billetes y monedas --------------------------------- */

/**
 * Reparte un monto en denominaciones, de mayor a menor.
 * Devuelve un objeto { valor: cantidad }.
 */
function descomponer(monto) {
  const salida = {};
  let resto = monto;
  for (const d of DENOMINACIONES) {
    const n = Math.floor(resto / d.valor);
    if (n > 0) { salida[d.valor] = n; resto -= n * d.valor; }
  }
  return salida;
}

/** Suma el valor total de un objeto { valor: cantidad }. */
function sumaBolsillo(bolsillo) {
  return Object.entries(bolsillo).reduce((t, [v, n]) => t + Number(v) * n, 0);
}

/* --- Sonido (generado con Web Audio, sin archivos externos) ---------------- */
const Audio2 = {
  ctx: null,
  activo: true,

  _ctx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    return this.ctx;
  },

  /** Toca una nota simple. */
  nota(frec, dur = 0.12, tipo = 'sine', vol = 0.18, retraso = 0) {
    if (!this.activo) return;
    const ctx = this._ctx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime + retraso;
    const osc = ctx.createOscillator();
    const gan = ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(frec, t0);
    gan.gain.setValueAtTime(0, t0);
    gan.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gan.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gan).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  tomar()   { this.nota(660, 0.09, 'triangle'); },
  soltar()  { this.nota(330, 0.09, 'triangle'); },
  moneda()  { this.nota(880, 0.07, 'square', 0.09); this.nota(1320, 0.06, 'square', 0.07, 0.05); },
  error()   { this.nota(180, 0.22, 'sawtooth', 0.12); },
  exito()   { [523, 659, 784, 1047].forEach((f, i) => this.nota(f, 0.22, 'sine', 0.16, i * 0.09)); },
  boton()   { this.nota(520, 0.06, 'sine', 0.10); }
};

/* --- Confeti (canvas, sin librerías) -------------------------------------- */
function confeti(duracion = 2200) {
  const lienzo = el('canvas', { class: 'confeti' });
  document.body.append(lienzo);
  const g = lienzo.getContext('2d');
  const ajustar = () => { lienzo.width = innerWidth; lienzo.height = innerHeight; };
  ajustar();
  addEventListener('resize', ajustar);

  const colores = ['#F2A93B', '#E24A34', '#1F6F5C', '#6FC4A8', '#F7D46A', '#4A8BC2'];
  const trozos = Array.from({ length: 130 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.5,
    w: 6 + Math.random() * 8,
    h: 8 + Math.random() * 10,
    vy: 2 + Math.random() * 3,
    vx: -1 + Math.random() * 2,
    giro: Math.random() * Math.PI,
    vg: -0.12 + Math.random() * 0.24,
    color: alAzar(colores)
  }));

  const inicio = performance.now();
  (function marco(t) {
    const avance = t - inicio;
    g.clearRect(0, 0, lienzo.width, lienzo.height);
    trozos.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.giro += p.vg;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.giro);
      g.globalAlpha = Math.max(0, 1 - avance / duracion);
      g.fillStyle = p.color;
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.restore();
    });
    if (avance < duracion) requestAnimationFrame(marco);
    else { lienzo.remove(); removeEventListener('resize', ajustar); }
  })(inicio);
}

/* --- Aviso flotante ------------------------------------------------------- */
let avisoActual = null;
function aviso(texto, tono = 'info') {
  if (avisoActual) avisoActual.remove();
  const nodo = el('div', { class: `aviso aviso--${tono}`, role: 'status', text: texto });
  document.body.append(nodo);
  avisoActual = nodo;
  setTimeout(() => { nodo.classList.add('aviso--fuera'); }, 2000);
  setTimeout(() => { nodo.remove(); if (avisoActual === nodo) avisoActual = null; }, 2400);
}

/* --- Guardado local ------------------------------------------------------- */
/* Solo se guarda la configuración del profesor. Sin usuarios, sin servidor.
   Si el navegador bloquea el almacenamiento (puede pasar al abrir el archivo
   directamente desde el disco), el juego sigue funcionando en memoria.        */
const Guardado = {
  memoria: null,
  leer() {
    try {
      const txt = localStorage.getItem('mercado-config');
      return txt ? JSON.parse(txt) : this.memoria;
    } catch (e) { return this.memoria; }
  },
  escribir(obj) {
    this.memoria = obj;
    try { localStorage.setItem('mercado-config', JSON.stringify(obj)); } catch (e) { /* sin permiso */ }
  }
};

/* --- Animación de "vuelo" entre dos puntos de la pantalla ----------------- */
/** Clona un nodo y lo hace volar hasta el destino. Puramente decorativo. */
function volar(desde, hasta, contenidoHTML) {
  const a = desde.getBoundingClientRect();
  const b = hasta.getBoundingClientRect();
  const fantasma = el('div', { class: 'vuelo', html: contenidoHTML });
  fantasma.style.left = `${a.left + a.width / 2}px`;
  fantasma.style.top = `${a.top + a.height / 2}px`;
  document.body.append(fantasma);
  requestAnimationFrame(() => {
    fantasma.style.transform =
      `translate(-50%,-50%) translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + b.height / 2 - a.top - a.height / 2}px) scale(.3)`;
    fantasma.style.opacity = '0';
  });
  setTimeout(() => fantasma.remove(), 620);
}

/* ============================================================================
   Teclado numérico modal
   ----------------------------------------------------------------------------
   Un cuadro con dígitos, ⌫ y C que se abre sobre cualquier pantalla, para
   escribir un número exacto en vez de tocar +/- muchas veces. Se usa para el
   presupuesto, el largo de la lista y la cantidad de cada producto elegido a
   mano, con el mismo estilo del resto del juego (misma tecla de borrar que la
   calculadora, los desafíos y la caja).
   ========================================================================== */
const TecladoNum = { activo: false, valor: '', opts: null, alConfirmar: null };

/**
 * Abre el teclado modal.
 * opts: { titulo, valorInicial, min, max, paso, prefijo, sufijo, formatear,
 *         permiteVacio, textoVacio, textoBorrar }
 * alConfirmar(numero|null) recibe el valor ya validado, o null si se dejó
 * vacío y permiteVacio es true (para volver a "al azar").
 */
function abrirTecladoNum(opts, alConfirmar) {
  TecladoNum.activo = true;
  TecladoNum.opts = opts;
  TecladoNum.alConfirmar = alConfirmar;
  /* Arranca siempre en blanco, igual que la calculadora, los desafíos y el
     vuelto: se escribe el número de nuevo en vez de editar el anterior. */
  TecladoNum.valor = '';
  pintarTecladoNum();
}

function cerrarTecladoNum() {
  TecladoNum.activo = false;
  quitarNodoTeclado();
}

/** Solo saca el nodo del DOM, sin apagar la sesión: lo usa pintarTecladoNum
    para limpiar antes de volver a dibujar, sin cerrarse a sí mismo. */
function quitarNodoTeclado() {
  const nodo = document.getElementById('teclado-modal');
  if (nodo) nodo.remove();
}

function pintarTecladoNum() {
  quitarNodoTeclado();
  if (!TecladoNum.activo) return;
  const o = TecladoNum.opts;

  const formatear = n => {
    const texto = o.formatear ? o.formatear(n) : miles(n);
    return `${o.prefijo || ''}${texto}${o.sufijo || ''}`;
  };

  const fondo = el('div', {
    id: 'teclado-modal', class: 'modal-fondo',
    onclick: ev => { if (ev.target === ev.currentTarget) cerrarTecladoNum(); }
  });

  const visor = el('div', { class: 'visor teclado-modal__visor',
    text: TecladoNum.valor ? formatear(Number(TecladoNum.valor)) : (o.textoVacio || formatear(0)) });

  const refrescar = () => {
    visor.textContent = TecladoNum.valor ? formatear(Number(TecladoNum.valor)) : (o.textoVacio || formatear(0));
  };

  const confirmar = () => {
    if (TecladoNum.valor === '') {
      if (o.permiteVacio) { TecladoNum.alConfirmar(null); cerrarTecladoNum(); }
      return;
    }
    let n = Number(TecladoNum.valor);
    if (o.paso > 1) n = Math.round(n / o.paso) * o.paso;
    const min = o.min != null ? o.min : -Infinity;
    const max = o.max != null ? o.max : Infinity;
    n = Math.max(min, Math.min(max, n));
    TecladoNum.alConfirmar(n);
    cerrarTecladoNum();
  };

  const teclado = el('div', { class: 'teclado teclado--cuatro' });
  ['1', '2', '3', 'C', '4', '5', '6', '<', '7', '8', '9', '00', '0', '✓'].forEach(k => {
    teclado.append(el('button', {
      class: `tecla ${k === 'C' ? 'tecla--borrar' : ''}${k === '<' ? ' tecla--atras' : ''}` +
             `${k === '✓' ? ' tecla--ok tecla--ancha' : ''}${k === '0' ? ' tecla--ancha' : ''}`,
      onclick: () => {
        Audio2.boton();
        if (k === 'C') TecladoNum.valor = '';
        else if (k === '<') TecladoNum.valor = TecladoNum.valor.slice(0, -1);
        else if (k === '✓') { confirmar(); return; }
        else if (TecladoNum.valor.length < 6) TecladoNum.valor += k;
        refrescar();
      }
    }, k === '<' ? '⌫' : k));
  });

  const tarjeta = el('div', { class: 'teclado-modal__tarjeta' },
    el('h3', { text: o.titulo || 'Escribe un número' }),
    visor,
    teclado
  );

  const acciones = el('div', { class: 'teclado-modal__acciones' });
  if (o.permiteVacio) {
    acciones.append(el('button', {
      class: 'btn btn--fantasma btn--chico',
      onclick: () => { TecladoNum.alConfirmar(null); cerrarTecladoNum(); }
    }, o.textoBorrar || '↺ Dejar en «al azar»'));
  }
  acciones.append(el('button', { class: 'btn btn--fantasma btn--chico', onclick: cerrarTecladoNum }, 'Cancelar'));
  tarjeta.append(acciones);

  fondo.append(tarjeta);
  document.body.append(fondo);
}
