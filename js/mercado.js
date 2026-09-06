/* ============================================================================
   mercado.js — Pantalla de compras
   ----------------------------------------------------------------------------
   Tres zonas que se mantienen sincronizadas:
     · la lista de compras (izquierda), que se va tachando sola;
     · los anaqueles por sección (centro);
     · el carro y el medidor de presupuesto (derecha y arriba).
   ========================================================================== */

let seccionActiva = 'feria';

/**
 * Desde el nivel 2 el carro no muestra precios ni total: el estudiante tiene
 * que calcularlo con la calculadora y escribirlo antes de poder ir a la caja.
 * El profesor puede forzarlo o desactivarlo desde la configuración.
 */
function debeCalcularTotal() {
  const modo = Juego.config.exigirTotal;
  if (modo === 'siempre') return true;
  if (modo === 'nunca') return false;
  return Juego.config.nivel >= 2;
}

/* --- Cálculos sobre el carro ---------------------------------------------- */
function totalCarro() {
  return Juego.carro.reduce((t, i) => t + i.subtotal, 0);
}

function restante() {
  return Juego.presupuesto - totalCarro();
}

/** Busca una línea del carro por producto. */
function enCarro(id) {
  return Juego.carro.find(i => i.id === id);
}

/** Precio de una cantidad/peso según el modo del producto. */
function calcularSubtotal(producto, modo, cantidad, gramos) {
  if (modo === 'fijo')   return producto.fijo;
  if (modo === 'unidad') return producto.unidad * cantidad;
  return producto.kilo * gramos / 1000;
}

/**
 * Fija la cantidad (o el peso) de un producto en el carro.
 * Devuelve false si la compra no cabe en el presupuesto.
 */
function ponerEnCarro(producto, modo, { cantidad = null, gramos = null }, origen = null) {
  const linea = enCarro(producto.id);
  const nuevoSubtotal = calcularSubtotal(producto, modo, cantidad, gramos);
  const totalSinEste = totalCarro() - (linea ? linea.subtotal : 0);

  /* El presupuesto es un límite real: no se puede gastar lo que no se tiene. */
  if (Juego.config.bloquearExceso && totalSinEste + nuevoSubtotal > Juego.presupuesto) {
    Audio2.error();
    aviso('No te alcanza la plata para eso', 'mal');
    if (origen) {
      origen.classList.remove('sacudir');
      void origen.offsetWidth;             // reinicia la animación
      origen.classList.add('sacudir');
    }
    return false;
  }

  const vacio = (modo === 'unidad' && cantidad <= 0) || (modo === 'kilo' && gramos <= 0);
  if (vacio) {
    Juego.carro = Juego.carro.filter(i => i.id !== producto.id);
    Audio2.soltar();
  } else if (linea) {
    Object.assign(linea, { cantidad, gramos, subtotal: nuevoSubtotal });
    Audio2.tomar();
  } else {
    Juego.carro.push({
      id: producto.id,
      nombre: producto.nombre,
      seccion: producto.seccion,
      envase: producto.envase || null,
      modo, precio: producto[modo],
      cantidad, gramos,
      subtotal: nuevoSubtotal
    });
    Audio2.tomar();
    if (origen) volar(origen, $('#carro'), dibujoProducto(producto.id));
  }

  Juego.totalVerificado = false;   // cambió el carro: hay que recalcular
  pintarMercado();
  return true;
}

function quitarDelCarro(id) {
  Juego.carro = Juego.carro.filter(i => i.id !== id);
  Juego.totalVerificado = false;
  Audio2.soltar();
  pintarMercado();
}

