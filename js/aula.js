/* ============================================================================
   aula.js — Modo aula: varias tablets en la misma clase
   ----------------------------------------------------------------------------
   Solo aparece cuando el juego se abre desde el servidor del profesor. Si se
   abre haciendo doble clic en el archivo, este modo ni se muestra y el juego
   funciona exactamente igual que siempre.

   Deliberadamente SIN ranking ni cronómetro. El tablero le sirve al profesor
   para ver quién ya respondió y quién necesita apoyo, y para mostrar todas las
   respuestas juntas cuando llega el momento de comentarlas. La Experiencia 3
   pide justificar y comparar estrategias; una carrera por responder rápido
   empujaría justo en la dirección contraria.
   ========================================================================== */

const Aula = {
  activa: false,       // ¿el juego se está sirviendo desde el computador del profesor?
  rol: null,           // 'profesor' | 'alumno'
  codigo: null,
  nombre: null,
  desafio: 0,
  revelado: false,
  version: -1,
  alumnos: [],
  respuestas: {},
  reloj: null,
  error: null,
  vista: 'desafios',   // qué está preparando el profesor
  actividad: null,     // la compra que se mandó a las tablets
  actividadVista: null,// cuál ya aplicó esta tablet
  progreso: {},        // en qué va cada estudiante con su compra
  historial: {},       // lo que respondió cada uno en cada actividad
  grupos: {},          // puestos de la feria en parejas
  armando: false,      // ¿el profesor está armando los puestos a mano?
  borrador: [],        // los puestos que va formando, antes de mandarlos
  eligiendo: null,     // el nombre que tocó y está por ubicar
  presupuestoFeria: 15000, // cuánto dinero recibe cada comprador
  sinSenal: {},        // quiénes llevan rato callados
  ultimoAviso: ''      // para no repetir el mismo mensaje al servidor
};

/**
 * Ficha de esta tablet: distingue a dos estudiantes que se llaman igual de una
 * misma tablet que vuelve a entrar porque se recargó la página. Se guarda junto
 * al resto de lo local; si el navegador no deja guardar, queda en memoria y el
 * servidor trata la entrada como siempre.
 */
let fichaMemoria = null;
function fichaTablet() {
  if (fichaMemoria) return fichaMemoria;
  const nueva = () => String(Date.now()) + '-' + Math.floor(Math.random() * 1e9);
  try {
    fichaMemoria = localStorage.getItem('mercado-ficha');
    if (!fichaMemoria) {
      fichaMemoria = nueva();
      localStorage.setItem('mercado-ficha', fichaMemoria);
    }
  } catch (e) {
    fichaMemoria = nueva();          // sin permiso para guardar: solo esta sesión
  }
  return fichaMemoria;
}

/** El modo aula solo tiene sentido si hay un servidor detrás. */
function hayServidor() {
  return location.protocol === 'http:' || location.protocol === 'https:';
}

/* --- Conversación con el servidor ----------------------------------------- */
function pedir(accion, datos = {}) {
  const partes = Object.entries(datos)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return fetch(`/api/${accion}${partes ? '?' + partes : ''}`)
    .then(r => r.json())
    .catch(() => ({ error: 'Se cortó la conexión' }));
}

/**
 * Vuelve a dar señales apenas la tablet despierta.
 *
 * Los navegadores frenan los temporizadores cuando la pantalla se atenúa o el
 * estudiante cambia de aplicación. Sin esto, alguien que está pensando podía
 * aparecerle al profesor como desconectado.
 */
function despertar() {
  if (!Aula.codigo || document.hidden) return;
  Aula.version = -1;                       // fuerza una actualización completa
  pedir('estado', { c: Aula.codigo, n: Aula.nombre || '' });
}

/** Pregunta por novedades cada tanto. Medio segundo basta y sobra. */
function escuchar(cada = 700) {
  clearInterval(Aula.reloj);
  document.removeEventListener('visibilitychange', despertar);
  document.addEventListener('visibilitychange', despertar);
  window.removeEventListener('focus', despertar);
  window.addEventListener('focus', despertar);
  window.removeEventListener('pointerdown', despertar);
  window.addEventListener('pointerdown', despertar);
  Aula.reloj = setInterval(async () => {
    if (!Aula.codigo) return;
    const r = await pedir('estado', { c: Aula.codigo, n: Aula.nombre || '' });
    if (r.error) { Aula.error = r.error; return; }

    /* «Sin señal» cambia con el paso del tiempo, no con una acción: si solo
       se mirara la versión, el profesor nunca vería que a alguien se le apagó
       la tablet. */
    const senalAntes = Object.keys(Aula.sinSenal || {}).sort().join(',');
    const senalAhora = Object.keys(r.sinSenal || {}).sort().join(',');
    if (r.version === Aula.version) {
      if (senalAhora !== senalAntes) {
        Aula.sinSenal = r.sinSenal || {};
        if (Aula.rol === 'profesor') pintarProfesor();
      }
      return;                                    // nada más cambió
    }

    const desafioAntes = Aula.desafio;
    Aula.version = r.version;
    Aula.desafio = r.desafio;
    Aula.revelado = r.revelado;
    Aula.alumnos = r.alumnos;
    Aula.respuestas = r.respuestas;

    Aula.progreso = r.progreso || {};
    Aula.historial = r.historial || {};
    Aula.grupos = r.grupos || {};
    Aula.sinSenal = r.sinSenal || {};
    Aula.actividad = r.actividad || null;

    if (Aula.rol === 'profesor') {
      pintarProfesor();
      return;
    }

    /* El profesor armó los puestos de la feria en parejas */
    if (r.grupos && Object.keys(r.grupos).length) {
      usarCatalogo('botalcura');
      if (miPuesto()) {
        if (document.querySelector('.pantalla.activa').id !== 'pantalla-feria') {
          Audio2.exito();
          mostrarPantalla('feria');
        }
        pintarFeria();
        return;
      }
    }

    /* El profesor mandó una compra nueva: la tablet la arma igual que todas */
    if (r.actividad && r.actividad.sello !== Aula.actividadVista) {
      Aula.actividadVista = r.actividad.sello;
      Audio2.exito();
      aviso('Tu profesor mandó una compra nueva', 'bien');
      Object.assign(Juego.config, r.actividad.config || {});
      montarPartida(r.actividad.partida);
      return;
    }

    /* O volvió a los desafíos */
    if (!r.actividad) {
      const veniaDeCompras = Aula.actividadVista !== null;
      if (veniaDeCompras || r.desafio !== desafioAntes) {
        Audio2.boton();
        Aula.actividadVista = null;
        /* Si la tablet estaba en el mercado o en la boleta hay que llevarla a
           la pantalla de desafíos, no solo cambiarle el número. */
        const enDesafios = document.querySelector('.pantalla.activa').id === 'pantalla-desafios';
        if (enDesafios) irADesafio(r.desafio);
        else iniciarDesafios(r.desafio);
      }
    }
  }, cada);
}

