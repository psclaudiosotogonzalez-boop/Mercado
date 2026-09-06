/* ============================================================================
   feria.js — Feria en parejas: uno vende, otro compra
   ----------------------------------------------------------------------------
   Dos (o tres) tablets emparejadas trabajan el mismo puesto. El comprador pide,
   el feriante cobra, el comprador paga, el feriante da el vuelto y el comprador
   lo revisa. Cada paso lo hace uno y lo comprueba el otro.

   La gracia no es acertar: es que cuando los dos números no calzan, tienen que
   ponerse de acuerdo hablando. Ahí aparece la justificación que pide la
   Experiencia 3, sin que nadie tenga que escribirla.

   Los roles rotan en cada ronda, así que todos venden y todos compran.
   ========================================================================== */

const Feria = {
  grupo: null,      // el puesto que le tocó a esta tablet
  escrito: '',      // lo que va escribiendo en el teclado
  pedido: [],       // lo que el comprador va pidiendo
  billetes: {},     // lo que el comprador pone sobre el mostrador
  disputando: false,// ¿el comprador está escribiendo su corrección?
  ultimaEtapa: null
};

/* --- Quién es quién ------------------------------------------------------- */

/** En cada ronda los roles corren un lugar, para que todos pasen por los dos. */
function rolEn(grupo, nombre) {
  const n = grupo.miembros.length;
  const i = grupo.miembros.indexOf(nombre);
  if (i < 0) return 'fuera';
  const feriante = grupo.ronda % n;
  const comprador = (grupo.ronda + 1) % n;
  if (i === feriante) return 'feriante';
  if (i === comprador) return 'comprador';
  return 'observador';
}

function quienEs(grupo, rol) {
  const n = grupo.miembros.length;
  if (rol === 'feriante') return grupo.miembros[grupo.ronda % n];
  return grupo.miembros[(grupo.ronda + 1) % n];
}

/** El puesto donde está esta tablet, si el profesor la puso en alguno. */
function miPuesto() {
  const grupos = Aula.grupos || {};
  for (const id in grupos) {
    if (grupos[id].miembros.indexOf(Aula.nombre) >= 0) return grupos[id];
  }
  return null;
}

/* --- Cuentas -------------------------------------------------------------- */

/** Lo que cuesta un renglón del pedido, escrito como "leche:2". */
function precioRenglon(texto) {
  const partes = String(texto).split(':');
  const p = PRODUCTOS_BOTALCURA.filter(x => x.id === partes[0])[0];
  if (!p) return { nombre: '?', cantidad: 0, precio: 0, total: 0 };
  const cantidad = Number(partes[1]) || 0;
  const modo = p.unidad != null ? 'unidad' : (p.fijo != null ? 'fijo' : 'kilo');
  const precio = p[modo];
  /* En la feria el peso va en kilos enteros ("6 kilos de maíz"), así que la
     cuenta es la misma para los tres modos: precio por cantidad. */
  return {
    id: p.id, nombre: p.nombre, cantidad, precio, modo,
    total: precio * cantidad
  };
}

function totalPedido(pedido) {
  return (pedido || []).reduce((s, x) => s + precioRenglon(x).total, 0);
}

/* --- Enviar cada paso ----------------------------------------------------- */
function pasoFeria(accion, valor, extra = {}) {
  const g = Feria.grupo;
  if (!g) return;
  return pedir('feria', Object.assign({
    c: Aula.codigo, n: Aula.nombre, g: g.id, a: accion, v: valor
  }, extra));
}

/* --- Dibujo --------------------------------------------------------------- */
function pintarFeria() {
  const g = miPuesto();
  if (!g) return;
  Feria.grupo = g;

  /* Al cambiar de etapa se limpia lo que se estaba escribiendo */
  const marca = g.id + '|' + g.ronda + '|' + g.etapa;
  if (marca !== Feria.ultimaEtapa) {
    Feria.ultimaEtapa = marca;
    Feria.escrito = '';
    Feria.disputando = false;
    if (g.etapa === 'pedido') { Feria.pedido = []; Feria.billetes = {}; }
  }

  const rol = rolEn(g, Aula.nombre);
  const cuerpo = $('#feria-cuerpo');
  cuerpo.innerHTML = '';

  /* Quién es quién en esta ronda */
  cuerpo.append(el('div', { class: 'roles' },
    el('div', { class: `rol ${rol === 'feriante' ? 'rol--yo' : ''}` },
      el('span', { class: 'rol__emoji', text: '🧺' }),
      el('b', { text: quienEs(g, 'feriante') }),
      el('span', { class: 'rol__texto', text: 'atiende el puesto' })),
    el('div', { class: `rol ${rol === 'comprador' ? 'rol--yo' : ''}` },
      el('span', { class: 'rol__emoji', text: '🛍️' }),
      el('b', { text: quienEs(g, 'comprador') }),
      el('span', { class: 'rol__texto', text: 'hace la compra' }))
  ));

  if (rol === 'observador') {
    cuerpo.append(el('div', { class: 'panel', style: 'text-align:center' },
      el('h3', { text: 'Te toca mirar y ayudar' }),
      el('p', { class: 'panel__nota', text: 'Sigue la compra de tus compañeros. En la próxima ronda juegas tú.' })));
  }

  const pasos = { pedido: pasoPedido, cobro: pasoCobro, pago: pasoPago,
                  disputa: pasoDisputa, vuelto: pasoVuelto, revision: pasoRevision, cierre: pasoCierre };
  (pasos[g.etapa] || pasoPedido)(cuerpo, g, rol);
}

