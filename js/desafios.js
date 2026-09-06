/* ============================================================================
   desafios.js — Modo Desafíos (Experiencia 3)
   ----------------------------------------------------------------------------
   Problemas no rutinarios con dinero. La diferencia con el resto del juego:
   aquí no siempre hay un solo camino ni una sola respuesta. En los desafíos de
   tipo "combinación" cualquier compra que cumpla la regla es correcta, y lo
   que se evalúa es la estrategia, no la coincidencia con una cifra.

   Al resolver, el estudiante marca cómo lo pensó eligiendo tarjetas. Sirve
   para el indicador "justifica el procedimiento" sin exigirle escribir, que
   es una barrera real para varios estudiantes del curso.
   ========================================================================== */

const Desafio = {
  indice: 0,        // en qué desafío va
  respuesta: '',    // lo que lleva escrito
  intentos: 0,      // cuántas veces se equivocó en este
  resuelto: false,
  acerto: true,        // ¿la respuesta con que cerró era la correcta?
  ultimaEleccion: null,// la opción que marcó, para poder dejarla anotada
  verPista: false,
  compra: [],       // para los desafíos de combinación
  estrategias: [],  // tarjetas que marcó
  resueltos: [],    // ids resueltos bien, para la cinta de progreso
  revisados: [],    // ids que dejó con una respuesta equivocada
  mensajeExito: '',    // el elogio del desafío recién resuelto
  respuestaDejada: ''  // lo que dejó anotado cuando no acertó
};

/** El desafío que se está mostrando. */
function desafioActual() {
  return DESAFIOS[Desafio.indice];
}

/* --- Empezar ------------------------------------------------------------- */
function iniciarDesafios(desde = 0) {
  /* Los enunciados usan los precios de la feria, así que se activa ese catálogo */
  usarCatalogo('botalcura');
  Desafio.indice = Math.max(0, Math.min(desde, DESAFIOS.length - 1));
  Desafio.resueltos = [];
  Desafio.revisados = [];
  reiniciarDesafio();
  pintarDesafio();
  mostrarPantalla('desafios');
}

function reiniciarDesafio() {
  Desafio.respuesta = '';
  Desafio.intentos = 0;
  Desafio.resuelto = false;
  Desafio.acerto = true;
  Desafio.ultimaEleccion = null;
  Desafio.verPista = false;
  Desafio.compra = [];
  Desafio.estrategias = [];
  /* Estos dos se escriben al cerrar un desafío y se leían al cerrar el
     siguiente: quien acertaba una pregunta de elección después de haber
     resuelto una compra veía el elogio de la compra anterior. */
  Desafio.mensajeExito = '';
  Desafio.respuestaDejada = '';
}

function irADesafio(i) {
  if (i < 0 || i >= DESAFIOS.length) return;
  Desafio.indice = i;
  reiniciarDesafio();
  Audio2.boton();
  pintarDesafio();
}

/* --- Cálculos de los desafíos de combinación ----------------------------- */
function totalCompra() {
  return Desafio.compra.reduce((t, i) => t + i.subtotal, 0);
}

/** Precio y forma de venta de un producto dentro de los desafíos. */
function modoDeFeria(producto) {
  if (producto.unidad != null) return 'unidad';
  if (producto.fijo != null) return 'fijo';
  return 'kilo';
}

function cambiarCompra(producto, delta) {
  const modo = modoDeFeria(producto);
  const paso = modo === 'kilo' ? pasoDe(producto) : 1;
  let linea = Desafio.compra.find(i => i.id === producto.id);

  if (!linea) {
    if (delta <= 0) return;
    linea = { id: producto.id, nombre: producto.nombre, modo, precio: producto[modo],
              cantidad: 0, gramos: 0, subtotal: 0, envase: producto.envase || null,
              plural: producto.plural || null };
    Desafio.compra.push(linea);
  }

  if (modo === 'kilo') {
    linea.gramos = Math.max(0, linea.gramos + delta * paso);
    linea.subtotal = linea.precio * linea.gramos / 1000;
  } else {
    linea.cantidad = Math.max(0, linea.cantidad + delta);
    linea.subtotal = linea.precio * linea.cantidad;
  }

  if (linea.cantidad <= 0 && linea.gramos <= 0) {
    Desafio.compra = Desafio.compra.filter(i => i !== linea);
  }
  Audio2.tomar();
  pintarDesafio();
}

