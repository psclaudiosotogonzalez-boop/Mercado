/* ============================================================================
   app.js — Estado, navegación y arranque
   ----------------------------------------------------------------------------
   Un único objeto Juego guarda la partida en curso. Todo vive en memoria:
   sin servidor, sin base de datos y sin cuentas de usuario. Lo único que se
   recuerda entre sesiones es la configuración que deja preparada el profesor.
   ========================================================================== */

const Juego = {
  config: Object.assign({}, CONFIG_DEFECTO, Guardado.leer() || {}),

  lista: [],            // lo que hay que comprar
  presupuesto: 0,       // plata disponible
  billetera: {},        // ese presupuesto convertido en billetes y monedas
  carro: [],            // lo que el estudiante lleva
  pago: {},             // lo que puso en la bandeja de la caja
  vueltoReal: 0,        // vuelto correcto
  vueltoRespuesta: null,// vuelto que respondió el estudiante
  erroresPago: 0,       // intentos fallidos en la caja
  modoProducto: {},     // modo de precio con que se vende cada producto en el nivel

  tachadoManual: [],        // líneas que el estudiante marcó por su cuenta
  totalVerificado: false,   // ¿ya calculó bien el total del carro?
  totalEscrito: '',         // lo que lleva escrito en la casilla
  intentosTotal: 0,         // cuántas veces falló el cálculo
  calculadoraAbierta: false,
  calcExpresion: '',
  calcResultado: null
};

/* --- Navegación ----------------------------------------------------------- */
function mostrarPantalla(nombre) {
  $$('.pantalla').forEach(p => p.classList.remove('activa'));
  $(`#pantalla-${nombre}`).classList.add('activa');
  window.scrollTo(0, 0);
}

/* --- Preparar una partida ------------------------------------------------- */

/**
 * Decide con qué modo de precio se vende cada producto en este nivel.
 * Los productos de la lista conservan el modo con que fueron pedidos; el resto
 * toma cualquier modo válido del nivel. Así un mismo producto nunca aparece
 * con dos precios distintos dentro de la misma partida.
 */
function asignarModos(lista, nivel) {
  const mapa = {};
  lista.forEach(p => { mapa[p.id] = p.modo; });
  PRODUCTOS.forEach(p => {
    if (mapa[p.id]) return;
    const posibles = modosValidos(p, nivel);
    if (posibles.length) mapa[p.id] = alAzar(posibles);
  });
  /* Última red: ningún producto puede quedar con un modo sin precio */
  Object.keys(mapa).forEach(id => {
    const p = PRODUCTOS.find(x => x.id === id);
    if (!tienePrecio(p, mapa[id])) delete mapa[id];
  });
  return mapa;
}

/**
 * Busca una lista que quepa en el presupuesto que fijó el profesor.
 * Si después de varios intentos no cabe, va sacando productos; y si aun así
 * no alcanza, avisa y usa el presupuesto sugerido para que la actividad
 * siga siendo jugable.
 */
function listaQueQuepa(config, nivel) {
  const tope = config.presupuesto;
  for (let intento = 0; intento < 40; intento++) {
    const lista = generarLista(config);
    if (totalLista(lista) <= tope * 0.9) return { lista, presupuesto: tope };
  }
  let lista = generarLista(config);
  while (lista.length > 2 && totalLista(lista) > tope * 0.9) lista.pop();
  if (totalLista(lista) <= tope * 0.9) return { lista, presupuesto: tope };

  aviso('El presupuesto era muy bajo para esta lista. Lo ajusté.', 'mal');
  return { lista, presupuesto: presupuestoSugerido(lista, nivel) };
}

/**
 * Arma una partida completa (lista, presupuesto, billetera y precios) sin
 * empezar a jugarla. Se usa tanto al jugar solo como al preparar la actividad
 * que el profesor manda a todas las tablets.
 */