/** Aviso de que ahora le toca al otro. */
function esperando(cuerpo, quien, que) {
  cuerpo.append(el('div', { class: 'espera' },
    el('span', { class: 'espera__emoji', text: '⏳' }),
    el('b', { text: `Le toca a ${quien}` }),
    el('p', { text: que })));
}

/* 1. El comprador arma su pedido ------------------------------------------ */
function pasoPedido(cuerpo, g, rol) {
  if (rol !== 'comprador') {
    esperando(cuerpo, quienEs(g, 'comprador'), 'Está eligiendo qué va a comprar.');
    return;
  }

  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: '¿Qué vas a comprar?' }),
    el('p', { class: 'panel__nota', text: 'Elige lo que quieras. Después pídeselo en voz alta a quien atiende.' })));

  const grilla = el('div', { class: 'feria' });
  PRODUCTOS_BOTALCURA.forEach(p => {
    const modo = p.unidad != null ? 'unidad' : (p.fijo != null ? 'fijo' : 'kilo');
    const renglon = Feria.pedido.filter(x => x.split(':')[0] === p.id)[0];
    const cuantos = renglon ? Number(renglon.split(':')[1]) : 0;

    const cambiar = d => {
      const nuevo = Math.max(0, cuantos + d);
      Feria.pedido = Feria.pedido.filter(x => x.split(':')[0] !== p.id);
      if (nuevo > 0) Feria.pedido.push(p.id + ':' + nuevo);
      Audio2.tomar();
      pintarFeria();
    };

    const ficha = el('div', { class: `feria__item ${cuantos ? 'en-carro' : ''}` });
    ficha.insertAdjacentHTML('beforeend', dibujoProducto(p.id));
    ficha.append(
      el('b', { text: p.nombre }),
      el('span', { class: 'feria__precio', text: pesos(p[modo]) + (modo === 'kilo' ? ' el kilo' : '') }),
      el('div', { class: 'control' },
        el('span', { class: 'control__valor', text: cuantos ? `${cuantos} ${modo === 'kilo' ? 'kg' : 'u.'}` : '0' }),
        el('button', { class: 'control__btn', disabled: !cuantos, onclick: () => cambiar(-1) }, '−'),
        el('button', { class: 'control__btn', onclick: () => cambiar(1) }, '+'))
    );
    grilla.append(ficha);
  });
  cuerpo.append(grilla);

  cuerpo.append(el('button', {
    class: 'btn btn--principal btn--grande', style: 'width:100%;margin-top:16px',
    disabled: !Feria.pedido.length,
    onclick: () => { Audio2.boton(); pasoFeria('pedido', Feria.pedido.join(',')); }
  }, 'Ya pedí lo mío ➡'));
}

/* 2. El feriante cobra ----------------------------------------------------- */
function pasoCobro(cuerpo, g, rol) {
  cuerpo.append(boletaPedido(g, 'El pedido', rol === 'feriante'));

  if (rol !== 'feriante') {
    esperando(cuerpo, quienEs(g, 'feriante'), 'Está calculando cuánto tiene que cobrarte.');
    return;
  }

  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: '¿Cuánto hay que cobrar?' }),
    el('p', { class: 'panel__nota', text: 'Suma lo que te pidieron. Si te equivocas, tu compañero se va a dar cuenta.' }),
    tecladoFeria(v => pasoFeria('cobro', v))));
}