/* --- Revisión ------------------------------------------------------------ */

/**
 * Revisa la respuesta y devuelve { bien, mensaje }.
 * En los desafíos de combinación no se compara con una cifra: se comprueba
 * que la compra cumpla la regla, y por eso hay muchas respuestas correctas.
 */
function revisarDesafio() {
  const d = desafioActual();

  if (d.tipo === 'numero') {
    if (Desafio.respuesta === '') return { bien: false, mensaje: 'Escribe tu respuesta' };
    const escrito = Number(Desafio.respuesta);
    if (escrito === d.respuesta) return { bien: true, mensaje: '¡Correcto!' };
    return {
      bien: false,
      mensaje: escrito > d.respuesta ? 'Te pasaste. Vuelve a intentarlo.' : 'Te quedaste corto. Vuelve a intentarlo.'
    };
  }

  if (d.tipo === 'combinacion') {
    const total = totalCompra();
    if (!Desafio.compra.length) return { bien: false, mensaje: 'Todavía no eliges nada' };
    if (total > d.tope) {
      return { bien: false, mensaje: `Te pasaste por ${pesos(total - d.tope)}. Saca algo.` };
    }
    if (d.regla === 'cabe') {
      return { bien: true, mensaje: `¡Bien! Gastaste ${pesos(total)} y te alcanzaba.` };
    }
    /* maximizar: se acepta, y se dice cuánto sobró para que intente afinar */
    const sobra = d.tope - total;
    if (sobra === 0) return { bien: true, mensaje: '¡Perfecto! Gastaste todo el dinero.', perfecto: true };
    return { bien: true, mensaje: `Gastaste ${pesos(total)} y te sobran ${pesos(sobra)}. ¿Puedes gastar más?`, sobra };
  }

  return { bien: false, mensaje: '' };
}

/**
 * Lo que el estudiante dejó como respuesta, sea cual sea el tipo de desafío.
 * Se usa al avisarle al profesor, para que el tablero muestre siempre lo
 * mismo que ve el estudiante en su pantalla.
 */
function valorRespondido() {
  const d = desafioActual();
  if (d.tipo === 'combinacion') return pesos(totalCompra());
  if (d.tipo === 'eleccion') return Desafio.ultimaEleccion ? Desafio.ultimaEleccion.texto : '—';
  if (!Desafio.acerto && Desafio.respuestaDejada) return Desafio.respuestaDejada;
  return Desafio.respuesta || '—';
}

/** ¿Puede cerrar el desafío aunque no haya acertado? */
function puedeDejarIncorrecta() {
  return Juego.config.permitirIncorrecta !== false && Desafio.intentos >= 2 && !Desafio.resuelto;
}

/**
 * Cierra el desafío con la respuesta equivocada del estudiante.
 *
 * Quedar atascado hasta acertar frustra y no enseña. Dejando la respuesta
 * anotada, el estudiante ve el procedimiento correcto, puede decir cómo lo
 * pensó, y su error queda en el tablero del profesor para comentarlo con el
 * curso: el error como parte del aprendizaje, no como castigo.
 */
function dejarRespuesta() {
  const d = desafioActual();
  const suya = d.tipo === 'eleccion'
    ? (Desafio.ultimaEleccion ? Desafio.ultimaEleccion.texto : '—')
    : (Desafio.respuesta || '—');

  Desafio.resuelto = true;
  Desafio.acerto = false;
  Desafio.respuestaDejada = suya;
  if (Desafio.revisados.indexOf(d.id) < 0) Desafio.revisados.push(d.id);
  Audio2.soltar();
  if (typeof avisarRespuesta === 'function') avisarRespuesta(suya, false);
  pintarDesafio();
}

function responderEleccion(opcion) {
  const d = desafioActual();
  Desafio.ultimaEleccion = opcion;
  if (typeof avisarRespuesta === 'function') avisarRespuesta(opcion.texto, !!opcion.correcta);
  if (opcion.correcta) {
    Desafio.resuelto = true;
    Desafio.acerto = true;
    if (Desafio.resueltos.indexOf(d.id) < 0) Desafio.resueltos.push(d.id);
    Audio2.exito();
  } else {
    Desafio.intentos++;
    Audio2.error();
    aviso('Esa no es. Compara los dos precios con calma.', 'mal');
  }
  pintarDesafio();
}