function dejarAula() {
  clearInterval(Aula.reloj);
  if (Aula.rol === 'alumno' && Aula.codigo) pedir('salir', { c: Aula.codigo, n: Aula.nombre });
  Aula.rol = null; Aula.codigo = null; Aula.nombre = null; Aula.version = -1;
  mostrarPantalla('menu');
}

/* --- Elegir rol ----------------------------------------------------------- */
function pintarAula() {
  const cuerpo = $('#aula-cuerpo');
  cuerpo.innerHTML = '';

  cuerpo.append(el('div', { class: 'panel', style: 'text-align:center' },
    el('h3', { text: '¿Quién eres?' }),
    el('p', { class: 'panel__nota', text: 'El profesor abre la clase y los estudiantes entran con el código.' }),
    el('div', { class: 'menu-botones' },
      el('button', { class: 'btn btn--principal btn--grande', onclick: abrirClase }, '👩‍🏫 Soy el profesor'),
      el('button', { class: 'btn btn--verde btn--grande', onclick: pintarEntrada }, '🙋 Soy estudiante')
    )
  ));
}

/* --- Estudiante: entrar --------------------------------------------------- */
function pintarEntrada() {
  Audio2.boton();
  const cuerpo = $('#aula-cuerpo');
  cuerpo.innerHTML = '';

  const codigo = el('input', { class: 'entrada', inputmode: 'numeric', maxlength: 6,
    placeholder: '000000', style: 'text-align:center;letter-spacing:.28em;font-size:1.7rem' });
  const nombre = el('input', { class: 'entrada', maxlength: 20, placeholder: 'Tu nombre' });
  const aviso2 = el('p', { class: 'campo__pista', style: 'text-align:center;min-height:1.4em' });

  const entrar = async () => {
    const c = codigo.value.trim(), n = nombre.value.trim();
    if (c.length !== 6 || !n) { aviso2.textContent = 'Escribe el código de 6 números y tu nombre.'; Audio2.error(); return; }
    const r = await pedir('entrar', { c, n, f: fichaTablet() });
    if (r.error) { aviso2.textContent = r.error; Audio2.error(); return; }
    Aula.rol = 'alumno'; Aula.codigo = c; Aula.nombre = n; Aula.desafio = r.desafio;
    Audio2.exito();
    escuchar();
    iniciarDesafios(r.desafio);
  };

  cuerpo.append(el('div', { class: 'panel', style: 'max-width:420px;margin:0 auto' },
    el('h3', { text: 'Entrar a la clase' }),
    el('label', { class: 'campo' }, el('span', { class: 'campo__rotulo', text: 'Código de la clase' }), codigo),
    el('label', { class: 'campo' }, el('span', { class: 'campo__rotulo', text: 'Tu nombre' }), nombre),
    aviso2,
    el('button', { class: 'btn btn--principal btn--grande', style: 'width:100%', onclick: entrar }, 'Entrar'),
    el('button', { class: 'btn btn--fantasma btn--chico', style: 'width:100%;margin-top:12px', onclick: pintarAula }, '⬅ Atrás')
  ));
  codigo.focus();
}

/* --- Profesor: abrir la clase --------------------------------------------- */
async function abrirClase() {
  Audio2.boton();
  const r = await pedir('abrir');
  if (r.error) { aviso(r.error, 'mal'); return; }
  Aula.rol = 'profesor'; Aula.codigo = r.codigo; Aula.desafio = 0;
  escuchar(500);
  pintarProfesor();
}

/** Tablero: quién está, quién respondió y quién necesita apoyo. */
function pintarProfesor() {
  const cuerpo = $('#aula-cuerpo');
  cuerpo.innerHTML = '';

  /* Código y dirección, grandes para dictar */
  cuerpo.append(el('div', { class: 'sala' },
    el('div', {},
      el('span', { class: 'sala__rotulo', text: 'Código de la clase' }),
      el('div', { class: 'sala__codigo', text: Aula.codigo })),
    el('div', {},
      el('span', { class: 'sala__rotulo', text: 'En la tablet, escribir' }),
      el('div', { class: 'sala__url', text: location.host }))
  ));

  /* Qué está haciendo el profesor */
  const pestana = (id, texto) => el('button', {
    class: `opcion ${Aula.vista === id ? 'elegida' : ''}`,
    onclick: () => { Aula.vista = id; Audio2.boton(); pintarProfesor(); }
  }, texto);

  cuerpo.append(el('div', { class: 'opciones', style: 'margin-bottom:18px' },
    pestana('desafios', '🧠 Desafíos'),
    pestana('compras', '🛒 Ir de compras'),
    pestana('parejas', '🤝 En parejas'),
    pestana('seguimiento', '📊 Seguimiento')
  ));

  if (Aula.vista === 'seguimiento') { pintarSeguimiento(cuerpo); }
  else if (Aula.vista === 'parejas') { mandoParejas(cuerpo); }
  else {
    if (Aula.vista === 'compras') mandoCompras(cuerpo);
    else mandoDesafios(cuerpo);
    cuerpo.append(tableroCurso());
  }
  cuerpo.append(el('button', { class: 'btn btn--fantasma btn--chico', onclick: dejarAula }, '⬅ Terminar la clase'));
}