/* 3. El comprador paga ----------------------------------------------------- */
function pasoPago(cuerpo, g, rol) {
  cuerpo.append(boletaPedido(g, 'El pedido', false));
  cuerpo.append(el('div', { class: 'cobro-feria' },
    el('span', { text: `${quienEs(g, 'feriante')} te cobra` }),
    el('b', { text: pesos(g.cobro) })));

  if (rol !== 'comprador') {
    esperando(cuerpo, quienEs(g, 'comprador'), 'Está juntando el dinero para pagar.');
    return;
  }

  /* El comprador decidió que el cobro está mal: en vez de pagarlo, escribe
     cuánto cree que es lo correcto y se lo manda a quien cobró. */
  if (Feria.disputando) {
    cuerpo.append(el('div', { class: 'panel' },
      el('h3', { text: '¿Cuánto crees que es lo correcto?' }),
      el('p', { class: 'panel__nota', text: 'Súmalo tú mismo y escríbelo. Se lo vamos a mostrar a quien te cobró.' }),
      tecladoFeria(v => {
        Feria.disputando = false;
        pasoFeria('disputa', v);
      }),
      el('button', {
        class: 'btn btn--fantasma btn--chico', style: 'width:100%;margin-top:10px',
        onclick: () => { Feria.disputando = false; Audio2.boton(); pintarFeria(); }
      }, '⬅ Volver a pagar lo que cobró')
    ));
    return;
  }

  const puesto = totalBilletes(Feria.billetes);
  const alcanza = puesto >= g.cobro;
  const dineroTotal = totalBilletera(g.billetera);
  const cobroImposible = g.cobro > dineroTotal;   // ni juntando todo alcanzaría

  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: 'Paga con tus billetes y monedas' }),
    el('p', { class: 'panel__nota', text: 'Puedes pagar justo o de más, y que te den vuelto.' }),
    el('div', { class: 'mostrador' },
      el('span', { text: 'Pusiste' }), el('b', { text: pesos(puesto) })),
    cajonBilletes(g)));

  cuerpo.append(el('button', {
    class: 'btn btn--principal btn--grande', style: 'width:100%;margin-top:16px',
    disabled: !alcanza,
    onclick: () => { Audio2.boton(); pasoFeria('pago', puesto); }
  }, alcanza ? 'Pagar ➡' : `Te falta ${pesos(g.cobro - puesto)}`));

  /* Si te cobraron mal, no tienes por qué pagarlo igual ni quedar atrapado
     sin dinero suficiente: puedes decirle a quien cobró cuál es el monto
     correcto, para que lo revise. */
  cuerpo.append(el('button', {
    class: `btn btn--chico ${cobroImposible ? 'btn--peligro' : 'btn--fantasma'}`,
    style: 'width:100%;margin-top:10px',
    onclick: () => { Feria.disputando = true; Feria.escrito = ''; Feria.billetes = {}; Audio2.boton(); pintarFeria(); }
  }, '🤔 Cobro incorrecto'));

  if (cobroImposible) {
    cuerpo.append(el('p', { class: 'panel__nota', style: 'text-align:center;color:var(--frutilla-osc)',
      text: `Ni juntando todo tu dinero (${pesos(dineroTotal)}) te alcanza. El cobro debe estar mal — avísale.` }));
  }
}

/* 3b. Quien cobró revisa la corrección que le mandaron ---------------------- */
function pasoDisputa(cuerpo, g, rol) {
  cuerpo.append(boletaPedido(g, 'El pedido', true));

  if (rol === 'comprador') {
    esperando(cuerpo, quienEs(g, 'feriante'), 'Le mostramos tu corrección. Está revisando si tienes razón.');
    return;
  }
  if (rol === 'observador') {
    esperando(cuerpo, quienEs(g, 'feriante'), 'Está revisando la corrección del comprador.');
    return;
  }

  /* rol === 'feriante' */
  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: `${quienEs(g, 'comprador')} dice que el cobro está mal` }),
    el('div', { class: 'cobro-feria' },
      el('span', { text: 'Tú cobraste' }), el('b', { text: pesos(g.cobro) }),
      el('span', { text: 'Dice que es' }), el('b', { text: pesos(g.propuesta) })),
    el('p', { class: 'panel__nota', text: 'Revisa el pedido de arriba y decide.' }),
    el('div', { class: 'elecciones' },
      el('button', {
        class: 'btn btn--verde btn--grande eleccion',
        onclick: () => { Audio2.boton(); pasoFeria('aceptar_propuesta', ''); }
      }, `✅ Tiene razón, cobro ${pesos(g.propuesta)}`),
      el('button', {
        class: 'btn btn--grande eleccion',
        onclick: () => { Audio2.boton(); pasoFeria('rechazar_propuesta', ''); }
      }, '🔁 Prefiero calcularlo de nuevo yo'))
  ));
}