function armarPartida(numeroNivel, config = Juego.config) {
  const nivel = NIVELES[numeroNivel];
  usarCatalogo(config.catalogo);

  let lista, presupuesto;
  if (config.presupuestoAuto) {
    lista = generarLista(Object.assign({}, config, { nivel: numeroNivel }));
    presupuesto = presupuestoSugerido(lista, nivel);
  } else {
    ({ lista, presupuesto } = listaQueQuepa(Object.assign({}, config, { nivel: numeroNivel }), nivel));
  }

  /* Red de seguridad: si la lista quedó vacía o con un total imposible, se
     arma una al azar en vez de arrancar con el juego roto. */
  if (!lista.length || !Number.isFinite(totalLista(lista)) || totalLista(lista) <= 0) {
    lista = generarLista(Object.assign({}, config, { nivel: numeroNivel, listaManual: null }));
    presupuesto = presupuestoSugerido(lista, nivel);
  }
  if (!Number.isFinite(presupuesto) || presupuesto <= 0) {
    presupuesto = presupuestoSugerido(lista, nivel);
  }

  /* --- Billetera ---------------------------------------------------------
     En las actividades con vuelto la billetera NO debe permitir pagar justo:
     si el estudiante puede dar el monto exacto, se salta el cálculo del
     vuelto, que es justamente lo que la actividad ejercita.

     Para unos pocos totales «redondos» (por ejemplo $20.000) es
     matemáticamente imposible armar una billetera que impida el pago justo,
     porque esos montos se alcanzan con casi cualquier combinación. En esos
     casos se sortea otra lista, que es lo único que se puede cambiar sin
     romper la actividad. */
  let billetera;
  if (modoPagoDe(config, numeroNivel) === 'vuelto') {
    for (let intento = 0; intento < 12; intento++) {
      const resultado = generarBilleteraConVuelto(presupuesto, totalLista(lista));

      if (resultado && resultado.billetera) {
        /* Hizo falta subir un poco el presupuesto para lograrlo */
        billetera = resultado.billetera;
        presupuesto = resultado.presupuesto;
        break;
      }
      if (resultado) { billetera = resultado; break; }

      /* Con esta lista no hay forma: se prueba con otra */
      if (intento < 11 && !config.listaManual) {
        lista = generarLista(Object.assign({}, config, { nivel: numeroNivel }));
        presupuesto = presupuestoSugerido(lista, nivel);
      } else {
        break;
      }
    }
  }
  /* Pago exacto, o el caso raro en que no se pudo evitar el pago justo */
  if (!billetera) billetera = generarBilletera(presupuesto, totalLista(lista));

  return {
    nivel: numeroNivel,
    catalogo: config.catalogo,
    lista,
    presupuesto,
    billetera,
    modoProducto: asignarModos(lista, nivel)
  };
}

/** Deja el juego listo para jugar una partida ya armada. */
function montarPartida(partida) {
  usarCatalogo(partida.catalogo || Juego.config.catalogo);
  Juego.config.nivel = partida.nivel;
  Juego.lista = partida.lista;
  Juego.presupuesto = partida.presupuesto;
  Juego.billetera = partida.billetera;
  Juego.modoProducto = partida.modoProducto;
  Juego.carro = [];
  Juego.pago = {};
  Juego.vueltoReal = 0;
  Juego.vueltoRespuesta = null;
  Juego.erroresPago = 0;
  Juego.tachadoManual = [];
  Juego.totalVerificado = false;
  Juego.totalEscrito = '';
  Juego.intentosTotal = 0;
  Juego.calcExpresion = '';
  Juego.calcResultado = null;

  seccionActiva = Juego.lista[0] ? Juego.lista[0].seccion : SECCIONES[0].id;

  const necesitaCalculadora = debeCalcularTotal();
  $('#btn-calculadora').hidden = !(necesitaCalculadora || Juego.config.ayudaCalculadora);
  Juego.calculadoraAbierta = necesitaCalculadora;

  pintarMercado();
  pintarCalculadora();
  mostrarPantalla('mercado');
}

function nuevaPartida(numeroNivel) {
  Juego.config.nivel = numeroNivel;
  montarPartida(armarPartida(numeroNivel));
}