function comprobarDesafio() {
  const d = desafioActual();
  const r = revisarDesafio();

  if (!r.bien) {
    Desafio.intentos++;
    /* El profesor ve también los intentos fallidos: así sabe quién está
       trabajando y en qué se equivocó, para acercarse a apoyar. */
    if (typeof avisarRespuesta === 'function') {
      avisarRespuesta(Desafio.respuesta || (d.tipo === 'combinacion' ? pesos(totalCompra()) : '—'), false);
    }
    Audio2.error();
    aviso(r.mensaje, 'mal');
    /* Tras dos intentos se ofrece la pista, en vez de dejarlo atascado */
    if (Desafio.intentos >= 2 && !Desafio.verPista) {
      Desafio.verPista = true;
      pintarDesafio();
    }
    return;
  }

  Desafio.resuelto = true;
  Desafio.acerto = true;
  Desafio.mensajeExito = r.mensaje;
  if (typeof avisarRespuesta === 'function') avisarRespuesta(valorRespondido(), true);
  if (Desafio.resueltos.indexOf(d.id) < 0) Desafio.resueltos.push(d.id);
  Audio2.exito();
  if (d.tipo !== 'combinacion' || r.perfecto) confeti(1400);
  pintarDesafio();
}

/* --- Dibujo de la pantalla ------------------------------------------------ */

/** Cinta de progreso: un punto por desafío, tocable para saltar. */
function cintaDesafios() {
  const cinta = el('div', { class: 'cinta' });
  DESAFIOS.forEach((d, i) => {
    const hecho = Desafio.resueltos.indexOf(d.id) >= 0;
    const revisar = !hecho && Desafio.revisados.indexOf(d.id) >= 0;
    cinta.append(el('button', {
      class: `cinta__paso ${i === Desafio.indice ? 'actual' : ''} ${hecho ? 'hecho' : ''} ${revisar ? 'revisar' : ''}`,
      'aria-label': `Desafío ${i + 1}${hecho ? ', resuelto' : revisar ? ', para revisar' : ''}`,
      onclick: () => irADesafio(i)
    }, hecho ? '✓' : revisar ? '?' : String(i + 1)));
  });
  return cinta;
}

/** Los productos que aparecen en el enunciado, con su precio. */
function vitrina(ids) {
  const caja = el('div', { class: 'vitrina' });
  (ids || []).forEach(id => {
    const p = PRODUCTOS_BOTALCURA.find(x => x.id === id);
    if (!p) return;
    const modo = modoDeFeria(p);
    const rotulo = { fijo: p.envase || 'cada uno', unidad: p.envase || 'cada uno', kilo: 'el kilo' }[modo];
    const ficha = el('div', { class: 'vitrina__item' });
    ficha.insertAdjacentHTML('beforeend', dibujoProducto(p.id));
    ficha.append(
      el('b', { text: p.nombre }),
      el('span', { class: 'vitrina__precio', html: `${pesos(p[modo])}<small>${rotulo}</small>` })
    );
    caja.append(ficha);
  });
  return caja;
}

/** Teclado para escribir un número. */
function tecladoRespuesta() {
  const visor = el('div', { class: 'visor visor--desafio' });
  const d = desafioActual();
  const refrescar = () => {
    visor.textContent = Desafio.respuesta
      ? (d.unidad === 'pesos' ? pesos(Number(Desafio.respuesta)) : `${miles(Number(Desafio.respuesta))} ${d.unidad}`)
      : (d.unidad === 'pesos' ? '$ ?' : `? ${d.unidad}`);
  };
  refrescar();

  const teclado = el('div', { class: 'teclado teclado--cuatro' });
  ['1','2','3','C','4','5','6','<','7','8','9','00','0'].forEach(k => {
    teclado.append(el('button', {
      class: `tecla ${k === 'C' ? 'tecla--borrar' : ''} ${k === '<' ? 'tecla--atras' : ''} ${k === '0' ? 'tecla--ancha' : ''}`,
      onclick: () => {
        Audio2.boton();
        if (k === 'C') Desafio.respuesta = '';
        else if (k === '<') Desafio.respuesta = Desafio.respuesta.slice(0, -1);
        else if (Desafio.respuesta.length < 7) Desafio.respuesta += k;
        refrescar();
      }
    }, k === '<' ? '⌫' : k));
  });

  return el('div', { class: 'respuesta' }, visor, teclado,
    el('button', { class: 'btn btn--principal btn--grande', onclick: comprobarDesafio }, 'Comprobar'));
}

