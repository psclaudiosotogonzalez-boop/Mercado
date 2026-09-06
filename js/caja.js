/* ============================================================================
   caja.js — Pagar en la caja
   ----------------------------------------------------------------------------
   Es el corazón del juego: acá el presupuesto deja de ser un número y se
   convierte en billetes y monedas de verdad, los mismos del cuadernillo.

   Dos formas de pago, según el nivel o lo que fije el profesor:
     · exacto → el pago tiene que dar justo;
     · vuelto → se puede pagar de más y después calcular cuánto vuelve.
   ========================================================================== */

/** Modo de pago efectivo de una configuración y nivel cualquiera. */
function modoPagoDe(config, numeroNivel) {
  const c = config.modoPago;
  return c === 'nivel' ? NIVELES[numeroNivel].pago : c;
}

/** Modo de pago efectivo: lo que diga el profesor, o lo que traiga el nivel. */
function modoPagoActual() {
  return modoPagoDe(Juego.config, Juego.config.nivel);
}

/** Cuánto hay puesto en la bandeja. */
function totalPagado() {
  return sumaBolsillo(Juego.pago);
}

/** Cuánto queda en la billetera (billetera inicial menos lo de la bandeja). */
function disponible(valor) {
  return (Juego.billetera[valor] || 0) - (Juego.pago[valor] || 0);
}

/* --- Mover dinero entre la billetera y la bandeja -------------------------- */
function ponerEnBandeja(valor) {
  if (disponible(valor) <= 0) return;
  Juego.pago[valor] = (Juego.pago[valor] || 0) + 1;
  Audio2.moneda();
  pintarCaja();
}

function sacarDeBandeja(valor) {
  if (!Juego.pago[valor]) return;
  Juego.pago[valor]--;
  if (!Juego.pago[valor]) delete Juego.pago[valor];
  Audio2.soltar();
  pintarCaja();
}

/* --- Una pieza de dinero (imagen del cuadernillo original) ---------------- */
function piezaDinero(den, cuantos, alTocar) {
  const boton = el('button', {
    class: `plata plata--${den.tipo}`,
    'aria-label': `${den.nombre}${cuantos != null ? `, ${cuantos} disponibles` : ''}`,
    disabled: cuantos === 0,
    onclick: alTocar
  });
  boton.insertAdjacentHTML('beforeend', `<img src="${den.img}" alt="${den.nombre}">`);
  if (cuantos != null && cuantos > 1) boton.append(el('span', { class: 'plata__cuantos', text: `×${cuantos}` }));
  return boton;
}