/* --- Dirigir los desafíos ------------------------------------------------- */
function mandoDesafios(cuerpo) {
  const d = DESAFIOS[Aula.desafio] || DESAFIOS[0];
  cuerpo.append(el('div', { class: 'panel' },
    el('div', { class: 'desafio__num', text: `Desafío ${Aula.desafio + 1} de ${DESAFIOS.length}` }),
    el('h3', { text: d.titulo }),
    el('p', { class: 'panel__nota', text: d.enunciado }),
    el('div', { class: 'aula-mando' },
      el('button', { class: 'btn btn--chico', disabled: Aula.desafio === 0,
        onclick: () => mandarA(Aula.desafio - 1) }, '⬅ Anterior'),
      el('button', { class: 'btn btn--chico btn--principal',
        onclick: () => mandarA(Aula.desafio + 1) }, 'Siguiente ➡'),
      el('button', { class: `btn btn--chico ${Aula.revelado ? 'btn--peligro' : 'btn--verde'}`,
        onclick: revelar }, Aula.revelado ? 'Ocultar respuestas' : '👀 Mostrar respuestas')
    )
  ));
}

/* --- Preparar y mandar una compra ---------------------------------------- */
function mandoCompras(cuerpo) {
  const panel = el('div', { class: 'panel' });
  panel.append(
    el('h3', { text: 'Preparar la compra' }),
    el('p', { class: 'panel__nota',
      text: 'Todas las tablets reciben la MISMA lista, el mismo presupuesto y los mismos billetes. Así se pueden comparar los resultados en clase.' })
  );

  if (Aula.actividad) {
    const a = Aula.actividad;
    panel.append(el('div', { class: 'enviada' },
      el('b', { text: `📤 Enviada: ${a.resumen}` }),
      el('span', { text: `${a.partida.lista.length} productos · presupuesto ${pesos(a.partida.presupuesto)}` })
    ));
  }

  panel.append(el('div', { class: 'aula-mando' },
    el('button', { class: 'btn btn--principal', onclick: mandarCompra },
      Aula.actividad ? '🔄 Mandar otra compra' : '📤 Mandar a las tablets'),
    el('button', { class: `btn btn--chico ${Aula.revelado ? 'btn--peligro' : 'btn--verde'}`,
      onclick: revelar }, Aula.revelado ? 'Ocultar resultados' : '👀 Mostrar resultados')
  ));
  cuerpo.append(panel);

  /* El mismo panel de preparación de siempre, aquí adentro */
  const config = el('div', { class: 'aula-config' });
  cuerpo.append(config);
  pintarConfig(config);
}

/** Arma la partida y la manda igual a todas las tablets. */
async function mandarCompra() {
  Audio2.boton();
  const partida = armarPartida(Juego.config.nivel);
  const nivel = NIVELES[partida.nivel];

  const actividad = {
    sello: Date.now(),
    resumen: `${nivel.emoji} ${nivel.nombre}`,
    partida,
    /* Se mandan también los apoyos, para que todos trabajen igual */
    config: {
      nivel: partida.nivel,
      catalogo: partida.catalogo,
      exigirTotal: Juego.config.exigirTotal,
      ayudaSubtotal: Juego.config.ayudaSubtotal,
      ayudaCalculadora: Juego.config.ayudaCalculadora,
      bloquearExceso: Juego.config.bloquearExceso,
      tacharAuto: Juego.config.tacharAuto,
      mostrarRestante: Juego.config.mostrarRestante,
      mostrarSumaBandeja: Juego.config.mostrarSumaBandeja,
      modoPago: Juego.config.modoPago
    }
  };

  const r = await fetch('/api/actividad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo: Aula.codigo, actividad })
  }).then(x => x.json()).catch(() => ({ error: 'No se pudo mandar' }));

  if (r.error) { aviso(r.error, 'mal'); return; }
  aviso(`Compra enviada a ${Aula.alumnos.length} tablet${Aula.alumnos.length === 1 ? '' : 's'}`, 'bien');
}

/* --- Tablero del curso ---------------------------------------------------- */
function tableroCurso() {
  const enCompras = !!Aula.actividad;
  const total = Aula.alumnos.length;
  const avanzaron = enCompras
    ? Object.values(Aula.progreso).filter(p => p.fase === 'listo').length
    : Object.keys(Aula.respuestas).length;

  const tablero = el('div', { class: 'tablero' });
  if (!total) {
    tablero.append(el('p', { class: 'carro__vacio',
      text: 'Todavía no entra nadie. Dicta el código y la dirección.' }));
  }

  Aula.alumnos.forEach(nombre => {
    tablero.append(enCompras ? fichaCompra(nombre) : fichaDesafio(nombre));
  });

  return el('div', { class: 'panel' },
    el('h3', { text: enCompras
      ? `Curso · ${avanzaron} de ${total} terminaron la compra`
      : `Curso · ${avanzaron} de ${total} respondieron` }),
    el('p', { class: 'panel__nota', text: Aula.revelado
      ? 'Buen momento para preguntar cómo lo pensaron y comparar estrategias.'
      : 'Mientras nadie vea los resultados, se puede acompañar a quien lo necesite.' }),
    tablero
  );
}