/** Mostrador de la feria para armar una compra. */
function mostradorFeria() {
  const d = desafioActual();
  const total = totalCompra();
  const sobra = d.tope - total;

  const marcador = el('div', { class: `marcador ${sobra < 0 ? 'marcador--pasado' : ''}` },
    el('div', {}, el('span', { text: 'Llevas' }), el('b', { class: 'cifra', text: pesos(total) })),
    el('div', {}, el('span', { text: sobra >= 0 ? 'Te queda' : 'Te pasaste por' }),
      el('b', { class: 'cifra', text: pesos(Math.abs(sobra)) }))
  );

  const grilla = el('div', { class: 'feria' });
  PRODUCTOS_BOTALCURA.forEach(p => {
    const modo = modoDeFeria(p);
    const linea = Desafio.compra.find(i => i.id === p.id);
    const cuanto = modo === 'kilo'
      ? (linea && linea.gramos ? peso(linea.gramos) : '0 kg')
      : `${linea ? linea.cantidad : 0} ${modo === 'fijo' ? (p.envase || 'u.') : 'u.'}`;

    const ficha = el('div', { class: `feria__item ${linea ? 'en-carro' : ''}` });
    ficha.insertAdjacentHTML('beforeend', dibujoProducto(p.id));
    ficha.append(
      el('b', { text: p.nombre }),
      el('span', { class: 'feria__precio', text: pesos(p[modo]) + (modo === 'kilo' ? ' el kilo' : '') }),
      el('div', { class: 'control' },
        el('span', { class: 'control__valor', text: cuanto }),
        el('button', { class: 'control__btn', disabled: !linea, onclick: () => cambiarCompra(p, -1) }, '−'),
        el('button', { class: 'control__btn', onclick: () => cambiarCompra(p, 1) }, '+')
      )
    );
    grilla.append(ficha);
  });

  return el('div', {}, marcador, grilla,
    el('button', { class: 'btn btn--principal btn--grande', style: 'width:100%;margin-top:16px', onclick: comprobarDesafio },
      d.regla === 'maximizar' ? 'Revisar mi compra' : 'Comprobar'));
}

/** Tarjetas para marcar cómo lo pensó. */
function tarjetasEstrategia() {
  const caja = el('div', { class: 'estrategias' });
  ESTRATEGIAS.forEach(e => {
    const marcada = Desafio.estrategias.indexOf(e.id) >= 0;
    caja.append(el('button', {
      class: `estrategia ${marcada ? 'marcada' : ''}`,
      'aria-pressed': marcada ? 'true' : 'false',
      onclick: () => {
        const i = Desafio.estrategias.indexOf(e.id);
        if (i >= 0) Desafio.estrategias.splice(i, 1);
        else Desafio.estrategias.push(e.id);
        Audio2.tomar();
        /* Se vuelve a avisar para que el profesor vea la estrategia elegida:
           las tarjetas se marcan DESPUÉS de responder. Se conserva si acertó
           o no: marcar una estrategia no convierte en correcta una respuesta
           equivocada. */
        if (typeof avisarRespuesta === 'function') {
          avisarRespuesta(valorRespondido(), Desafio.acerto);
        }
        pintarDesafio();
      }
    }, el('span', { class: 'estrategia__emoji', text: e.emoji }), el('span', { text: e.texto })));
  });
  return caja;
}