/* --- Render de la caja ---------------------------------------------------- */
function pintarCaja() {
  const cuerpo = $('#caja-cuerpo');
  cuerpo.innerHTML = '';
  if (typeof avisarProgreso === 'function') {
    avisarProgreso('pagando', { items: Juego.carro.length, presupuesto: Juego.presupuesto });
  }

  const total = totalCarro();
  const pagado = totalPagado();
  const modo = modoPagoActual();

  /* Cuenta a pagar */
  cuerpo.append(el('div', { class: 'cuenta' },
    el('div', { class: 'cuenta__rotulo', text: 'Total a pagar' }),
    el('div', { class: 'cuenta__monto', text: pesos(total) }),
    el('div', {
      class: 'cuenta__nota',
      text: modo === 'exacto'
        ? 'Tienes que pagar justo, sin que sobre ni falte.'
        : 'Puedes pagar de más y después calculamos el vuelto.'
    })
  ));

  /* Si el carro pasó lo que hay en la billetera, no hay pago posible:
     se avisa y se ofrece la salida en vez de dejar al estudiante atrapado. */
  if (total > sumaBolsillo(Juego.billetera)) {
    cuerpo.append(el('div', { class: 'panel', style: 'text-align:center' },
      el('h3', { text: 'No te alcanza la plata' }),
      el('p', { class: 'panel__nota',
        text: `Tu compra cuesta ${pesos(total)} y solo tienes ${pesos(sumaBolsillo(Juego.billetera))}. Vuelve al mercado y saca algo del carro.` }),
      el('button', { class: 'btn btn--principal btn--grande',
        onclick: () => { pintarMercado(); mostrarPantalla('mercado'); } }, '⬅ Volver al mercado')
    ));
    return;
  }

  /* Bandeja donde se deja el pago */
  const bandeja = el('div', { class: 'bandeja' });
  const piezasPuestas = Object.entries(Juego.pago).filter(([, n]) => n > 0);
  if (!piezasPuestas.length) {
    bandeja.append(el('p', { class: 'bandeja__pista', text: 'Toca tus billetes y monedas para ponerlos aquí' }));
  } else {
    piezasPuestas
      .sort((a, b) => b[0] - a[0])
      .forEach(([valor, n]) => {
        const den = DENOMINACIONES.find(d => d.valor === Number(valor));
        for (let i = 0; i < n; i++) bandeja.append(piezaDinero(den, null, () => sacarDeBandeja(den.valor)));
      });
  }
  const suficiente = modo === 'exacto' ? pagado === total : pagado >= total;
  bandeja.classList.toggle('lista-para-pagar', suficiente && pagado > 0);
  cuerpo.append(bandeja);

  /* Marcador de lo puesto.
     Apagado, el estudiante tiene que ir sumando de cabeza lo que deja en la
     bandeja: la cifra en vivo le resolvía la suma. Se mantiene una señal
     visual de que ya hay suficiente, sin decir cuánto. */
  if (Juego.config.mostrarSumaBandeja) {
    const falta = total - pagado;
    cuerpo.append(el('div', { class: `pagado ${suficiente ? 'pagado--ok' : 'pagado--falta'}` },
      el('span', { text: falta > 0 ? `Faltan ${pesos(falta)}` : 'Puesto en la bandeja' }),
      el('b', { class: 'cifra', text: pesos(pagado) })
    ));
  } else if (piezasPuestas.length) {
    cuerpo.append(el('div', { class: 'pagado pagado--mudo' },
      el('span', { text: 'Cuenta lo que pusiste y aprieta Pagar cuando estés listo' })
    ));
  }

  /* Billetera del estudiante */
  const billetera = el('div', { class: 'billetera' });
  billetera.append(el('h3', { text: '👛 Mi billetera' }));

  ['billete', 'moneda'].forEach(tipo => {
    const delTipo = DENOMINACIONES.filter(d => d.tipo === tipo && (Juego.billetera[d.valor] || 0) > 0);
    if (!delTipo.length) return;
    const fila = el('div', { class: 'billetera__fila' });
    delTipo.forEach(d => fila.append(piezaDinero(d, disponible(d.valor), () => ponerEnBandeja(d.valor))));
    billetera.append(el('div', { class: 'billetera__grupo' },
      el('div', { class: 'billetera__rotulo', text: tipo === 'billete' ? 'Billetes' : 'Monedas' }),
      fila
    ));
  });
  cuerpo.append(billetera);

  /* Acciones */
  cuerpo.append(el('div', { class: 'boleta-acciones' },
    el('button', { class: 'btn btn--principal btn--grande', onclick: intentarPagar }, '💳 Pagar'),
    el('button', { class: 'btn btn--fantasma btn--chico', onclick: () => { Juego.pago = {}; pintarCaja(); } }, 'Sacar todo de la bandeja')
  ));
}