/* --- Pantalla: elegir nivel ----------------------------------------------- */
function pintarNiveles() {
  const grilla = $('#grilla-niveles');
  grilla.innerHTML = '';
  Object.values(NIVELES).forEach(nivel => {
    grilla.append(el('button', {
      class: `nivel ${nivel.id === 4 ? 'nivel--reto' : ''}`,
      onclick: () => { Audio2.boton(); nuevaPartida(nivel.id); }
    },
      el('div', { class: 'toldo', style: 'height:18px;border-radius:0' }),
      el('div', { class: 'nivel__cuerpo' },
        el('span', { class: 'nivel__emoji', text: nivel.emoji }),
        el('div', { class: 'nivel__num', text: nivel.id === 4 ? 'Nivel extra' : `Nivel ${nivel.id}` }),
        el('div', { class: 'nivel__nombre', text: nivel.nombre }),
        el('div', { class: 'nivel__lema', text: nivel.lema })
      )
    ));
  });
}

/* --- Pantalla: conoce el dinero ------------------------------------------- */
function decir(texto) {
  Audio2.boton();
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = 'es-CL';
    voz.rate = 0.9;
    speechSynthesis.speak(voz);
  } catch (e) { /* el navegador no tiene voz: da igual, ya sonó el toque */ }
}

function pintarGaleria() {
  const pintar = (contenedor, tipo) => {
    const caja = $(contenedor);
    caja.innerHTML = '';
    DENOMINACIONES.filter(d => d.tipo === tipo).forEach(d => {
      const ficha = el('button', { class: 'galeria__ficha', onclick: () => decir(d.nombre) });
      ficha.insertAdjacentHTML('beforeend', `<img src="${d.img}" alt="${d.nombre}">`);
      ficha.append(el('div', {},
        el('div', { class: 'galeria__valor', text: pesos(d.valor) }),
        el('div', { class: 'galeria__nombre', text: d.nombre })
      ));
      caja.append(ficha);
    });
  };
  pintar('#galeria-billetes', 'billete');
  pintar('#galeria-monedas', 'moneda');
}

/* --- Pantalla: preparar la actividad -------------------------------------- */
function guardarConfig() {
  Guardado.escribir(Juego.config);
  Audio2.activo = Juego.config.sonido;
  document.documentElement.classList.toggle('texto-grande', Juego.config.textoGrande);
  document.documentElement.classList.toggle('proyeccion', !!Juego.config.proyeccion);
}

/** Grupo de botones excluyentes. */
function selector(valorActual, opciones, alElegir) {
  const caja = el('div', { class: 'opciones' });
  opciones.forEach(([valor, rotulo]) => {
    caja.append(el('button', {
      class: `opcion ${valor === valorActual ? 'elegida' : ''}`,
      onclick: () => { Audio2.boton(); alElegir(valor); }
    }, rotulo));
  });
  return caja;
}

/** Casilla de verificación grande. */
function casilla(rotulo, marcada, alCambiar, pista) {
  const entrada = el('input', { type: 'checkbox' });
  entrada.checked = marcada;
  entrada.addEventListener('change', () => { alCambiar(entrada.checked); guardarConfig(); });
  return el('label', { class: 'campo' },
    el('span', { class: 'interruptor' }, entrada, el('span', { text: rotulo })),
    pista ? el('span', { class: 'campo__pista', text: pista }) : null
  );
}

/**
 * Dibuja el panel de preparación.
 * Recibe dónde dibujarlo para poder reutilizarlo tal cual dentro del modo
 * aula, sin duplicar la pantalla ni sus opciones.
 */