/* --- Render: medidor de presupuesto --------------------------------------- */
function pintarMedidor() {
  const gastado = totalCarro();
  const proporcion = Juego.presupuesto ? gastado / Juego.presupuesto : 0;
  const medidor = $('#medidor');

  /* Con «Te queda» apagado, el estudiante solo sabe cuánto dinero traía: para
     saber si le alcanza tiene que ir sumando por su cuenta. Se ocultan también
     la barra y el semáforo, que delatan lo mismo sin números. */
  const mostrar = Juego.config.mostrarRestante !== false;
  medidor.classList.toggle('medidor--sin-resto', !mostrar);

  if (mostrar) {
    $('#medidor-rotulo').textContent = 'Te queda';
    $('#medidor-presupuesto').textContent = `de ${pesos(Juego.presupuesto)}`;
    $('#medidor-restante').textContent = pesos(Math.max(0, restante()));
    $('#medidor-lleno').style.width = `${Math.min(100, proporcion * 100)}%`;
  } else {
    $('#medidor-rotulo').textContent = 'Traes';
    $('#medidor-presupuesto').textContent = '';
    $('#medidor-restante').textContent = pesos(Juego.presupuesto);
    $('#medidor-lleno').style.width = '0%';
  }

  medidor.classList.toggle('medidor--medio', mostrar && proporcion >= 0.7 && proporcion < 0.95);
  medidor.classList.toggle('medidor--alto',  mostrar && proporcion >= 0.95);
}

/* --- Render: lista de compras --------------------------------------------
   Con el tachado automático activo, la lista se marca sola apenas el producto
   está correcto en el carro. Desactivado, cada línea se vuelve un botón y es
   el estudiante quien va marcando lo que ya consiguió: revisar su propia lista
   es parte del ejercicio.
   ------------------------------------------------------------------------- */
function pintarLista() {
  const caja = $('#lista-compras');
  caja.innerHTML = '';
  caja.append(el('h3', { text: '📋 Lista de compras' }));

  const informe = revisarCarro(Juego.lista, Juego.carro);
  const automatico = Juego.config.tacharAuto !== false;

  Juego.lista.forEach((pedido, i) => {
    const seccion = SECCIONES.find(s => s.id === pedido.seccion);
    const marcado = automatico ? informe.detalle[i].estado === 'ok' : Juego.tachadoManual.indexOf(i) >= 0;

    const enPlural = pedido.plural || pedido.nombre.toLowerCase();
    let cuanto = pedido.nombre;
    if (pedido.modo === 'unidad') cuanto = `${pedido.cantidad} ${pedido.cantidad === 1 ? pedido.nombre.toLowerCase() : enPlural}`;
    if (pedido.modo === 'kilo')   cuanto = `${peso(pedido.gramos)} de ${pedido.nombre.toLowerCase()}`;
    if (pedido.modo === 'fijo' && pedido.envase) cuanto = `${pedido.nombre} (${pedido.envase})`;

    const contenido = [
      el('span', { class: 'lista__marca' }),
      el('span', { class: 'lista__texto', text: cuanto },
        el('span', { class: 'lista__donde', text: `${seccion.emoji} ${seccion.nombre}` }))
    ];

    if (automatico) {
      caja.append(el('div', { class: `lista__item ${marcado ? 'cumplida' : ''}` }, contenido));
      return;
    }

    /* Marcable a mano: la línea entera es el área que se puede tocar */
    caja.append(el('button', {
      class: `lista__item lista__item--tocable ${marcado ? 'cumplida' : ''}`,
      'aria-pressed': marcado ? 'true' : 'false',
      onclick: () => {
        const pos = Juego.tachadoManual.indexOf(i);
        if (pos >= 0) Juego.tachadoManual.splice(pos, 1);
        else Juego.tachadoManual.push(i);
        Audio2.tomar();
        pintarLista();
      }
    }, contenido));
  });

  if (!automatico) {
    caja.append(el('p', { class: 'lista__pista', text: 'Toca cada producto cuando ya lo tengas en el carro.' }));
  }
}