/* --- Validación del pago -------------------------------------------------- */
function intentarPagar() {
  const total = totalCarro();
  const pagado = totalPagado();
  const modo = modoPagoActual();

  if (pagado === 0) { Audio2.error(); aviso('Todavía no pones nada en la bandeja', 'mal'); return; }

  /* Con la suma de la bandeja oculta, los avisos tampoco pueden decir la
     diferencia exacta: bastaría apretar Pagar una vez para que el juego
     resolviera la resta que el estudiante debía hacer. */
  const conCifras = Juego.config.mostrarSumaBandeja;

  if (pagado < total) {
    Audio2.error();
    Juego.erroresPago++;
    aviso(conCifras ? `Todavía faltan ${pesos(total - pagado)}`
                    : 'Todavía no alcanza. Cuenta de nuevo lo que pusiste.', 'mal');
    return;
  }
  if (modo === 'exacto' && pagado > total) {
    Audio2.error();
    Juego.erroresPago++;
    aviso(conCifras ? `Te pasaste por ${pesos(pagado - total)}. El pago tiene que ser justo.`
                    : 'Te pasaste. El pago tiene que ser justo.', 'mal');
    return;
  }

  Juego.vueltoReal = pagado - total;

  /* Si sobra plata, el estudiante calcula el vuelto antes de ver la boleta */
  if (Juego.vueltoReal > 0) {
    Audio2.boton();
    mostrarPantalla('vuelto');
    pintarVuelto();
  } else {
    Juego.vueltoRespuesta = 0;
    terminarPartida();
  }
}

/* --- Paso del vuelto ------------------------------------------------------ */
function pintarVuelto() {
  const cuerpo = $('#vuelto-cuerpo');
  cuerpo.innerHTML = '';
  let escrito = '';

  const visor = el('div', { class: 'visor', text: '$0' });
  const refrescar = () => { visor.textContent = escrito ? pesos(Number(escrito)) : '$0'; };

  /* '<' borra el último número; 'C' limpia todo. Así un error de tecleo no
     obliga a escribir el monto de nuevo. */
  const teclado = el('div', { class: 'teclado teclado--cuatro' });
  ['1','2','3','C','4','5','6','<','7','8','9','00','0','✓'].forEach(k => {
    teclado.append(el('button', {
      class: `tecla ${k === 'C' ? 'tecla--borrar' : ''} ${k === '<' ? 'tecla--atras' : ''}` +
             `${k === '✓' ? ' tecla--ok tecla--ancha' : ''}${k === '0' ? ' tecla--ancha' : ''}`,
      onclick: () => {
        Audio2.boton();
        if (k === 'C') escrito = '';
        else if (k === '<') escrito = escrito.slice(0, -1);
        else if (k === '✓') {
          Juego.vueltoRespuesta = Number(escrito || 0);
          terminarPartida();
          return;
        } else if (escrito.length < 7) escrito += k;
        refrescar();
      }
    }, k === '<' ? '⌫' : k));
  });

  cuerpo.append(el('div', { class: 'vuelto-caja' },
    el('p', { class: 'panel__nota', style: 'text-align:center',
      text: `Pagaste ${pesos(totalPagado())} y la cuenta era ${pesos(totalCarro())}.` }),
    visor, teclado
  ));
}