function pintarDesafio() {
  const d = desafioActual();
  const cuerpo = $('#desafios-cuerpo');
  cuerpo.innerHTML = '';

  cuerpo.append(cintaDesafios());

  /* Enunciado */
  const tarjeta = el('div', { class: 'desafio' },
    el('div', { class: 'desafio__num', text: `Desafío ${Desafio.indice + 1} de ${DESAFIOS.length}` }),
    el('h2', { class: 'desafio__titulo', text: d.titulo }),
    el('p', { class: 'desafio__enunciado', text: d.enunciado })
  );
  if (d.muestra) tarjeta.append(vitrina(d.muestra));
  cuerpo.append(tarjeta);

  /* Pista, a mano o tras dos intentos */
  if (Desafio.verPista && !Desafio.resuelto) {
    cuerpo.append(el('div', { class: 'pista' },
      el('b', { text: '💡 Una ayuda' }), el('p', { text: d.pista })));
  }

  if (!Desafio.resuelto) {
    if (d.tipo === 'numero') cuerpo.append(tecladoRespuesta());
    else if (d.tipo === 'combinacion') cuerpo.append(mostradorFeria());
    else {
      const opciones = el('div', { class: 'elecciones' });
      d.opciones.forEach(o => opciones.append(el('button', {
        class: 'btn btn--grande eleccion', onclick: () => responderEleccion(o)
      }, o.texto)));
      cuerpo.append(opciones);
    }

    const extras = el('div', { class: 'desafio-extras' });
    if (!Desafio.verPista) {
      extras.append(el('button', {
        class: 'btn btn--fantasma btn--chico',
        onclick: () => { Desafio.verPista = true; Audio2.boton(); pintarDesafio(); }
      }, '💡 Necesito una ayuda'));
    }
    /* Tras un par de intentos puede dejar su respuesta y seguir adelante */
    if (puedeDejarIncorrecta()) {
      extras.append(el('button', {
        class: 'btn btn--fantasma btn--chico', onclick: dejarRespuesta
      }, '📌 Dejar mi respuesta y seguir'));
    }
    if (extras.children.length) cuerpo.append(extras);
    return;
  }

  /* --- Resuelto --- */
  if (Desafio.acerto) {
    cuerpo.append(el('div', { class: 'logro' },
      el('span', { class: 'logro__emoji', text: '🎉' }),
      el('h3', { text: Desafio.mensajeExito || '¡Correcto!' }),
      el('p', { class: 'logro__explica', text: d.explicacion })
    ));
  } else {
    /* Se anota su respuesta sin dramatizar el error, y se muestra el camino
       correcto para que pueda compararlo con el suyo. */
    const correcta = d.tipo === 'eleccion'
      ? (d.opciones.filter(o => o.correcta)[0] || {}).texto
      : (d.unidad === 'pesos' ? pesos(d.respuesta) : `${miles(d.respuesta)} ${d.unidad}`);
    const suya = d.tipo === 'numero' && /^\d+$/.test(Desafio.respuestaDejada || '')
      ? (d.unidad === 'pesos' ? pesos(Number(Desafio.respuestaDejada)) : `${miles(Number(Desafio.respuestaDejada))} ${d.unidad}`)
      : Desafio.respuestaDejada;

    cuerpo.append(el('div', { class: 'logro logro--revisar' },
      el('span', { class: 'logro__emoji', text: '🤔' }),
      el('h3', { text: 'Anotamos tu respuesta' }),
      el('div', { class: 'contraste' },
        el('div', { class: 'contraste__lado' },
          el('span', { text: 'Tu respuesta' }), el('b', { text: suya })),
        el('div', { class: 'contraste__lado contraste__lado--buena' },
          el('span', { text: 'La respuesta era' }), el('b', { text: correcta }))
      ),
      el('p', { class: 'logro__explica', text: d.explicacion }),
      el('p', { class: 'logro__animo', text: 'Equivocarse ayuda a aprender. Compáralo con lo tuyo y coméntalo con el curso.' })
    ));
  }

  /* Justificación: cómo lo pensó */
  if (Juego.config.pedirEstrategia !== false) {
    cuerpo.append(el('div', { class: 'panel' },
      el('h3', { text: '¿Cómo lo pensaste?' }),
      el('p', { class: 'panel__nota', text: 'Marca todo lo que usaste. Puede ser más de uno.' }),
      tarjetasEstrategia()
    ));
  }

  const acciones = el('div', { class: 'boleta-acciones' });
  if (Desafio.indice < DESAFIOS.length - 1) {
    acciones.append(el('button', { class: 'btn btn--principal btn--grande', onclick: () => irADesafio(Desafio.indice + 1) }, 'Siguiente desafío ➡'));
  } else {
    acciones.append(el('button', { class: 'btn btn--principal btn--grande', onclick: () => { Audio2.exito(); confeti(); aviso('¡Terminaste todos los desafíos!', 'bien'); } }, '🏆 ¡Terminaste todos!'));
  }
  acciones.append(el('button', {
    class: `btn ${Desafio.acerto ? 'btn--fantasma btn--chico' : 'btn--verde'}`,
    onclick: () => { reiniciarDesafio(); pintarDesafio(); }
  }, '🔁 Intentar de nuevo'));
  cuerpo.append(acciones);
}