/* --- Render: pestañas de secciones ---------------------------------------- */
function pintarSecciones() {
  const barra = $('#secciones');
  barra.innerHTML = '';

  const informe = revisarCarro(Juego.lista, Juego.carro);
  const pendientes = new Set(
    informe.detalle.filter(d => d.estado !== 'ok').map(d => d.pedido.seccion)
  );

  SECCIONES.forEach(seccion => {
    /* Solo se muestran las secciones que tienen productos jugables en este nivel */
    const hayProductos = PRODUCTOS.some(p => p.seccion === seccion.id && tienePrecio(p, Juego.modoProducto[p.id]));
    if (!hayProductos) return;

    barra.append(el('button', {
      class: `seccion-tab ${seccion.id === seccionActiva ? 'activa' : ''} ${pendientes.has(seccion.id) ? 'tiene-pedido' : ''}`,
      onclick: () => { seccionActiva = seccion.id; Audio2.boton(); pintarMercado(); }
    },
      el('span', { text: seccion.emoji }),
      el('span', { text: seccion.nombre }),
      el('span', { class: 'seccion-tab__punto' })
    ));
  });
}

/* --- Render: un producto en el anaquel ------------------------------------ */
function tarjetaProducto(producto) {
  const modo = Juego.modoProducto[producto.id];
  const linea = enCarro(producto.id);
  const enLista = Juego.lista.some(p => p.id === producto.id);

  const tarjeta = el('div', { class: `producto ${enLista ? 'pedido' : ''} ${linea ? 'en-carro' : ''}` });
  tarjeta.insertAdjacentHTML('beforeend', dibujoProducto(producto.id));
  tarjeta.append(el('div', { class: 'producto__nombre', text: producto.nombre },
    producto.envase && modo === 'fijo' ? el('span', { class: 'producto__envase', text: producto.envase }) : null));

  /* Cartel de precio, con la unidad de venta bien visible */
  const rotulos = { fijo: 'cada uno', unidad: 'cada uno', kilo: 'el kilo' };
  tarjeta.append(el('div', { class: 'cartel', html: `${pesos(producto[modo])}<small>${rotulos[modo]}</small>` }));

  /* Control según el modo de precio del nivel */
  if (modo === 'fijo') {
    tarjeta.append(el('button', {
      class: `btn btn--chico ${linea ? 'btn--peligro' : 'btn--verde'}`,
      onclick: () => linea
        ? quitarDelCarro(producto.id)
        : ponerEnCarro(producto, modo, { cantidad: 1 }, tarjeta)
    }, linea ? 'Quitar' : 'Agregar'));

  } else if (modo === 'unidad') {
    const n = linea ? linea.cantidad : 0;
    tarjeta.append(el('div', { class: 'control' },
      el('button', { class: 'control__btn', disabled: n === 0, onclick: () => ponerEnCarro(producto, modo, { cantidad: n - 1 }, tarjeta) }, '−'),
      el('span', { class: 'control__valor', text: `${n} u.` }),
      el('button', { class: 'control__btn', onclick: () => ponerEnCarro(producto, modo, { cantidad: n + 1 }, tarjeta) }, '+')
    ));
    if (Juego.config.ayudaSubtotal && n > 0) {
      tarjeta.append(el('div', { class: 'campo__pista cifra', text: `${n} × ${pesos(producto.unidad)} = ${pesos(producto.unidad * n)}` }));
    }

  } else {
    const g = linea ? linea.gramos : 0;
    const paso = pasoDe(producto);
    tarjeta.append(el('div', { class: 'control' },
      el('button', { class: 'control__btn', disabled: g === 0, onclick: () => ponerEnCarro(producto, modo, { gramos: g - paso }, tarjeta) }, '−'),
      el('span', { class: 'control__valor', text: g ? peso(g) : '0 g' }),
      el('button', { class: 'control__btn', onclick: () => ponerEnCarro(producto, modo, { gramos: g + paso }, tarjeta) }, '+')
    ));
    const balanza = el('div', { class: 'balanza' }, el('div', { class: 'balanza__plato' }, el('div', { class: 'balanza__aguja' })));
    balanza.querySelector('.balanza__aguja').style.width = `${Math.min(100, g / (producto.pesoMax || 2000) * 100)}%`;
    tarjeta.append(balanza);
    if (Juego.config.ayudaSubtotal && g > 0) {
      tarjeta.append(el('div', { class: 'campo__pista cifra', text: `${peso(g)} = ${pesos(producto.kilo * g / 1000)}` }));
    }
  }

  return tarjeta;
}