function pintarConfig(destino = '#config-cuerpo') {
  const c = Juego.config;
  usarCatalogo(c.catalogo);
  const cuerpo = typeof destino === 'string' ? $(destino) : destino;
  cuerpo.innerHTML = '';

  /* Catálogo de productos */
  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: '¿Qué productos aparecen?' }),
    selector(c.catalogo, Object.values(CATALOGOS).map(k => [k.id, `${k.emoji} ${k.nombre}`]),
      v => { c.catalogo = v; usarCatalogo(v); c.listaManual = null; guardarConfig(); pintarConfig(destino); }),
    el('p', { class: 'campo__pista', text: CATALOGOS[c.catalogo].descripcion })
  ));

  /* Nivel */
  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: 'Nivel' }),
    selector(c.nivel, Object.values(NIVELES).map(n => [n.id, `${n.emoji} ${n.nombre}`]), v => { c.nivel = v; guardarConfig(); pintarConfig(destino); }),
    el('p', { class: 'campo__pista', text: NIVELES[c.nivel].lema })
  ));

  /* Presupuesto y largo de la lista: chips que abren el teclado numérico
     modal, con la misma tecla ⌫ del resto del juego. Antes eran campos
     nativos <input type=number>: se podía escribir, pero no había forma de
     tocar un botón de borrar como en el resto del juego, y en tablets viejas
     ese tipo de campo es poco confiable. */
  const montoBoton = el('button', {
    class: 'chip-numero', type: 'button', disabled: c.presupuestoAuto,
    text: pesos(c.presupuesto)
  });
  montoBoton.addEventListener('click', () => {
    if (c.presupuestoAuto) return;
    abrirTecladoNum({
      titulo: '¿Cuál es el presupuesto?', valorInicial: c.presupuesto,
      min: 1000, max: 100000, paso: 100, prefijo: '$', formatear: miles
    }, n => { c.presupuesto = Math.max(1000, n); guardarConfig(); montoBoton.textContent = pesos(c.presupuesto); });
  });

  const nItemsBoton = el('button', {
    class: 'chip-numero', type: 'button',
    text: c.nItems ? `${c.nItems} productos` : 'Según el nivel'
  });
  nItemsBoton.addEventListener('click', () => {
    abrirTecladoNum({
      titulo: '¿Cuántos productos en la lista?', valorInicial: c.nItems,
      min: 2, max: 8, paso: 1, sufijo: ' productos', formatear: miles,
      permiteVacio: true, textoVacio: 'Según el nivel', textoBorrar: '↺ Volver a «según el nivel»'
    }, n => { c.nItems = n; guardarConfig(); nItemsBoton.textContent = n ? `${n} productos` : 'Según el nivel'; });
  });

  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: 'Presupuesto y lista' }),
    casilla('Calcular el presupuesto automáticamente', c.presupuestoAuto, v => { c.presupuestoAuto = v; pintarConfig(destino); },
      'Se ajusta al total de la lista con un margen según el nivel.'),
    el('label', { class: 'campo' },
      el('span', { class: 'campo__rotulo', text: 'Presupuesto fijo' }), montoBoton,
      el('span', { class: 'campo__pista', text: 'Toca para escribir el monto con el teclado. Se convierte en billetes y monedas reales dentro del juego.' })),
    el('label', { class: 'campo' },
      el('span', { class: 'campo__rotulo', text: 'Cuántos productos en la lista' }), nItemsBoton)
  ));

  /* Forma de pago */
  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: 'Forma de pago en la caja' }),
    selector(c.modoPago, [
      ['nivel', 'Según el nivel'],
      ['exacto', 'Pago exacto'],
      ['vuelto', 'Con vuelto']
    ], v => { c.modoPago = v; guardarConfig(); pintarConfig(destino); }),
    el('p', { class: 'campo__pista', text: 'Con vuelto, el estudiante paga de más y después calcula cuánto le devuelven.' })
  ));

  /* Calcular el total a mano */
  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: 'Calcular el total a mano' }),
    el('p', { class: 'panel__nota', text: 'Cuando está activo, el carro no muestra precios ni total: el estudiante suma con la calculadora y escribe el resultado para poder ir a la caja.' }),
    selector(c.exigirTotal, [
      ['siempre', 'Siempre (incluido el nivel 1)'],
      ['nivel', 'Desde el nivel 2'],
      ['nunca', 'Nunca']
    ], v => { c.exigirTotal = v; guardarConfig(); pintarConfig(destino); })
  ));

  /* Apoyos */
  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: 'Apoyos' }),
    el('p', { class: 'panel__nota', text: 'Se pueden ir quitando a medida que el estudiante gana autonomía.' }),
    casilla('Tachar solo los productos ya conseguidos', c.tacharAuto, v => { c.tacharAuto = v; },
      'Si se desactiva, el estudiante debe revisar su lista por su cuenta.'),
    casilla('Mostrar «Te queda» mientras compra', c.mostrarRestante, v => { c.mostrarRestante = v; },
      'Apagado, solo ve cuánto dinero traía: debe ir calculando si le alcanza.'),
    casilla('Mostrar la suma de la bandeja en la caja', c.mostrarSumaBandeja, v => { c.mostrarSumaBandeja = v; },
      'Apagado, debe contar de cabeza el dinero que va dejando para pagar.'),
    casilla('Mostrar los subtotales mientras compra', c.ayudaSubtotal, v => { c.ayudaSubtotal = v; }),
    casilla('Calculadora en pantalla', c.ayudaCalculadora, v => { c.ayudaCalculadora = v; }),
    casilla('Impedir que se pase del presupuesto', c.bloquearExceso, v => { c.bloquearExceso = v; },
      'Si se desactiva, puede pasarse y descubrirlo en la caja.'),
    casilla('Texto y botones más grandes', c.textoGrande, v => { c.textoGrande = v; }),
    casilla('Sonidos', c.sonido, v => { c.sonido = v; }),
    casilla('Preguntar cómo lo pensó en los desafíos', c.pedirEstrategia, v => { c.pedirEstrategia = v; },
      'Al resolver, el estudiante marca la estrategia que usó.'),
    casilla('Dejar seguir con una respuesta equivocada', c.permitirIncorrecta, v => { c.permitirIncorrecta = v; },
      'Tras dos intentos puede dejar anotada su respuesta, ver la correcta y avanzar.'),
    casilla('Letra grande para proyectar al curso', c.proyeccion, v => { c.proyeccion = v; guardarConfig(); })
  ));

  /* --- Lista elegida a mano --------------------------------------------
     Además de elegir los productos, el profesor puede fijar cuántas unidades
     o cuántos gramos se piden de cada uno, según lo que corresponda al nivel.
     Si no toca nada, la cantidad se sortea en cada partida.
     -------------------------------------------------------------------- */
  const nivel = NIVELES[c.nivel];
  const guardados = (c.listaManual || []).map(e => (typeof e === 'string' ? { id: e } : e));

  /* Al cambiar de nivel, algunos productos ya no se venden de la forma que
     ese nivel usa (el pescado solo va por kilo, por ejemplo). Se descartan
     aquí, avisando, en vez de dejar una lista que no se puede jugar. */
  const elegidos = guardados.filter(e => {
    const p = PRODUCTOS.find(x => x.id === e.id);
    return p && modosValidos(p, nivel).length > 0;
  });
  const descartados = guardados.length - elegidos.length;
  if (descartados > 0) {
    c.listaManual = elegidos.length ? elegidos.slice() : null;
    guardarConfig();
  }

  const buscar = id => elegidos.filter(e => e.id === id)[0];

  /* Resumen de lo elegido, con un ejemplo de cuánto costaría la lista */
  const nota = el('p', { class: 'panel__nota' });
  function actualizarResumen() {
    const aviso = descartados > 0
      ? `Se quitaron ${descartados} producto${descartados > 1 ? 's que no se venden' : ' que no se vende'} de esta forma en el nivel elegido. `
      : '';
    if (!elegidos.length) {
      nota.textContent = aviso + 'Si no eliges ninguno, la lista se arma sola cada vez.';
      return;
    }
    const previa = generarLista(Object.assign({}, c, { listaManual: elegidos }));
    const fijos = elegidos.filter(e => e.cantidad || e.gramos).length;
    const plural = elegidos.length > 1 ? 's' : '';
    nota.textContent = aviso + `${elegidos.length} producto${plural} elegido${plural}` +
      (fijos ? `, ${fijos} con cantidad fija` : '') +
      `. Ejemplo de total: ${pesos(totalLista(previa))}.`;
  }

  /* Guardar sin redibujar todo el panel: si se redibujara en cada toque, la
     página saltaría de posición y costaría subir la cantidad de a poco. */
  const soloGuardar = () => {
    c.listaManual = elegidos.length ? elegidos.slice() : null;
    guardarConfig();
    actualizarResumen();
  };
  const guardarElegidos = () => { soloGuardar(); pintarConfig(destino); };

  const picker = el('div', { class: 'picker' });

  /**
   * Control de cantidad o peso que se actualiza a sí mismo.
   * paso: cuánto sube o baja cada toque · tope: máximo permitido
   * campo: 'cantidad' o 'gramos' · rotular: cómo se muestra el valor
   */
  function controlCantidad(elegido, campo, paso, tope, rotular) {
    const caja = el('div', { class: 'picker__cuanto' });
    const menos = el('button', { class: 'picker__paso' }, '−');
    /* El valor es un botón: los +/- sirven para ajustes rápidos, y tocando
       el número se abre el teclado para escribir la cantidad exacta de una
       vez, con su tecla ⌫ para corregir. */
    const valor = el('button', { class: 'picker__valor picker__valor--tocable', type: 'button' });
    const mas = el('button', { class: 'picker__paso' }, '+');

    const fijar = n => {
      elegido[campo] = n > 0 ? Math.min(tope, n) : null;
      refrescar();
      soloGuardar();
    };
    const refrescar = () => {
      const n = elegido[campo] || 0;
      valor.textContent = n ? rotular(n) : 'al azar';
      menos.disabled = n <= 0;
      mas.disabled = n >= tope;
    };
    menos.addEventListener('click', () => { Audio2.boton(); fijar(Math.max(0, (elegido[campo] || 0) - paso)); });
    mas.addEventListener('click', () => { Audio2.boton(); fijar(Math.min(tope, (elegido[campo] || 0) + paso)); });
    valor.addEventListener('click', () => {
      Audio2.boton();
      abrirTecladoNum({
        titulo: '¿Cuánto?', valorInicial: elegido[campo] || 0,
        min: 0, max: tope, paso, formatear: rotular,
        permiteVacio: true, textoVacio: 'al azar', textoBorrar: '↺ Dejar en «al azar»'
      }, n => fijar(n || 0));
    });
    refrescar();

    caja.append(menos, valor, mas);
    return caja;
  }

  productosPara(nivel.modos).forEach(p => {
    const elegido = buscar(p.id);
    const item = el('div', { class: `picker__item ${elegido ? 'elegida' : ''}` });

    /* Tocar el dibujo agrega o quita el producto de la lista */
    const boton = el('button', {
      class: 'picker__tocar',
      'aria-pressed': elegido ? 'true' : 'false',
      onclick: () => {
        Audio2.boton();
        if (elegido) elegidos.splice(elegidos.indexOf(elegido), 1);
        else {
          const modos = nivel.modos.filter(m => p[m] != null);
          elegidos.push({ id: p.id, modo: modos[0] });
        }
        guardarElegidos();
      }
    });
    boton.insertAdjacentHTML('beforeend', dibujoProducto(p.id));
    boton.append(el('span', { text: p.nombre }));
    item.append(boton);

    if (elegido) {
      const modos = nivel.modos.filter(m => p[m] != null);

      /* En el súper reto un mismo producto puede venderse de varias formas */
      if (modos.length > 1) {
        const nombres = { fijo: 'Envase', unidad: 'Unidad', kilo: 'Kilo' };
        item.append(el('div', { class: 'picker__modos' },
          modos.map(m => el('button', {
            class: `picker__modo ${elegido.modo === m ? 'elegida' : ''}`,
            onclick: () => {
              elegido.modo = m;
              elegido.cantidad = null; elegido.gramos = null;
              guardarElegidos();
            }
          }, nombres[m]))
        ));
      }

      const modo = modos.indexOf(elegido.modo) >= 0 ? elegido.modo : modos[0];

      if (modo === 'unidad') {
        item.append(controlCantidad(elegido, 'cantidad', 1, 12, n => `${n} u.`));
      } else if (modo === 'kilo') {
        item.append(controlCantidad(elegido, 'gramos', pasoDe(p), p.pesoMax || 2000, peso));
      } else {
        item.append(el('div', { class: 'picker__cuanto picker__cuanto--fijo', text: p.envase || 'precio fijo' }));
      }
    }

    picker.append(item);
  });

  actualizarResumen();

  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: 'Elegir los productos a mano' }),
    nota,
    picker,
    el('button', {
      class: 'btn btn--chico btn--fantasma', style: 'margin-top:14px',
      onclick: () => { c.listaManual = null; guardarConfig(); pintarConfig(destino); }
    }, 'Volver a lista aleatoria')
  ));
}