function fichaDesafio(nombre) {
  const r = Aula.respuestas[nombre];
  /* Sin revelar solo se ve si ya respondió: no se compara a nadie */
  const estado = !r ? 'pensando' : (Aula.revelado ? (r.correcta ? 'bien' : 'revisar') : 'listo');
  const rotulos = { pensando: 'Pensando…', listo: 'Ya respondió', bien: 'Correcto', revisar: 'Para revisar juntos' };
  const ficha = el('div', { class: `alumno alumno--${estado}` },
    el('b', { text: nombre }),
    el('span', { class: 'alumno__estado', text: rotulos[estado] })
  );
  if (r && Aula.revelado) {
    ficha.append(el('div', { class: 'alumno__valor', text: r.valor }));
    if (r.estrategias && r.estrategias.length) {
      ficha.append(el('div', { class: 'alumno__estrategias',
        text: r.estrategias.map(id => {
          const e = ESTRATEGIAS.filter(x => x.id === id)[0];
          return e ? e.emoji + ' ' + e.texto : id;
        }).join(' · ') }));
    }
  }
  return ficha;
}

function fichaCompra(nombre) {
  const p = Aula.progreso[nombre];
  const rotulos = {
    comprando: 'Buscando en los anaqueles',
    calculando: 'Calculando el total',
    pagando: 'En la caja',
    listo: 'Terminó'
  };
  const fase = p ? p.fase : 'esperando';
  const estado = fase === 'listo'
    ? (Aula.revelado ? (p.completo ? 'bien' : 'revisar') : 'listo')
    : (fase === 'esperando' ? 'pensando' : 'trabajando');

  const ficha = el('div', { class: `alumno alumno--${estado}` },
    el('b', { text: nombre }),
    el('span', { class: 'alumno__estado', text: rotulos[fase] || 'Aún no empieza' })
  );

  /* Mientras trabajan solo se ve cuántos productos llevan: sin cifras que
     inviten a comparar quién va más rápido. */
  if (p && fase !== 'listo' && fase !== 'esperando') {
    ficha.append(el('div', { class: 'alumno__estrategias',
      text: `${p.items} producto${p.items === 1 ? '' : 's'} en el carro` }));
  }

  if (p && fase === 'listo') {
    if (Aula.revelado) {
      ficha.append(el('div', { class: 'alumno__valor',
        text: '⭐'.repeat(Math.max(0, p.estrellas)) + '☆'.repeat(Math.max(0, 3 - p.estrellas)) }));
      ficha.append(el('div', { class: 'alumno__estrategias',
        text: `Gastó ${pesos(p.gastado)} de ${pesos(p.presupuesto)}` }));
    } else {
      ficha.append(el('div', { class: 'alumno__estrategias', text: 'Esperando a los demás' }));
    }
  }
  return ficha;
}

/* ============================================================================
   Seguimiento
   ----------------------------------------------------------------------------
   Una mirada de toda la clase, no solo de la actividad en curso: qué respondió
   cada estudiante en cada desafío, cómo dice que lo pensó y cómo le fue en las
   compras. Sigue sin ordenar por puntaje: es para saber a quién acompañar y
   qué conviene comentar con el curso.
   ========================================================================== */
