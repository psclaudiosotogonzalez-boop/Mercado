/* ============================================================================
   lista.js — Lista de compras, presupuesto y billetera
   ----------------------------------------------------------------------------
   Un "pedido" es cada línea de la lista de compras:
     { id, nombre, seccion, modo, precio, cantidad, gramos, subtotal }
       modo 'fijo'   → cantidad 1, subtotal = precio
       modo 'unidad' → subtotal = precio × cantidad
       modo 'kilo'   → subtotal = precio × (gramos / 1000)
   ========================================================================== */

/** Productos que admiten alguno de los modos pedidos. */
function productosPara(modos) {
  return PRODUCTOS.filter(p => modos.some(m => p[m] != null));
}

/** ¿Este producto se puede vender de esta forma? */
function tienePrecio(producto, modo) {
  return !!producto && producto[modo] != null;
}

/** Modos válidos de un producto en un nivel dado. */
function modosValidos(producto, nivel) {
  return nivel.modos.filter(m => tienePrecio(producto, m));
}

/** Arma una línea de la lista para un producto y un modo concretos.
    Devuelve null si el producto no tiene precio en ese modo: sin esta guarda
    un pescado (que solo se vende por kilo) puesto en un nivel de precio fijo
    generaba un precio inexistente y todo el presupuesto quedaba en NaN. */
function crearPedido(producto, modo, nivel) {
  if (!tienePrecio(producto, modo)) return null;
  const base = {
    id: producto.id,
    nombre: producto.nombre,
    seccion: producto.seccion,
    envase: producto.envase || null,
    plural: producto.plural || null,
    modo,
    precio: producto[modo]
  };

  if (modo === 'fijo') {
    return Object.assign({}, base, { cantidad: 1, gramos: null, subtotal: producto.fijo });
  }
  if (modo === 'unidad') {
    const rango = nivel.cantidad || [2, 5];
    const cantidad = entre(rango[0], rango[1]);
    return Object.assign({}, base, { cantidad: cantidad, gramos: null, subtotal: producto.unidad * cantidad });
  }
  /* Pesos que este producto admite: ni más del tope, ni fracciones que su
     balanza no pueda marcar (el maíz de la feria va por kilos enteros). */
  const paso = pasoDe(producto);
  const tope = producto.pesoMax || 2000;
  let posibles = (nivel.pesos || [250, 500, 1000]).filter(g => g <= tope && g % paso === 0);
  if (!posibles.length) {
    /* Ninguno de los pesos del nivel sirve: se arman a partir del paso */
    posibles = [];
    for (let g = paso; g <= tope; g += paso) posibles.push(g);
  }
  const gramos = alAzar(posibles.length ? posibles : [paso]);
  return Object.assign({}, base, { cantidad: null, gramos: gramos, subtotal: producto.kilo * gramos / 1000 });
}

/**
 * Genera la lista de compras según la configuración.
 * Reparte los productos entre secciones distintas para que el niño
 * tenga que recorrer el mercado y no encuentre todo en un solo anaquel.
 */
function generarLista(config) {
  const nivel = NIVELES[config.nivel];
  const cuantos = config.nItems || entre(nivel.items[0], nivel.items[1]);

  /* Lista fijada a mano por el profesor.
     Cada entrada puede ser solo el id (se sortea la cantidad) o un objeto
     { id, modo, cantidad, gramos } con lo que el profesor dejó elegido. */
  if (config.listaManual && config.listaManual.length) {
    const manual = config.listaManual.map(entrada => {
      const elegido = typeof entrada === 'string' ? { id: entrada } : entrada;
      const p = PRODUCTOS.find(x => x.id === elegido.id);
      if (!p) return null;

      /* Si el producto no se vende de ninguna forma válida en este nivel
         (por ejemplo, una lista guardada en el nivel del kilo y jugada en el
         de precio fijo), simplemente se omite. */
      const posibles = modosValidos(p, nivel);
      if (!posibles.length) return null;
      const modo = posibles.indexOf(elegido.modo) >= 0 ? elegido.modo : posibles[0];

      const pedido = crearPedido(p, modo, nivel);
      if (!pedido) return null;

      /* Se respeta lo que el profesor fijó; si no fijó nada, queda lo sorteado */
      if (modo === 'unidad' && elegido.cantidad > 0) {
        pedido.cantidad = elegido.cantidad;
        pedido.subtotal = p.unidad * elegido.cantidad;
      }
      if (modo === 'kilo' && elegido.gramos > 0) {
        pedido.gramos = elegido.gramos;
        pedido.subtotal = p.kilo * elegido.gramos / 1000;
      }
      return pedido;
    }).filter(Boolean);

    /* Si no quedó nada aprovechable, se arma una lista al azar en vez de
       dejar al estudiante con el mercado vacío. */
    if (manual.length) return manual;
  }

  /* Lista aleatoria, repartida entre secciones */
  const candidatos = barajar(productosPara(nivel.modos));
  const elegidos = [];
  const seccionesUsadas = new Set();

  for (const p of candidatos) {
    if (elegidos.length >= cuantos) break;
    if (seccionesUsadas.has(p.seccion)) continue;
    elegidos.push(p);
    seccionesUsadas.add(p.seccion);
  }
  for (const p of candidatos) {              // completa si faltan
    if (elegidos.length >= cuantos) break;
    if (!elegidos.includes(p)) elegidos.push(p);
  }

  return elegidos.map(p => crearPedido(p, alAzar(modosValidos(p, nivel)), nivel)).filter(Boolean);
}