/* --- Render: anaquel de la sección activa --------------------------------- */
function pintarAnaquel() {
  const grilla = $('#anaquel');
  grilla.innerHTML = '';
  PRODUCTOS
    .filter(p => p.seccion === seccionActiva && tienePrecio(p, Juego.modoProducto[p.id]))
    .forEach(p => grilla.append(tarjetaProducto(p)));
}

/* --- Render: carro -------------------------------------------------------- */
function pintarCarro() {
  const caja = $('#carro');
  const ocultarPrecios = debeCalcularTotal();
  caja.innerHTML = '';
  caja.append(el('h3', {}, '🛒 Mi carro'));

  if (!Juego.carro.length) {
    caja.append(el('p', { class: 'carro__vacio', text: 'Tu carro está vacío. Busca en los anaqueles lo que dice tu lista.' }));
    return;
  }

  const items = el('div', { class: 'carro__items' });
  Juego.carro.forEach(item => {
    /* Siempre se muestra el precio POR UNIDAD y la cantidad, nunca el subtotal:
       multiplicar y sumar es justo el trabajo que le toca al estudiante.
         "$400 c/u  × 5"        ·  "$4.000 el kilo  × 750 g"
       Con los precios visibles (nivel 1) se agrega además el subtotal. */
    let unitario = pesos(item.precio);
    let cuantos = '';
    if (item.modo === 'unidad') {
      unitario = `${pesos(item.precio)} c/u`;
      cuantos = `× ${item.cantidad}`;
    } else if (item.modo === 'kilo') {
      unitario = `${pesos(item.precio)} el kilo`;
      cuantos = `× ${peso(item.gramos)}`;
    }
    const envase = item.modo === 'fijo' && item.envase ? item.envase : null;

    const fila = el('div', { class: 'carro__item' });
    fila.insertAdjacentHTML('beforeend', dibujoProducto(item.id));
    fila.append(el('div', { class: 'carro__desc' },
      el('b', { text: item.nombre }),
      el('span', { class: 'carro__cuenta' },
        el('em', { text: unitario }),
        cuantos ? el('strong', { text: cuantos }) : null,
        envase ? el('i', { text: envase }) : null)
    ));
    /* El subtotal solo cuando el juego no pide calcularlo */
    if (!ocultarPrecios) {
      fila.append(el('div', { class: 'carro__precio', text: pesos(item.subtotal) }));
    }
    fila.append(el('button', {
      class: 'carro__quitar', 'aria-label': `Quitar ${item.nombre}`,
      onclick: () => quitarDelCarro(item.id)
    }, '✕'));
    items.append(fila);
  });

  caja.append(items);

  if (!ocultarPrecios) {
    if (Juego.config.ayudaSubtotal) {
      caja.append(el('div', { class: 'carro__total' },
        el('span', { text: 'Total' }),
        el('b', { class: 'cifra', text: pesos(totalCarro()) })
      ));
    }
    return;
  }

  caja.append(bloqueComprobarTotal());
}

/* --- Comprobación del total (niveles 2 en adelante) ----------------------- */
/* El estudiante suma con la calculadora y escribe el resultado. Hasta que no
   acierte, la caja permanece cerrada. El error no castiga: puede reintentar
   las veces que quiera y la pista le dice si se pasó o se quedó corto. */