function pintarSeguimiento(cuerpo) {
  const alumnos = Aula.alumnos;

  if (!alumnos.length) {
    cuerpo.append(el('div', { class: 'panel' },
      el('h3', { text: 'Seguimiento' }),
      el('p', { class: 'carro__vacio', text: 'Todavía no entra nadie a la clase.' })));
    return;
  }

  /* Resumen del curso */
  const total = alumnos.length;
  const conSenal = alumnos.filter(n => !Aula.sinSenal[n]).length;
  let respuestas = 0, aciertos = 0;
  alumnos.forEach(n => {
    Object.values(Aula.historial[n] || {}).forEach(x => {
      if (x.fase) return;                       // las compras se cuentan aparte
      respuestas++;
      if (x.correcta) aciertos++;
    });
  });
  const compras = alumnos.reduce((s, n) =>
    s + Object.values(Aula.historial[n] || {}).filter(x => x.fase === 'listo').length, 0);

  cuerpo.append(el('div', { class: 'resumenes' },
    tarjetaResumen('👥', `${conSenal} de ${total}`, 'con señal ahora'),
    tarjetaResumen('✍️', String(respuestas), 'respuestas dadas'),
    tarjetaResumen('✅', respuestas ? `${Math.round(100 * aciertos / respuestas)}%` : '—', 'acertadas'),
    tarjetaResumen('🛒', String(compras), 'compras terminadas')
  ));

  /* Qué desafíos se han trabajado, para armar las columnas */
  const trabajados = [];
  alumnos.forEach(n => Object.values(Aula.historial[n] || {}).forEach(x => {
    if (x.desafio != null && trabajados.indexOf(x.desafio) < 0) trabajados.push(x.desafio);
  }));
  trabajados.sort((a, b) => a - b);

  /* Una tarjeta por estudiante */
  const lista = el('div', { class: 'seguimiento' });
  alumnos.forEach(nombre => {
    const h = Aula.historial[nombre] || {};
    const callado = Aula.sinSenal[nombre];
    const ficha = el('div', { class: `seguido ${callado ? 'seguido--callado' : ''}` });

    ficha.append(el('div', { class: 'seguido__cabecera' },
      el('b', { text: nombre }),
      el('span', { class: 'seguido__senal', text: callado ? `sin señal hace ${callado} s` : 'conectado' }),
      el('button', { class: 'seguido__sacar', 'aria-label': `Sacar a ${nombre}`,
        onclick: () => sacarAlumno(nombre) }, '✕')
    ));

    /* Desafíos: un cuadrito por cada uno, con lo que respondió */
    if (trabajados.length) {
      const fila = el('div', { class: 'marcas' });
      trabajados.forEach(i => {
        const r = h['d' + i];
        const clase = !r ? 'marca--sin' : (r.correcta ? 'marca--bien' : 'marca--revisar');
        fila.append(el('span', {
          class: `marca ${clase}`,
          title: `Desafío ${i + 1}${r ? ': ' + r.valor : ' — sin responder'}`,
          text: !r ? '·' : (r.correcta ? '✓' : '?')
        }));
      });
      ficha.append(el('div', { class: 'seguido__bloque' },
        el('span', { class: 'seguido__rotulo', text: 'Desafíos' }), fila));
    }

    /* Lo que respondió, cuando no acertó: es lo que conviene comentar */
    const paraRevisar = Object.values(h).filter(x => x.desafio != null && !x.correcta);
    if (paraRevisar.length) {
      ficha.append(el('div', { class: 'seguido__bloque' },
        el('span', { class: 'seguido__rotulo', text: 'Para revisar juntos' }),
        el('div', { class: 'seguido__detalle',
          text: paraRevisar.map(x => `D${x.desafio + 1}: ${x.valor}`).join(' · ') })));
    }

    /* Compras terminadas */
    const susCompras = Object.values(h).filter(x => x.fase === 'listo');
    if (susCompras.length) {
      ficha.append(el('div', { class: 'seguido__bloque' },
        el('span', { class: 'seguido__rotulo', text: 'Compras' }),
        el('div', { class: 'seguido__detalle',
          text: susCompras.map(c =>
            '⭐'.repeat(Math.max(0, c.estrellas)) + ` · gastó ${pesos(c.gastado)} de ${pesos(c.presupuesto)}`
          ).join(' | ') })));
    }

    /* Cómo dice que piensa */
    const estr = {};
    Object.values(h).forEach(x => (x.estrategias || []).forEach(e => { estr[e] = (estr[e] || 0) + 1; }));
    const usadas = Object.entries(estr).sort((a, b) => b[1] - a[1]).slice(0, 4);
    if (usadas.length) {
      ficha.append(el('div', { class: 'seguido__bloque' },
        el('span', { class: 'seguido__rotulo', text: 'Cómo lo piensa' }),
        el('div', { class: 'seguido__detalle',
          text: usadas.map(([id, n]) => {
            const e = ESTRATEGIAS.filter(x => x.id === id)[0];
            return (e ? e.emoji + ' ' + e.texto : id) + (n > 1 ? ` ×${n}` : '');
          }).join(' · ') })));
    }

    if (!trabajados.length && !susCompras.length) {
      ficha.append(el('div', { class: 'seguido__detalle', text: 'Todavía no responde nada.' }));
    }
    lista.append(ficha);
  });

  cuerpo.append(el('div', { class: 'aula-mando', style: 'margin-bottom:18px' },
    el('button', { class: 'btn btn--chico btn--principal', onclick: () => verInforme() }, '🖨️ Informe de la clase')
  ));

  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: 'Uno por uno' }),
    el('p', { class: 'panel__nota',
      text: 'Todo lo que va respondiendo cada estudiante en la clase. Sin puntajes ni orden de llegada.' }),
    lista));
}

function tarjetaResumen(emoji, cifra, texto) {
  return el('div', { class: 'resumen' },
    el('span', { class: 'resumen__emoji', text: emoji }),
    el('b', { class: 'resumen__cifra', text: cifra }),
    el('span', { class: 'resumen__texto', text: texto }));
}

async function sacarAlumno(nombre) {
  Audio2.boton();
  await pedir('sacar', { c: Aula.codigo, n: nombre });
}

/* --- La tablet cuenta en qué va ------------------------------------------- */
/**
 * Se llama en cada momento importante de la compra. Manda solo si algo cambió,
 * para no inundar el servidor con la misma información.
 */
function avisarProgreso(fase, extra = {}) {
  if (Aula.rol !== 'alumno' || !Aula.codigo || !Aula.actividad) return;
  const firma = [fase, extra.items, extra.gastado, extra.estrellas].join('|');
  if (firma === Aula.ultimoAviso) return;
  Aula.ultimoAviso = firma;
  pedir('progreso', {
    c: Aula.codigo, n: Aula.nombre, f: fase,
    i: extra.items || 0, g: extra.gastado || 0,
    p: extra.presupuesto || 0, s: extra.estrellas != null ? extra.estrellas : -1,
    ok: extra.completo ? '1' : '0'
  });
}

async function mandarA(i) {
  if (i < 0 || i >= DESAFIOS.length) return;
  Audio2.boton();
  await pedir('ir-a', { c: Aula.codigo, d: i });
}

async function revelar() {
  Audio2.boton();
  await pedir('revelar', { c: Aula.codigo, v: Aula.revelado ? '0' : '1' });
}

/** La tablet le cuenta al profesor lo que respondió. */
function avisarRespuesta(valor, correcta) {
  if (Aula.rol !== 'alumno' || !Aula.codigo) return;
  pedir('responder', {
    c: Aula.codigo, n: Aula.nombre, v: valor,
    ok: correcta ? '1' : '0',
    e: (Desafio.estrategias || []).join(',')
  });
}


/* ============================================================================
   Informe de la clase
   ----------------------------------------------------------------------------
   Al cerrar la ventana la sala desaparece, así que todo lo trabajado se
   perdía. Este informe lo deja en papel o en PDF: sirve de evidencia del OA 7,
   para las reuniones de apoyo y para preparar la clase siguiente.

   Se imprime desde el mismo navegador (en Windows, "Guardar como PDF" está en
   el mismo cuadro de impresión) y también se puede descargar como archivo.
   ========================================================================== */