/** Suma de la lista completa. */
function totalLista(lista) {
  return lista.reduce((t, p) => t + p.subtotal, 0);
}

/**
 * Presupuesto sugerido: el total más el margen del nivel, redondeado
 * hacia arriba a una cifra "de billetera" ($500 o $1.000).
 */
function presupuestoSugerido(lista, nivel) {
  const total = totalLista(lista);
  const conMargen = total * (1 + nivel.holgura);
  const paso = total >= 10000 ? 1000 : 500;
  return Math.max(Math.ceil(conMargen / paso) * paso, total);
}

/**
 * Convierte el presupuesto en billetes y monedas de verdad.
 *
 * Se reparte en dos partes para garantizar que SIEMPRE exista una
 * combinación exacta para pagar la cuenta: primero el monto justo del
 * total, después el vuelto que sobra. Así el pago exacto nunca es imposible.
 */
function generarBilletera(presupuesto, total) {
  const billetera = {};
  const agregar = bolsillo => {
    for (const [v, n] of Object.entries(bolsillo)) {
      billetera[v] = (billetera[v] || 0) + n;
    }
  };
  agregar(descomponerVariado(Math.min(total, presupuesto)));
  agregar(descomponerVariado(Math.max(0, presupuesto - total)));
  return darSuelto(billetera);
}

/**
 * Reparte un monto usando piezas variadas en vez de las más grandes posibles.
 *
 * Con el reparto simple, $30.000 se convertiría en un solo billete de $20.000
 * más uno de $10.000, y casi no habría nada que decidir en la caja. Poniendo
 * un tope por denominación se obtiene una billetera con más piezas medianas y
 * muchas más combinaciones posibles para llegar al total.
 *
 * Si con los topes no se alcanza el monto exacto, se relajan de a uno hasta
 * que calce, así que siempre devuelve un reparto válido.
 */
function descomponerVariado(monto) {
  if (monto <= 0) return {};

  const topes = { 20000: 0, 10000: 1, 5000: 2, 2000: 3, 1000: 3, 500: 3, 100: 9, 50: 2, 10: 4, 5: 2 };

  for (let holgura = 0; holgura < 14; holgura++) {
    const salida = {};
    let resto = monto;
    for (const d of DENOMINACIONES) {
      const tope = (topes[d.valor] || 0) + holgura;
      const n = Math.min(Math.floor(resto / d.valor), tope);
      if (n > 0) { salida[d.valor] = n; resto -= n * d.valor; }
    }
    if (resto === 0) return salida;
  }
  return descomponer(monto);   // último recurso
}

/**
 * Cambia una pieza grande por otras chicas sin alterar el total.
 * Con más suelto, el estudiante puede pagar justo aunque su carro no coincida
 * exactamente con la lista, y no queda atrapado en la caja.
 */
function darSuelto(billetera) {
  const partir = (de, en, cuantas) => {
    if (!billetera[de]) return;
    billetera[de]--;
    if (!billetera[de]) delete billetera[de];
    billetera[en] = (billetera[en] || 0) + cuantas;
  };
  partir(1000, 500, 2);
  partir(500, 100, 5);
  return billetera;
}

/* --- Comparación entre la lista y el carro -------------------------------- */

/**
 * Revisa el carro contra la lista y devuelve un informe por línea:
 *   estado: 'ok' | 'falta' | 'cantidad' | 'peso'
 * más los productos agregados que nadie pidió.
 */
function revisarCarro(lista, carro) {
  const detalle = lista.map(pedido => {
    const enCarro = carro.find(c => c.id === pedido.id);

    if (!enCarro) {
      return { pedido, estado: 'falta', mensaje: `Falta ${pedido.nombre.toLowerCase()}` };
    }
    if (pedido.modo === 'unidad' && enCarro.cantidad !== pedido.cantidad) {
      return {
        pedido, estado: 'cantidad',
        mensaje: `${pedido.nombre}: llevas ${enCarro.cantidad} y piden ${pedido.cantidad}`
      };
    }
    if (pedido.modo === 'kilo' && enCarro.gramos !== pedido.gramos) {
      return {
        pedido, estado: 'peso',
        mensaje: `${pedido.nombre}: llevas ${peso(enCarro.gramos)} y piden ${peso(pedido.gramos)}`
      };
    }
    return { pedido, estado: 'ok', mensaje: null };
  });

  const sobrantes = carro
    .filter(c => !lista.some(p => p.id === c.id))
    .map(c => ({ estado: 'sobra', mensaje: `${c.nombre} no estaba en la lista`, item: c }));

  return {
    detalle,
    sobrantes,
    completo: detalle.every(d => d.estado === 'ok') && sobrantes.length === 0,
    aciertos: detalle.filter(d => d.estado === 'ok').length
  };
}