function bloqueComprobarTotal() {
  const caja = el('div', { class: 'comprobar' });

  if (Juego.totalVerificado) {
    caja.classList.add('comprobar--ok');
    caja.append(
      el('div', { class: 'comprobar__rotulo', text: '✅ Total correcto' }),
      el('div', { class: 'comprobar__monto cifra', text: pesos(totalCarro()) })
    );
    return caja;
  }

  const entrada = el('input', {
    class: 'entrada comprobar__entrada', type: 'number', inputmode: 'numeric',
    min: 0, step: 10, placeholder: '$ ?', 'aria-label': 'Escribe el total de tu compra'
  });
  if (Juego.totalEscrito) entrada.value = Juego.totalEscrito;
  entrada.addEventListener('input', () => { Juego.totalEscrito = entrada.value; });
  entrada.addEventListener('keydown', ev => { if (ev.key === 'Enter') comprobar(); });

  function comprobar() {
    const escrito = Number(entrada.value);
    const real = totalCarro();
    if (!entrada.value) { Audio2.error(); aviso('Escribe cuánto te dio la suma', 'mal'); return; }

    if (escrito === real) {
      Juego.totalVerificado = true;
      Audio2.exito();
      aviso('¡Muy bien! Ese es el total. Ya puedes ir a pagar.', 'bien');
      pintarMercado();
      return;
    }
    Audio2.error();
    Juego.intentosTotal = (Juego.intentosTotal || 0) + 1;
    caja.classList.remove('sacudir');
    void caja.offsetWidth;
    caja.classList.add('sacudir');
    aviso(escrito > real ? 'Te pasaste. Vuelve a sumar.' : 'Te quedaste corto. Vuelve a sumar.', 'mal');
  }

  caja.append(
    el('div', { class: 'comprobar__rotulo', text: '🧮 ¿Cuánto es el total?' }),
    el('p', { class: 'comprobar__pista', text: 'Suma los precios con la calculadora y escribe el resultado.' }),
    entrada,
    el('button', { class: 'btn btn--verde comprobar__btn', onclick: comprobar }, 'Comprobar')
  );
  return caja;
}

/* --- Render completo ------------------------------------------------------ */
function pintarMercado() {
  pintarMedidor();
  pintarLista();
  pintarSecciones();
  pintarAnaquel();
  pintarCarro();

  /* En modo aula, el profesor ve en qué va cada tablet */
  if (typeof avisarProgreso === 'function') {
    avisarProgreso(
      debeCalcularTotal() && Juego.carro.length && !Juego.totalVerificado ? 'calculando' : 'comprando',
      { items: Juego.carro.length, presupuesto: Juego.presupuesto }
    );
  }
}

/* --- Calculadora de apoyo -------------------------------------------------
   Vive en la columna izquierda, debajo de la lista, para no tapar nunca el
   carro. Desde el nivel 2 es la herramienta principal: con ella se suma la
   compra antes de poder ir a pagar.
   ------------------------------------------------------------------------- */

/** Evalúa una expresión de sumas, restas, multiplicaciones y divisiones. */
function calcular(expresion) {
  const piezas = String(expresion).match(/(\d+|[+\-*/])/g);
  if (!piezas || !piezas.length) return null;

  /* Primero multiplicaciones y divisiones, que tienen prioridad */
  const nivel1 = [];
  for (let i = 0; i < piezas.length; i++) {
    if (piezas[i] === '*' || piezas[i] === '/') {
      const signo = piezas[i];
      const der = Number(piezas[++i]);
      if (isNaN(der)) return null;
      if (signo === '/' && der === 0) return null;      // no se puede dividir por cero
      const izq = nivel1[nivel1.length - 1];
      nivel1[nivel1.length - 1] = signo === '*' ? izq * der : izq / der;
    } else if (piezas[i] === '+' || piezas[i] === '-') {
      nivel1.push(piezas[i]);
    } else {
      nivel1.push(Number(piezas[i]));
    }
  }
  /* Después sumas y restas, de izquierda a derecha */
  let total = Number(nivel1[0]);
  if (isNaN(total)) return null;
  for (let i = 1; i < nivel1.length; i += 2) {
    const n = Number(nivel1[i + 1]);
    if (isNaN(n)) return null;
    total = nivel1[i] === '+' ? total + n : total - n;
  }
  return Number.isFinite(total) ? total : null;
}