/** Reúne lo que hizo cada estudiante, ya ordenado para leerlo. */
function datosInforme() {
  const alumnos = Aula.alumnos.slice().sort((a, b) => a.localeCompare(b, 'es'));
  const filas = alumnos.map(nombre => {
    const h = Aula.historial[nombre] || {};
    const desafios = Object.values(h).filter(x => x.desafio != null)
      .sort((a, b) => a.desafio - b.desafio);
    const compras = Object.values(h).filter(x => x.fase === 'listo');
    const estrategias = {};
    Object.values(h).forEach(x => (x.estrategias || []).forEach(e => {
      estrategias[e] = (estrategias[e] || 0) + 1;
    }));
    return {
      nombre, desafios, compras,
      aciertos: desafios.filter(d => d.correcta).length,
      estrategias: Object.entries(estrategias).sort((a, b) => b[1] - a[1])
    };
  });

  /* Qué desafíos costaron más al curso: lo que conviene retomar */
  const porDesafio = {};
  filas.forEach(f => f.desafios.forEach(d => {
    porDesafio[d.desafio] = porDesafio[d.desafio] || { bien: 0, mal: 0 };
    porDesafio[d.desafio][d.correcta ? 'bien' : 'mal']++;
  }));
  const cuesta = Object.entries(porDesafio)
    .filter(([, v]) => v.mal > 0)
    .sort((a, b) => b[1].mal - a[1].mal)
    .map(([i, v]) => Object.assign({ i: Number(i) }, v));

  const respuestas = filas.reduce((s, f) => s + f.desafios.length, 0);
  const aciertos = filas.reduce((s, f) => s + f.aciertos, 0);
  return { filas, cuesta, respuestas, aciertos,
           compras: filas.reduce((s, f) => s + f.compras.length, 0) };
}

function nombreEstrategia(id) {
  const e = ESTRATEGIAS.filter(x => x.id === id)[0];
  return e ? e.emoji + ' ' + e.texto : id;
}

function verInforme() {
  Audio2.boton();
  const d = datosInforme();
  const hoy = new Date();
  const fecha = fechaLarga(hoy);
  const hora = ('0' + hoy.getHours()).slice(-2) + ':' + ('0' + hoy.getMinutes()).slice(-2);

  const cuerpo = $('#informe-cuerpo');
  cuerpo.innerHTML = '';

  cuerpo.append(el('div', { class: 'informe__encabezado' },
    el('h1', { text: 'Mercado — Informe de la clase' }),
    el('p', { text: `${fecha}, ${hora} · ${d.filas.length} estudiantes · OA 7` })
  ));

  cuerpo.append(el('div', { class: 'informe__resumen' },
    el('div', {}, el('b', { text: String(d.respuestas) }), el('span', { text: 'respuestas dadas' })),
    el('div', {}, el('b', { text: d.respuestas ? Math.round(100 * d.aciertos / d.respuestas) + '%' : '—' }), el('span', { text: 'acertadas' })),
    el('div', {}, el('b', { text: String(d.compras) }), el('span', { text: 'compras terminadas' }))
  ));

  /* Lo que conviene retomar con el curso */
  if (d.cuesta.length) {
    const lista = el('ul', { class: 'informe__lista' });
    d.cuesta.slice(0, 5).forEach(x => {
      const des = DESAFIOS[x.i];
      lista.append(el('li', { text: `${des ? des.titulo : 'Desafío ' + (x.i + 1)} — ${x.mal} ${x.mal === 1 ? 'estudiante lo dejó para revisar' : 'estudiantes lo dejaron para revisar'}` }));
    });
    cuerpo.append(el('div', { class: 'informe__bloque' },
      el('h2', { text: 'Para retomar en la próxima clase' }), lista));
  }

  /* Uno por uno */
  const seccion = el('div', { class: 'informe__bloque' }, el('h2', { text: 'Estudiante por estudiante' }));
  d.filas.forEach(f => {
    const ficha = el('div', { class: 'informe__alumno' },
      el('h3', { text: f.nombre }));

    if (f.desafios.length) {
      const tabla = el('table', { class: 'informe__tabla' },
        el('thead', {}, el('tr', {},
          el('th', { text: 'Desafío' }), el('th', { text: 'Respondió' }), el('th', { text: 'Resultado' }))));
      const tb = el('tbody', {});
      f.desafios.forEach(x => {
        const des = DESAFIOS[x.desafio];
        tb.append(el('tr', {},
          el('td', { text: des ? des.titulo : 'Desafío ' + (x.desafio + 1) }),
          el('td', { text: x.valor }),
          el('td', { text: x.correcta ? 'Correcto' : 'Para revisar' })));
      });
      tabla.append(tb);
      ficha.append(tabla);
      ficha.append(el('p', { class: 'informe__dato',
        text: `Acertó ${f.aciertos} de ${f.desafios.length} desafíos.` }));
    }

    if (f.compras.length) {
      ficha.append(el('p', { class: 'informe__dato', text: 'Compras: ' + f.compras.map(c =>
        `${Math.max(0, c.estrellas)} de 3 estrellas, gastó ${pesos(c.gastado)} de ${pesos(c.presupuesto)}`
      ).join(' · ') }));
    }

    if (f.estrategias.length) {
      ficha.append(el('p', { class: 'informe__dato', text: 'Cómo dice que lo piensa: ' +
        f.estrategias.map(([id, n]) => nombreEstrategia(id) + (n > 1 ? ` (${n} veces)` : '')).join(', ') }));
    }

    if (!f.desafios.length && !f.compras.length) {
      ficha.append(el('p', { class: 'informe__dato', text: 'No alcanzó a registrar respuestas.' }));
    }
    seccion.append(ficha);
  });
  cuerpo.append(seccion);

  cuerpo.append(el('p', { class: 'informe__pie',
    text: 'Escuela Rural Osvaldo Hiriart Corvalán · Generado por Mercado, sin conexión a internet.' }));

  mostrarPantalla('informe');
}