/* ============================================================================
   Pago justo: ¿existe una combinación exacta?
   ----------------------------------------------------------------------------
   Se resuelve con programación dinámica sobre los montos alcanzables. Todas
   las denominaciones chilenas son múltiplos de 5, así que se trabaja en
   "unidades de 5 pesos" y la tabla queda diez veces más chica.

   Sirve para dos cosas opuestas:
     · en pago exacto, comprobar que SÍ se pueda pagar justo;
     · en pago con vuelto, comprobar que NO se pueda, para que el estudiante
       esté obligado a calcular el vuelto.
   ========================================================================== */
function puedePagarJusto(billetera, total) {
  if (total <= 0) return true;
  if (total % 5 !== 0) return false;

  const meta = total / 5;
  const alcanzable = new Uint8Array(meta + 1);
  alcanzable[0] = 1;

  for (const valorTexto of Object.keys(billetera)) {
    const paso = Number(valorTexto) / 5;
    let quedan = billetera[valorTexto];
    if (!paso || quedan <= 0) continue;

    /* Se agrupan las piezas iguales en potencias de dos: con 9 monedas de
       $100 basta considerar grupos de 1, 2, 4 y 2, en vez de nueve pasadas. */
    for (let grupo = 1; quedan > 0; grupo *= 2) {
      const cuantas = Math.min(grupo, quedan);
      quedan -= cuantas;
      const salto = paso * cuantas;
      if (salto > meta) continue;
      for (let i = meta; i >= salto; i--) {
        if (alcanzable[i - salto]) alcanzable[i] = 1;
      }
    }
  }
  return alcanzable[meta] === 1;
}

/**
 * Billetera para las actividades con vuelto.
 *
 * Aquí se busca lo contrario que en el pago exacto: que NO exista ninguna
 * combinación que dé justo la cuenta. Si el estudiante pudiera pagar justo,
 * se saltaría el cálculo del vuelto, que es lo que la actividad quiere
 * ejercitar.
 *
 * Se prueban repartos variados y se comprueba cada uno con puedePagarJusto().
 * Si ninguno sirve con el presupuesto pedido, se sube de a poco: vale más
 * ajustar el monto que entregar una actividad donde el vuelto sea opcional.
 */
function generarBilleteraConVuelto(presupuesto, total) {
  const intentar = monto => {
    for (let i = 0; i < 60; i++) {
      const billetera = repartoAlAzar(monto, i);
      if (!puedePagarJusto(billetera, total)) return billetera;
    }
    return null;
  };

  let encontrada = intentar(presupuesto);
  if (encontrada) return encontrada;

  /* Con este presupuesto no hay reparto que impida el pago justo: se sube
     en pasos de $500 hasta encontrar uno que sí lo impida. */
  for (let extra = 500; extra <= 20000; extra += 500) {
    encontrada = intentar(presupuesto + extra);
    if (encontrada) return { billetera: encontrada, presupuesto: presupuesto + extra };
  }
  return null;
}

/**
 * Reparte un monto en piezas al azar, respetando topes por denominación.
 * La semilla hace que cada intento pruebe una mezcla distinta.
 */
function repartoAlAzar(monto, semilla) {
  if (monto <= 0) return {};

  /* Pieza más chica permitida. Se sortea entre varias opciones en vez de ir
     siempre de gruesa a fina: así la billetera suele traer también monedas y
     no solo billetes grandes, que dejarían poco que decidir en la caja. Si
     tras varios intentos no se logra impedir el pago justo, se pasa a
     repartos cada vez más gruesos, que son los que más lo dificultan. */
  const variados = [500, 1000, 500, 100, 1000, 500, 100, 2000];
  const minimo = semilla < variados.length
    ? variados[semilla]
    : [1000, 2000, 5000][Math.min(Math.floor((semilla - variados.length) / 12), 2)];

  const usables = DENOMINACIONES.filter(d => d.valor >= minimo && d.valor <= monto);
  if (!usables.length) return descomponerVariado(monto);

  const salida = {};
  let resto = monto;
  let vueltas = 0;
  while (resto > 0 && vueltas++ < 200) {
    const posibles = usables.filter(d => d.valor <= resto);
    if (!posibles.length) break;
    const d = posibles[Math.floor(Math.random() * posibles.length)];
    const maximo = Math.min(Math.floor(resto / d.valor), 4);
    const n = 1 + Math.floor(Math.random() * Math.max(1, maximo));
    salida[d.valor] = (salida[d.valor] || 0) + n;
    resto -= n * d.valor;
  }
  if (resto !== 0) return descomponerVariado(monto);
  return salida;
}