/* 4. El feriante da el vuelto ---------------------------------------------- */
function pasoVuelto(cuerpo, g, rol) {
  cuerpo.append(el('div', { class: 'cobro-feria' },
    el('span', { text: 'Cobraste' }), el('b', { text: pesos(g.cobro) }),
    el('span', { text: 'Te pagaron' }), el('b', { text: pesos(g.pago) })));

  if (rol !== 'feriante') {
    esperando(cuerpo, quienEs(g, 'feriante'), 'Está calculando tu vuelto.');
    return;
  }

  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: '¿Cuánto vuelto tienes que dar?' }),
    el('p', { class: 'panel__nota', text: 'Si el pago fue justo, el vuelto es cero.' }),
    tecladoFeria(v => pasoFeria('vuelto', v))));
}

/* 5. El comprador revisa --------------------------------------------------- */
function pasoRevision(cuerpo, g, rol) {
  cuerpo.append(el('div', { class: 'cobro-feria' },
    el('span', { text: 'Te cobraron' }), el('b', { text: pesos(g.cobro) }),
    el('span', { text: 'Pagaste' }), el('b', { text: pesos(g.pago) }),
    el('span', { text: 'Te dieron de vuelto' }), el('b', { text: pesos(g.vuelto) })));

  if (rol !== 'comprador') {
    esperando(cuerpo, quienEs(g, 'comprador'), 'Está revisando si el vuelto está bien.');
    return;
  }

  const cobroReal = totalPedido(g.pedido);
  const vueltoReal = g.pago - cobroReal;

  const cerrar = revision => {
    Audio2.boton();
    pasoFeria('revision', revision, {
      cb: g.cobro === cobroReal ? '1' : '0',
      vb: g.vuelto === g.pago - g.cobro ? '1' : '0',
      rb: ((revision === 'bien') === (g.cobro === cobroReal && g.vuelto === vueltoReal)) ? '1' : '0'
    });
  };

  cuerpo.append(el('div', { class: 'panel' },
    el('h3', { text: '¿Está bien la cuenta?' }),
    el('p', { class: 'panel__nota', text: 'Revisa lo que te cobraron y lo que te devolvieron.' }),
    el('div', { class: 'elecciones' },
      el('button', { class: 'btn btn--verde btn--grande eleccion', onclick: () => cerrar('bien') },
        '👍 Está todo bien'),
      el('button', { class: 'btn btn--grande eleccion', onclick: () => cerrar('mal') },
        '🤔 Creo que hay un error'))));
}

/* 6. Los dos ven cómo les fue ---------------------------------------------- */
function pasoCierre(cuerpo, g, rol) {
  const cobroReal = totalPedido(g.pedido);
  const vueltoReal = g.pago - cobroReal;
  const cobroBien = g.cobro === cobroReal;
  const vueltoBien = g.vuelto === g.pago - g.cobro;
  const habiaError = !cobroBien || !vueltoBien;
  const detecto = (g.revision === 'mal') === habiaError;

  cuerpo.append(boletaPedido(g, 'Lo que se compró', true));

  /* Si el cobro estuvo mal, el vuelto puede estar bien restado igual. Vale la
     pena decirlo: el error viene de antes, no de la resta. */
  const arrastre = !cobroBien && vueltoBien;

  const filas = el('div', { class: 'calces' },
    filaCuenta('Se cobró', pesos(g.cobro), pesos(cobroReal), cobroBien),
    arrastre
      ? filaCuenta('Se dio de vuelto', pesos(g.vuelto), pesos(vueltoReal), false,
                   'bien restado, pero sobre el cobro equivocado')
      : filaCuenta('Se dio de vuelto', pesos(g.vuelto), pesos(vueltoReal), vueltoBien && g.vuelto === vueltoReal)
  );

  cuerpo.append(el('div', { class: `logro ${habiaError ? 'logro--revisar' : ''}` },
    el('span', { class: 'logro__emoji', text: habiaError ? '🤝' : '🎉' }),
    el('h3', { text: habiaError ? 'Hay algo que conversar' : '¡La cuenta calzó perfecto!' }),
    filas,
    el('p', { class: 'logro__animo', text: habiaError
      ? ((!cobroBien && vueltoBien ? 'La resta del vuelto estuvo bien; lo que falló fue el cobro. ' : '') +
         (detecto
          ? `${quienEs(g, 'comprador')} se dio cuenta. Revísenlo juntos: ¿dónde se torció la cuenta?`
          : 'El error pasó sin que nadie lo notara. Rehagan la cuenta juntos, paso a paso.'))
      : (g.revision === 'bien'
          ? 'Los dos llegaron al mismo número. Cuéntenle al curso cómo lo calcularon.'
          : 'La cuenta estaba bien. Revisa de nuevo cómo la hiciste.') })));

  if (rol !== 'observador') {
    cuerpo.append(el('button', {
      class: 'btn btn--principal btn--grande', style: 'width:100%',
      onclick: () => { Audio2.boton(); pasoFeria('siguiente', ''); }
    }, '🔄 Cambiar de rol y seguir'));
  }
}