/** Guarda el informe como archivo, para que sobreviva al cierre de la clase. */
function descargarInforme() {
  Audio2.boton();
  const estilos = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Informe de la clase — Mercado</title><style>${estilos}</style></head>
<body class="solo-informe"><div class="envoltorio">${$('#informe-cuerpo').innerHTML}</div></body></html>`;

  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const f = new Date();
  enlace.download = `Informe Mercado ${f.getFullYear()}-${('0' + (f.getMonth() + 1)).slice(-2)}-${('0' + f.getDate()).slice(-2)}.html`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(enlace.href), 4000);
}

/* ============================================================================
   Feria en parejas — lo que ve el profesor
   ----------------------------------------------------------------------------
   Arma los puestos y sigue en qué va cada uno. Con siete estudiantes siempre
   sobra alguien, así que un puesto queda de tres: los roles rotan y en cada
   ronda uno mira y ayuda. Nadie se queda fuera.
   ========================================================================== */
function mandoParejas(cuerpo) {
  const grupos = Object.values(Aula.grupos || {});

  const panel = el('div', { class: 'panel' },
    el('h3', { text: 'Feria en parejas' }),
    el('p', { class: 'panel__nota',
      text: 'Cada puesto trabaja solo: uno atiende y cobra, el otro compra y revisa el vuelto. Los roles cambian en cada ronda.' }));

  if (Aula.alumnos.length < 2) {
    panel.append(el('p', { class: 'carro__vacio', text: 'Hacen falta al menos dos tablets conectadas.' }));
    cuerpo.append(panel);
    return;
  }

  /* Cuánto dinero tendrá cada comprador para pagar. Ajustable porque un
     cobro exagerado con poco presupuesto deja al comprador sin poder pagar
     ni juntando todo su dinero. */
  const pasoPpto = 1000;
  const valorPpto = el('b', { text: pesos(Aula.presupuestoFeria) });
  panel.append(el('div', { class: 'ppto-feria' },
    el('span', { text: 'Dinero de cada comprador' }),
    el('button', { class: 'control__btn', onclick: () => {
      Aula.presupuestoFeria = Math.max(3000, Aula.presupuestoFeria - pasoPpto);
      valorPpto.textContent = pesos(Aula.presupuestoFeria);
    } }, '−'),
    valorPpto,
    el('button', { class: 'control__btn', onclick: () => {
      Aula.presupuestoFeria = Math.min(50000, Aula.presupuestoFeria + pasoPpto);
      valorPpto.textContent = pesos(Aula.presupuestoFeria);
    } }, '+')
  ));

  panel.append(el('div', { class: 'aula-mando' },
    el('button', { class: 'btn btn--principal', onclick: armarPuestosAlAzar }, '🎲 Armar al azar'),
    el('button', { class: 'btn btn--chico', onclick: () => { Aula.armando = !Aula.armando; Audio2.boton(); pintarProfesor(); } },
      Aula.armando ? '✕ Cancelar' : '✍️ Elegir yo los puestos'),
    grupos.length ? el('button', { class: 'btn btn--chico btn--peligro', onclick: cerrarPuestos }, 'Terminar la feria') : null
  ));
  cuerpo.append(panel);

  if (Aula.armando) cuerpo.append(armadorManual());

  if (!grupos.length) return;

  /* En qué va cada puesto */
  const etapas = {
    pedido: 'Eligiendo qué comprar', cobro: 'Calculando cuánto cobrar',
    pago: 'Juntando el dinero', disputa: 'Revisando un cobro en duda',
    vuelto: 'Calculando el vuelto',
    revision: 'Revisando la cuenta', cierre: 'Comentando cómo les fue'
  };
  const tablero = el('div', { class: 'tablero' });
  grupos.forEach(g => {
    const errores = g.hechas.filter(h => !h.cobroBien || !h.vueltoBien).length;
    const ficha = el('div', { class: 'alumno alumno--trabajando' },
      el('b', { text: g.miembros.join(' y ') }),
      el('span', { class: 'alumno__estado', text: etapas[g.etapa] || '—' }),
      el('div', { class: 'alumno__estrategias',
        text: `Ronda ${g.ronda + 1} · ${g.hechas.length} compra${g.hechas.length === 1 ? '' : 's'} hecha${g.hechas.length === 1 ? '' : 's'}` +
              (errores ? ` · ${errores} con diferencia` : '') })
    );
    tablero.append(ficha);
  });

  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: `${grupos.length} puesto${grupos.length === 1 ? '' : 's'} funcionando` }),
    el('p', { class: 'panel__nota',
      text: 'Los puestos con diferencia son los que conviene visitar: ahí hay algo que conversar.' }),
    tablero));
}

/**
 * Reparte a todos al azar, en pares (o un trío si sobra uno).
 * Es el camino rápido: sirve cuando no importa quién trabaja con quién.
 */
async function armarPuestosAlAzar() {
  const nombres = Aula.alumnos.slice();
  for (let i = nombres.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = nombres[i]; nombres[i] = nombres[j]; nombres[j] = t;
  }
  const grupos = [];
  while (nombres.length) {
    const cuantos = nombres.length === 3 ? 3 : Math.min(2, nombres.length);
    const miembros = nombres.splice(0, cuantos);
    if (miembros.length === 1 && grupos.length) {
      grupos[grupos.length - 1].miembros.push(miembros[0]);
      break;
    }
    grupos.push({ miembros });
  }
  await mandarPuestos(grupos);
}

/**
 * El panel donde el profesor arma los puestos a mano, tocando nombres.
 * Pensado para juntar a propósito a quien le cuesta más con quien le cuesta
 * menos, en vez de dejarlo al azar.
 */
function armadorManual() {
  /* Se arranca con un puesto vacío por cada dos estudiantes, o el que ya
     hubiera quedado a medio armar */
  if (!Aula.borrador.length) {
    const mitad = Math.max(1, Math.ceil(Aula.alumnos.length / 2));
    Aula.borrador = Array.from({ length: mitad }, () => []);
  }

  const puestos = Aula.alumnos.filter(n =>
    Aula.borrador.some(g => g.indexOf(n) >= 0));
  const sinUbicar = Aula.alumnos.filter(n => puestos.indexOf(n) < 0);

  const quitar = (nombre) => {
    Aula.borrador.forEach(g => {
      const i = g.indexOf(nombre);
      if (i >= 0) g.splice(i, 1);
    });
  };

  const caja = el('div', { class: 'panel armador' },
    el('h3', { text: 'Arma los puestos tú mismo' }),
    el('p', { class: 'panel__nota',
      text: 'Toca un nombre de la lista y después el puesto donde va. Junta a quien le cuesta más con quien le cuesta menos.' }));

  /* Estudiantes todavía sin puesto */
  const pendientes = el('div', { class: 'armador__pendientes' });
  if (sinUbicar.length) {
    sinUbicar.forEach(n => {
      pendientes.append(el('button', {
        class: `armador__nombre ${Aula.eligiendo === n ? 'elegido' : ''}`,
        onclick: () => { Aula.eligiendo = Aula.eligiendo === n ? null : n; Audio2.boton(); pintarProfesor(); }
      }, n));
    });
  } else {
    pendientes.append(el('span', { class: 'armador__listo', text: '✓ Todos tienen puesto' }));
  }
  caja.append(el('div', { class: 'armador__bloque' },
    el('span', { class: 'seguido__rotulo', text: 'Sin ubicar — toca un nombre' }), pendientes));

  /* Los puestos, cada uno tocable para recibir al nombre elegido */
  const lista = el('div', { class: 'armador__puestos' });
  Aula.borrador.forEach((g, i) => {
    const puesto = el('div', {
      class: `armador__puesto ${Aula.eligiendo ? 'armador__puesto--activo' : ''}`,
      onclick: () => {
        if (!Aula.eligiendo) return;
        quitar(Aula.eligiendo);
        g.push(Aula.eligiendo);
        Aula.eligiendo = null;
        Audio2.tomar();
        pintarProfesor();
      }
    });
    puesto.append(el('span', { class: 'armador__numero', text: `Puesto ${i + 1}` }));
    if (g.length) {
      g.forEach(n => puesto.append(el('span', { class: 'armador__ficha' },
        n,
        el('button', {
          class: 'armador__sacar', 'aria-label': `Sacar a ${n}`,
          onclick: (ev) => { ev.stopPropagation(); quitar(n); Audio2.boton(); pintarProfesor(); }
        }, '✕'))));
    } else {
      puesto.append(el('span', { class: 'armador__vacio', text: 'Toca aquí para poner a alguien' }));
    }
    lista.append(puesto);
  });
  caja.append(el('div', { class: 'armador__bloque' },
    el('span', { class: 'seguido__rotulo', text: 'Puestos' }), lista,
    el('button', {
      class: 'btn btn--fantasma btn--chico', style: 'margin-top:10px',
      onclick: () => { Aula.borrador.push([]); Audio2.boton(); pintarProfesor(); }
    }, '+ Agregar otro puesto')
  ));

  /* Solo se puede mandar cuando no falte nadie y ningún puesto quede solo */
  const listos = Aula.borrador.filter(g => g.length > 0);
  const conUno = listos.filter(g => g.length === 1);
  const puedeMandar = sinUbicar.length === 0 && conUno.length === 0 && listos.length > 0;

  let aviso2 = '';
  if (sinUbicar.length) aviso2 = `Falta ubicar a ${sinUbicar.join(', ')}.`;
  else if (conUno.length) aviso2 = 'Ningún puesto puede quedar con una sola persona: júntalo con otro.';

  caja.append(el('div', { class: 'aula-mando' },
    el('button', {
      class: 'btn btn--principal btn--grande', disabled: !puedeMandar,
      onclick: () => mandarPuestos(listos.map(miembros => ({ miembros })))
    }, '📤 Mandar estos puestos'),
    el('button', {
      class: 'btn btn--chico btn--fantasma',
      onclick: () => { Aula.borrador = []; Aula.eligiendo = null; Audio2.boton(); pintarProfesor(); }
    }, '↺ Empezar de nuevo')
  ));
  if (aviso2) caja.append(el('p', { class: 'panel__nota', style: 'color:var(--frutilla-osc)', text: aviso2 }));

  return caja;
}

/** Envía los puestos —al azar o elegidos a mano— y les da billetera inicial. */
async function mandarPuestos(grupos) {
  Audio2.boton();
  usarCatalogo('botalcura');

  const monto = Aula.presupuestoFeria || 15000;
  const conId = grupos.map((g, i) => ({
    id: 'p' + i,
    miembros: g.miembros,
    /* El comprador debe poder pagar cualquier cobro razonable y recibir
       vuelto. Usar solo el monto fijo (sin sumarle un "total" aparte) evita
       que la billetera crezca artificialmente y quede predecible. */
    billetera: generarBilletera(monto, Math.round(monto * 0.4))
  }));

  const r = await fetch('/api/parejas', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo: Aula.codigo, grupos: conId })
  }).then(x => x.json()).catch(() => ({ error: 'No se pudo armar' }));

  if (r.error) { aviso(r.error, 'mal'); return; }
  Aula.armando = false;
  Aula.borrador = [];
  Aula.eligiendo = null;
  aviso(`${conId.length} puestos armados`, 'bien');
  pintarProfesor();
}

async function cerrarPuestos() {
  Audio2.boton();
  await fetch('/api/parejas', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo: Aula.codigo, grupos: [] })
  }).catch(() => {});
  await pedir('ir-a', { c: Aula.codigo, d: 0 });
}