/* --- Salida del mercado hacia la caja ------------------------------------- */
function irACaja() {
  if (!Juego.carro.length) {
    Audio2.error();
    aviso('Tu carro está vacío', 'mal');
    return;
  }
  /* Desde el nivel 2 hay que calcular el total antes de pasar a la caja */
  if (debeCalcularTotal() && !Juego.totalVerificado) {
    Audio2.error();
    aviso('Primero calcula el total de tu compra y compruébalo', 'mal');
    const casilla = $('.comprobar');
    if (casilla) {
      casilla.classList.remove('sacudir');
      void casilla.offsetWidth;
      casilla.classList.add('sacudir');
      casilla.scrollIntoView({ block: 'nearest' });
    }
    return;
  }

  const informe = revisarCarro(Juego.lista, Juego.carro);
  if (!informe.completo) {
    const seguir = confirm('Todavía hay cosas de la lista que no están bien.\n¿Quieres ir igual a la caja?');
    if (!seguir) return;
  }
  Audio2.boton();
  pintarCaja();
  mostrarPantalla('caja');
}

/* --- Arranque ------------------------------------------------------------- */
function iniciar() {
  /* Botones de navegación declarados en el HTML */
  $$('[data-ir]').forEach(boton => {
    boton.addEventListener('click', () => {
      Audio2.boton();
      const destino = boton.dataset.ir;
      if (destino === 'niveles') pintarNiveles();
      if (destino === 'config') pintarConfig();
      if (destino === 'dinero') pintarGaleria();
      mostrarPantalla(destino);
    });
  });

  $('#config-empezar').addEventListener('click', () => nuevaPartida(Juego.config.nivel));
  $('#btn-desafios').addEventListener('click', () => { Audio2.boton(); iniciarDesafios(0); });

  /* El modo aula solo aparece si el juego se abrió desde el servidor del
     profesor. Con doble clic en el archivo, ni se muestra. */
  if (hayServidor()) {
    Aula.activa = true;
    $('#btn-aula').hidden = false;
    $('#btn-aula').addEventListener('click', () => { Audio2.boton(); pintarAula(); mostrarPantalla('aula'); });
    $('#btn-imprimir').addEventListener('click', () => window.print());
    $('#btn-bajar-informe').addEventListener('click', descargarInforme);
  }
  $('#btn-proyeccion').addEventListener('click', () => {
    Juego.config.proyeccion = !Juego.config.proyeccion;
    guardarConfig();
    Audio2.boton();
  });
  $('#btn-a-caja').addEventListener('click', irACaja);
  $('#btn-volver-mercado').addEventListener('click', () => { pintarMercado(); mostrarPantalla('mercado'); });
  $('#btn-calculadora').addEventListener('click', alternarCalculadora);

  usarCatalogo(Juego.config.catalogo);
  guardarConfig();
  pintarNiveles();
}

document.addEventListener('DOMContentLoaded', iniciar);