/** Muestra la expresión con los símbolos que el estudiante conoce. */
function expresionVisible(expresion) {
  return expresion
    .replace(/\*/g, ' × ').replace(/\//g, ' ÷ ')
    .replace(/\+/g, ' + ').replace(/-/g, ' − ') || '0';
}

/** Formatea el resultado. Una división puede no dar exacta, y ahí se muestran
    los decimales con coma, como se escriben en Chile. */
function resultadoVisible(n) {
  if (n === null || n === undefined) return '';
  if (Number.isInteger(n)) return pesos(n);
  const redondeado = Math.round(n * 100) / 100;
  const [entero, dec] = String(redondeado).split('.');
  return '$' + miles(Number(entero)) + ',' + (dec || '0');
}

function alternarCalculadora() {
  Juego.calculadoraAbierta = !Juego.calculadoraAbierta;
  Audio2.boton();
  pintarCalculadora();
}

function pintarCalculadora() {
  const caja = $('#calculadora-caja');
  if (!caja) return;
  caja.innerHTML = '';
  if (!Juego.calculadoraAbierta) return;

  const visor = el('div', { class: 'calc__visor' });
  const cuenta = el('div', { class: 'calc__cuenta', text: expresionVisible(Juego.calcExpresion || '') });
  const resultado = el('div', { class: 'calc__resultado', text: resultadoVisible(Juego.calcResultado) });
  visor.append(cuenta, resultado);

  const teclado = el('div', { class: 'calc__teclado' });
  const teclas = [
    ['7', ''], ['8', ''], ['9', ''], ['/', 'op'],
    ['4', ''], ['5', ''], ['6', ''], ['*', 'op'],
    ['1', ''], ['2', ''], ['3', ''], ['-', 'op'],
    ['C', 'borrar'], ['0', ''], ['00', ''], ['+', 'op'],
    ['<', 'atras'], ['=', 'igual']
  ];
  /* '<' borra solo el último número escrito; 'C' limpia toda la operación */
  const rotulos = { '*': '×', '/': '÷', '-': '−', '<': '⌫' };

  teclas.forEach(([valor, tipo]) => {
    teclado.append(el('button', {
      class: `tecla tecla--calc ${tipo ? 'tecla--' + tipo : ''}`,
      onclick: () => {
        Audio2.boton();
        if (valor === 'C') {
          Juego.calcExpresion = '';
          Juego.calcResultado = null;
        } else if (valor === '<') {
          /* Un error al final no debería obligar a rehacer toda la cuenta */
          Juego.calcExpresion = (Juego.calcExpresion || '').slice(0, -1);
          Juego.calcResultado = null;
        } else if (valor === '=') {
          Juego.calcResultado = calcular(Juego.calcExpresion || '');
          if (Juego.calcResultado === null) aviso('Revisa la operación', 'mal');
        } else {
          const exp = Juego.calcExpresion || '';
          const esOperador = '+-*/'.indexOf(valor) >= 0;
          /* No se permiten dos operadores seguidos ni empezar con uno */
          if (esOperador && (!exp || '+-*/'.indexOf(exp.slice(-1)) >= 0)) return;
          if (exp.length > 24) return;
          Juego.calcExpresion = exp + valor;
          Juego.calcResultado = null;
        }
        pintarCalculadora();
      }
    }, rotulos[valor] || valor));
  });

  caja.append(el('div', { class: 'calc' },
    el('div', { class: 'calc__cabecera' },
      el('span', { text: '🧮 Calculadora' }),
      el('button', { class: 'calc__cerrar', 'aria-label': 'Cerrar calculadora', onclick: alternarCalculadora }, '✕')
    ),
    visor, teclado
  ));
}