function filaCuenta(rotulo, dijo, era, bien, nota) {
  const fila = el('div', { class: `calce ${bien ? 'calce--bien' : (nota ? 'calce--arrastre' : 'calce--mal')}` },
    el('span', { class: 'calce__rotulo', text: rotulo }),
    el('b', { text: dijo }));
  if (!bien) fila.append(el('span', { class: 'calce__era', text: nota || `era ${era}` }));
  return fila;
}

/* --- Piezas compartidas --------------------------------------------------- */
function boletaPedido(g, titulo, conPrecios) {
  const caja = el('div', { class: 'panel' }, el('h3', { text: titulo }));
  const lista = el('div', { class: 'pedido' });
  (g.pedido || []).forEach(x => {
    const r = precioRenglon(x);
    const fila = el('div', { class: 'pedido__fila' },
      el('span', { text: `${r.cantidad} ${r.modo === 'kilo' ? 'kg de ' : ''}${r.nombre.toLowerCase()}` }));
    if (conPrecios) fila.append(el('b', { text: `${pesos(r.precio)} c/u` }));
    lista.append(fila);
  });
  caja.append(lista);
  return caja;
}

function tecladoFeria(alConfirmar) {
  const visor = el('div', { class: 'visor' });
  const refrescar = () => { visor.textContent = Feria.escrito ? pesos(Number(Feria.escrito)) : '$0'; };
  refrescar();

  const teclado = el('div', { class: 'teclado teclado--cuatro' });
  ['1','2','3','C','4','5','6','<','7','8','9','00','0','✓'].forEach(k => {
    teclado.append(el('button', {
      class: `tecla ${k === 'C' ? 'tecla--borrar' : ''}${k === '<' ? ' tecla--atras' : ''}` +
             `${k === '✓' ? ' tecla--ok tecla--ancha' : ''}${k === '0' ? ' tecla--ancha' : ''}`,
      onclick: () => {
        Audio2.boton();
        if (k === 'C') Feria.escrito = '';
        else if (k === '<') Feria.escrito = Feria.escrito.slice(0, -1);
        else if (k === '✓') { alConfirmar(Number(Feria.escrito || 0)); return; }
        else if (Feria.escrito.length < 7) Feria.escrito += k;
        refrescar();
      }
    }, k === '<' ? '⌫' : k));
  });
  return el('div', { style: 'text-align:center' }, visor, teclado);
}

function totalBilletes(billetes) {
  return Object.keys(billetes).reduce((s, v) => s + Number(v) * billetes[v], 0);
}

/** Cuánto dinero tiene en total el puesto, junto o suelto. */
function totalBilletera(billetera) {
  return Object.entries(billetera || {}).reduce((s, [v, n]) => s + Number(v) * n, 0);
}

/**
 * El cajón de dinero del comprador.
 * Reutiliza las mismas piezas de la caja, que son las imágenes del cuadernillo
 * original: el dinero debe verse siempre igual en todo el juego.
 */
function cajonBilletes(g) {
  const caja = el('div', { class: 'mostrador-billetes' });
  DENOMINACIONES.forEach(den => {
    const tengo = (g.billetera && (g.billetera[den.valor] || g.billetera[String(den.valor)])) || 0;
    if (!tengo) return;
    const puestos = Feria.billetes[den.valor] || 0;
    const quedan = tengo - puestos;

    const pieza = piezaDinero(den, quedan, () => {
      if (quedan <= 0) return;
      Feria.billetes[den.valor] = puestos + 1;
      Audio2.moneda();
      pintarFeria();
    });
    if (puestos) pieza.classList.add('plata--puesta');
    caja.append(pieza);
  });

  const devolver = el('button', {
    class: 'btn btn--fantasma btn--chico', style: 'margin-top:12px',
    disabled: !Object.keys(Feria.billetes).length,
    onclick: () => { Feria.billetes = {}; Audio2.soltar(); pintarFeria(); }
  }, '↩ Recoger lo que puse');

  return el('div', {}, caja, devolver);
}