/* --- Boleta final --------------------------------------------------------- */
function terminarPartida() {
  const informe = revisarCarro(Juego.lista, Juego.carro);
  const total = totalCarro();
  const pagado = totalPagado();
  const vueltoOk = Juego.vueltoRespuesta === Juego.vueltoReal;
  const dentroPresupuesto = total <= Juego.presupuesto;

  /* Tres estrellas, una por cada cosa que se hizo bien */
  let estrellas = 0;
  if (informe.completo) estrellas++;
  if (dentroPresupuesto) estrellas++;
  if (vueltoOk && Juego.erroresPago === 0) estrellas++;

  const cuerpo = $('#boleta-cuerpo');
  cuerpo.innerHTML = '';

  /* --- El papel de la boleta --- */
  const boleta = el('div', { class: 'boleta' });
  boleta.append(el('div', { class: 'boleta__cabecera' },
    el('h2', { text: 'Mercado La Feria' }),
    el('p', { text: fechaLarga(new Date()) })
  ));

  if (!Juego.carro.length) {
    boleta.append(el('p', { style: 'text-align:center;color:#888', text: 'No compraste nada.' }));
  }
  Juego.carro.forEach(item => {
    let detalle = item.nombre;
    if (item.modo === 'unidad') detalle = `${item.cantidad} × ${item.nombre}`;
    if (item.modo === 'kilo')   detalle = `${peso(item.gramos)} ${item.nombre}`;
    const sobra = informe.sobrantes.some(s => s.item.id === item.id);
    boleta.append(el('div', { class: `boleta__fila ${sobra ? 'boleta__fila--mal' : ''}` },
      el('span', { text: detalle }),
      el('span', { text: pesos(item.subtotal) })
    ));
  });

  boleta.append(el('div', { class: 'boleta__fila boleta__fila--suma boleta__fila--grande' },
    el('span', { text: 'TOTAL' }), el('span', { text: pesos(total) })));
  boleta.append(el('div', { class: 'boleta__fila' },
    el('span', { text: 'Pagaste' }), el('span', { text: pesos(pagado) })));
  boleta.append(el('div', { class: 'boleta__fila' },
    el('span', { text: 'Tu vuelto' }), el('span', { text: pesos(Juego.vueltoReal) })));
  boleta.append(el('div', { class: 'boleta__fila' },
    el('span', { text: 'Presupuesto' }), el('span', { text: pesos(Juego.presupuesto) })));
  cuerpo.append(boleta);

  /* --- Veredicto y comentarios --- */
  const perfecto = estrellas === 3;
  const veredicto = el('div', { class: 'veredicto' },
    el('span', { class: 'veredicto__emoji', text: perfecto ? '🎉' : estrellas === 2 ? '🙂' : '💪' }),
    el('div', { class: 'estrellas' },
      ...[0, 1, 2].map(i => el('span', { text: i < estrellas ? '⭐' : '☆' }))),
    el('h3', { class: 'veredicto__titulo',
      text: perfecto ? '¡Compra perfecta!' : estrellas === 2 ? '¡Casi perfecto!' : 'Buen intento' })
  );

  /* Comentarios concretos: qué salió bien y qué revisar */
  const notas = [];
  informe.detalle.filter(d => d.estado !== 'ok').forEach(d => notas.push(d.mensaje));
  informe.sobrantes.forEach(s => notas.push(s.mensaje));
  if (!dentroPresupuesto) notas.push(`Te pasaste del presupuesto por ${pesos(total - Juego.presupuesto)}`);
  if (Juego.vueltoReal > 0 && !vueltoOk) {
    notas.push(`El vuelto era ${pesos(Juego.vueltoReal)} y respondiste ${pesos(Juego.vueltoRespuesta)}`);
  }
  if (Juego.erroresPago > 0 && vueltoOk) notas.push('Te costó un poco armar el pago en la caja');

  if (notas.length) {
    veredicto.append(el('ul', { class: 'veredicto__detalle' }, ...notas.map(n => el('li', { text: n }))));
  } else {
    veredicto.append(el('p', { class: 'veredicto__detalle', style: 'text-align:center',
      text: 'Llevaste todo lo de la lista, no te pasaste del presupuesto y pagaste perfecto.' }));
  }
  cuerpo.append(veredicto);

  cuerpo.append(el('div', { class: 'boleta-acciones' },
    el('button', { class: 'btn btn--principal btn--grande', onclick: () => nuevaPartida(Juego.config.nivel) }, '🔁 Otra compra'),
    el('button', { class: 'btn btn--fantasma', onclick: () => mostrarPantalla('niveles') }, 'Cambiar de reto'),
    el('button', { class: 'btn btn--fantasma btn--chico', onclick: () => mostrarPantalla('menu') }, '⬅ Volver al menú')
  ));

  if (typeof avisarProgreso === 'function') {
    avisarProgreso('listo', {
      items: Juego.carro.length, gastado: total, presupuesto: Juego.presupuesto,
      estrellas, completo: estrellas === 3
    });
  }

  mostrarPantalla('boleta');
  if (perfecto) { Audio2.exito(); confeti(); }
  else if (estrellas === 2) Audio2.exito();
}
