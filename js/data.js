/* ============================================================================
   data.js — Contenido del juego
   ----------------------------------------------------------------------------
   CANÓNICO (extraído del cuadernillo de manejo de dinero):
     · Las 10 denominaciones del peso chileno y sus imágenes.
   NUEVO (no existe en el cuadernillo, creado para este juego):
     · Catálogo de productos, precios y secciones del mercado.
   ========================================================================== */

/* --- Denominaciones del peso chileno (CLP) -------------------------------- */
/* Las imágenes son PNG extraídos del PDF original. El diseño no se altera.   */
const DENOMINACIONES = [
  { valor: 20000, tipo: 'billete', nombre: 'Veinte mil pesos',  img: 'img/billetes/20000.png' },
  { valor: 10000, tipo: 'billete', nombre: 'Diez mil pesos',    img: 'img/billetes/10000.png' },
  { valor:  5000, tipo: 'billete', nombre: 'Cinco mil pesos',   img: 'img/billetes/5000.png'  },
  { valor:  2000, tipo: 'billete', nombre: 'Dos mil pesos',     img: 'img/billetes/2000.png'  },
  { valor:  1000, tipo: 'billete', nombre: 'Mil pesos',         img: 'img/billetes/1000.png'  },
  { valor:   500, tipo: 'moneda',  nombre: 'Quinientos pesos',  img: 'img/monedas/500.png'    },
  { valor:   100, tipo: 'moneda',  nombre: 'Cien pesos',        img: 'img/monedas/100.png'    },
  { valor:    50, tipo: 'moneda',  nombre: 'Cincuenta pesos',   img: 'img/monedas/50.png'     },
  { valor:    10, tipo: 'moneda',  nombre: 'Diez pesos',        img: 'img/monedas/10.png'     },
  { valor:     5, tipo: 'moneda',  nombre: 'Cinco pesos',       img: 'img/monedas/5.png'      }
];

/* --- Secciones del mercado ------------------------------------------------ */
const SECCIONES_MERCADO = [
  { id: 'feria',      nombre: 'Frutas y verduras', emoji: '🥕', color: '#4E9E5B' },
  { id: 'panaderia',  nombre: 'Panadería',         emoji: '🥖', color: '#C98A2E' },
  { id: 'lacteos',    nombre: 'Lácteos',           emoji: '🥛', color: '#4A8BC2' },
  { id: 'carniceria', nombre: 'Carnicería',        emoji: '🍗', color: '#C4553F' },
  { id: 'abarrotes',  nombre: 'Abarrotes',         emoji: '🍚', color: '#8B6BB1' },
  { id: 'bebidas',    nombre: 'Bebidas',           emoji: '🧃', color: '#2F9B92' },
  { id: 'aseo',       nombre: 'Aseo',              emoji: '🧼', color: '#5C9BDD' }
];

/* --- Catálogo de productos ------------------------------------------------
   Cada producto declara los modos de precio que admite:
     fijo   → precio del producto completo (envase / bandeja / bolsa)
     unidad → precio por unidad, la lista pide N unidades
     kilo   → precio por kilogramo, la lista pide un peso
   pesoMax limita cuánto se puede pedir de los productos caros.
   plural se usa en la lista cuando el nombre está en singular:
   "6 sachets de salsa de tomate" en vez de "6 salsa de tomate".

   REGLA DE DISEÑO: todo precio por kilo es múltiplo de $400.
   Así cada paso de la balanza (250 g) da siempre un valor redondo,
   sin decimales imposibles de calcular a mano.
   -------------------------------------------------------------------------- */
const PRODUCTOS_MERCADO = [
  /* Frutas y verduras */
  { id: 'manzana',   nombre: 'Manzanas',      seccion: 'feria', fijo: 1600, unidad: 400, kilo: 1600, envase: 'bolsa' },
  { id: 'platano',   nombre: 'Plátanos',      seccion: 'feria', unidad: 300, kilo: 1600 },
  { id: 'tomate',    nombre: 'Tomates',       seccion: 'feria', unidad: 400, kilo: 2000 },
  { id: 'papa',      nombre: 'Papas',         seccion: 'feria', fijo: 2400, kilo: 1200, envase: 'malla 2 kg' },
  { id: 'zanahoria', nombre: 'Zanahorias',    seccion: 'feria', unidad: 200, kilo: 800 },
  { id: 'naranja',   nombre: 'Naranjas',      seccion: 'feria', unidad: 300, kilo: 1200 },
  { id: 'palta',     nombre: 'Paltas',        seccion: 'feria', unidad: 800, kilo: 6000, pesoMax: 500 },
  { id: 'lechuga',   nombre: 'Lechuga',       seccion: 'feria', fijo: 900, unidad: 900, plural: 'lechugas' },

  /* Panadería */
  { id: 'marraqueta', nombre: 'Marraquetas',  seccion: 'panaderia', unidad: 200, kilo: 2000, pesoMax: 1000 },
  { id: 'panmolde',   nombre: 'Pan de molde', seccion: 'panaderia', fijo: 1900, envase: 'bolsa', plural: 'panes de molde' },
  { id: 'berlin',     nombre: 'Berlines',     seccion: 'panaderia', unidad: 800 },
  { id: 'empanada',   nombre: 'Empanadas',    seccion: 'panaderia', unidad: 1800 },

  /* Lácteos */
  { id: 'leche',       nombre: 'Leche',       seccion: 'lacteos', fijo: 1200, unidad: 1200, envase: 'caja 1 L', plural: 'cajas de leche' },
  { id: 'yogurt',      nombre: 'Yogur',       seccion: 'lacteos', unidad: 600, plural: 'yogures' },
  { id: 'queso',       nombre: 'Queso',       seccion: 'lacteos', fijo: 3000, kilo: 12000, envase: 'trozo', pesoMax: 500 },
  { id: 'mantequilla', nombre: 'Mantequilla', seccion: 'lacteos', fijo: 1500, envase: 'pan' },
  { id: 'huevo',       nombre: 'Huevos',      seccion: 'lacteos', unidad: 200 },

  /* Carnicería */
  { id: 'pollo',     nombre: 'Pollo',         seccion: 'carniceria', kilo: 4000, pesoMax: 1500 },
  { id: 'molida',    nombre: 'Carne molida',  seccion: 'carniceria', kilo: 8000, pesoMax: 1000 },
  { id: 'longaniza', nombre: 'Longanizas',    seccion: 'carniceria', unidad: 1200, kilo: 6000, pesoMax: 500 },
  { id: 'vienesa',   nombre: 'Vienesas',      seccion: 'carniceria', fijo: 2200, envase: 'paquete' },

  /* Abarrotes */
  { id: 'arroz',     nombre: 'Arroz',         seccion: 'abarrotes', fijo: 1500, envase: 'bolsa 1 kg' },
  { id: 'fideos',    nombre: 'Fideos',        seccion: 'abarrotes', fijo: 1000, unidad: 1000, envase: 'bolsa', plural: 'bolsas de fideos' },
  { id: 'azucar',    nombre: 'Azúcar',        seccion: 'abarrotes', fijo: 1300, envase: 'bolsa 1 kg' },
  { id: 'aceite',    nombre: 'Aceite',        seccion: 'abarrotes', fijo: 2500, envase: 'botella' },
  { id: 'atun',      nombre: 'Atún',          seccion: 'abarrotes', fijo: 1300, unidad: 1300, envase: 'tarro', plural: 'tarros de atún' },
  { id: 'mermelada', nombre: 'Mermelada',     seccion: 'abarrotes', fijo: 1900, envase: 'frasco' },

  /* Bebidas */
  { id: 'bebida', nombre: 'Bebida',           seccion: 'bebidas', fijo: 1800, envase: 'botella 1,5 L' },
  { id: 'jugo',   nombre: 'Jugo',             seccion: 'bebidas', unidad: 900, plural: 'jugos' },
  { id: 'agua',   nombre: 'Agua mineral',     seccion: 'bebidas', unidad: 800, plural: 'aguas minerales' },

  /* --- Ampliación del catálogo (canasta básica chilena) --- */

  /* Frutas y verduras */
  { id: 'sandia',   nombre: 'Sandía',      seccion: 'feria', fijo: 3200, kilo: 800, envase: 'entera' },
  { id: 'uva',      nombre: 'Uvas',        seccion: 'feria', kilo: 2400, pesoMax: 1000 },
  { id: 'choclo',   nombre: 'Choclos',     seccion: 'feria', unidad: 700 },
  { id: 'zapallo',  nombre: 'Zapallo',     seccion: 'feria', kilo: 1200, pesoMax: 1500 },
  { id: 'limon',    nombre: 'Limones',     seccion: 'feria', unidad: 100, kilo: 1600, pesoMax: 500 },

  /* Lácteos */
  { id: 'manjar',   nombre: 'Manjar',      seccion: 'lacteos', fijo: 2300, envase: 'pote' },

  /* Carnicería */
  { id: 'pescado',  nombre: 'Pescado',     seccion: 'carniceria', kilo: 6000, pesoMax: 1000 },

  /* Abarrotes */
  { id: 'porotos',  nombre: 'Porotos',     seccion: 'abarrotes', fijo: 1600, kilo: 2800, pesoMax: 1000, envase: 'bolsa' },
  { id: 'harina',   nombre: 'Harina',      seccion: 'abarrotes', fijo: 1400, envase: 'bolsa 1 kg' },
  { id: 'te',       nombre: 'Té',          seccion: 'abarrotes', fijo: 2400, envase: 'caja' },
  { id: 'cafe',     nombre: 'Café',        seccion: 'abarrotes', fijo: 3500, envase: 'frasco' },
  { id: 'galletas', nombre: 'Galletas',    seccion: 'abarrotes', fijo: 800, unidad: 800, envase: 'paquete', plural: 'paquetes de galletas' },
  { id: 'salsa',    nombre: 'Salsa de tomate', seccion: 'abarrotes', fijo: 900, unidad: 900, envase: 'sachet', plural: 'sachets de salsa de tomate' },

  /* Bebidas */
  { id: 'nectar',   nombre: 'Néctar',      seccion: 'bebidas', unidad: 1100, plural: 'néctares' },

  /* Aseo */
  { id: 'papel',      nombre: 'Papel higiénico', seccion: 'aseo', fijo: 3900, envase: 'paquete' },
  { id: 'detergente', nombre: 'Detergente',      seccion: 'aseo', fijo: 4500, envase: 'bolsa' },
  { id: 'jabon',      nombre: 'Jabón',           seccion: 'aseo', unidad: 900, plural: 'jabones' }
];

/* ============================================================================
   Feria de Botalcura
   ----------------------------------------------------------------------------
   Los cinco primeros productos y sus precios son EXACTAMENTE los de la
   Clase 3 del curso: leche $900 el litro, huevo $220 cada uno, tarro de miel
   $3.500, kilo de maíz $1.500 y saco de papas $8.000. No se tocan.

   Los demás se agregaron para que cada nivel tenga con qué trabajar (con solo
   cinco productos, el nivel del kilo se quedaba con uno). Están marcados con
   `extra: true` y el profesor puede dejarlos fuera eligiendo la lista a mano.

   Aquí el peso se mide en kilos enteros, como en la clase ("6 kilos de maíz"),
   no en cuartos de kilo.
   ========================================================================== */
const SECCIONES_BOTALCURA = [
  { id: 'granja',  nombre: 'Granja',       emoji: '🐔', color: '#C98A2E' },
  { id: 'huerta',  nombre: 'Huerta',       emoji: '🌽', color: '#4E9E5B' },
  { id: 'amasado', nombre: 'Amasandería',  emoji: '🥖', color: '#B5762F' }
];

const PRODUCTOS_BOTALCURA = [
  /* --- Los cinco de la clase, con sus precios tal cual --- */
  { id: 'leche',  nombre: 'Leche',  seccion: 'granja', unidad: 900,  envase: 'litro', plural: 'litros de leche' },
  { id: 'huevo',  nombre: 'Huevos', seccion: 'granja', unidad: 220 },
  { id: 'miel',   nombre: 'Miel',   seccion: 'granja', fijo: 3500, envase: 'tarro', plural: 'tarros de miel' },
  { id: 'maiz',   nombre: 'Maíz',   seccion: 'huerta', kilo: 1500, pasoPeso: 1000, pesoMax: 6000 },
  { id: 'papas',  nombre: 'Papas',  seccion: 'huerta', fijo: 8000, envase: 'saco', plural: 'sacos de papas' },

  /* --- Agregados para dar variedad a los niveles --- */
  { id: 'queso',      nombre: 'Queso de campo', seccion: 'granja',  kilo: 8000, pasoPeso: 1000, pesoMax: 3000, extra: true },
  { id: 'panamasado', nombre: 'Pan amasado',    seccion: 'amasado', unidad: 300, plural: 'panes amasados', extra: true },
  { id: 'zapallo',    nombre: 'Zapallo',        seccion: 'huerta',  kilo: 1000, pasoPeso: 1000, pesoMax: 5000, extra: true },
  { id: 'porotos',    nombre: 'Porotos',        seccion: 'huerta',  fijo: 1600, envase: 'bolsa', plural: 'bolsas de porotos', extra: true },
  { id: 'sandia',     nombre: 'Sandía',         seccion: 'huerta',  fijo: 3200, envase: 'entera', plural: 'sandías', extra: true }
];

/* --- Catálogos disponibles ------------------------------------------------ */
const CATALOGOS = {
  mercado: {
    id: 'mercado', nombre: 'Mercado', emoji: '🛒',
    descripcion: 'Supermercado con 47 productos en 7 secciones.',
    productos: PRODUCTOS_MERCADO, secciones: SECCIONES_MERCADO
  },
  botalcura: {
    id: 'botalcura', nombre: 'Feria de Botalcura', emoji: '🌾',
    descripcion: 'Los productos del campo con los precios de la clase.',
    productos: PRODUCTOS_BOTALCURA, secciones: SECCIONES_BOTALCURA
  }
};

/* El catálogo en uso. Se cambia con usarCatalogo(). */
let PRODUCTOS = PRODUCTOS_MERCADO;
let SECCIONES = SECCIONES_MERCADO;

/** Cambia el catálogo activo del juego. */
function usarCatalogo(id) {
  const c = CATALOGOS[id] || CATALOGOS.mercado;
  PRODUCTOS = c.productos;
  SECCIONES = c.secciones;
  return c;
}

/** Precio de un producto de la feria, para armar los enunciados. */
function precioFeria(id, modo) {
  const p = PRODUCTOS_BOTALCURA.find(x => x.id === id);
  return p ? p[modo] : 0;
}

/* --- Niveles de dificultad ------------------------------------------------ */
const NIVELES = {
  1: {
    id: 1,
    nombre: 'Precio fijo',
    lema: 'Cada producto tiene un solo precio',
    emoji: '🏷️',
    modos: ['fijo'],
    items: [3, 4],          // rango de productos en la lista
    holgura: 0.35,          // margen del presupuesto sugerido sobre el total
    pago: 'exacto'
  },
  2: {
    id: 2,
    nombre: 'Por unidad',
    lema: 'Cuenta cuántos necesitas y multiplica',
    emoji: '🔢',
    modos: ['unidad'],
    items: [3, 4],
    cantidad: [2, 6],       // rango de unidades pedidas
    holgura: 0.3,
    pago: 'exacto'
  },
  3: {
    id: 3,
    nombre: 'Por kilo',
    lema: 'Usa la balanza y calcula el peso',
    emoji: '⚖️',
    modos: ['kilo'],
    items: [3, 4],
    pesos: [250, 500, 750, 1000, 1500],
    holgura: 0.3,
    pago: 'vuelto'
  },
  4: {
    id: 4,
    nombre: 'Súper reto',
    lema: 'Precios fijos, por unidad y por kilo, todo junto',
    emoji: '🏆',
    modos: ['fijo', 'unidad', 'kilo'],
    items: [5, 7],
    cantidad: [2, 8],
    pesos: [250, 500, 750, 1000, 1500, 2000],
    holgura: 0.15,          // presupuesto más ajustado
    pago: 'vuelto'
  }
};

/* --- Configuración por defecto (editable por el profesor) ----------------- */
const CONFIG_DEFECTO = {
  catalogo: 'mercado',      // 'mercado' | 'botalcura'
  nivel: 1,
  presupuestoAuto: true,
  presupuesto: 10000,
  nItems: null,             // null = según el nivel
  listaManual: null,        // null = lista aleatoria; si no, array de ids
  modoPago: 'nivel',        // 'nivel' | 'exacto' | 'vuelto'
  mostrarRestante: true,    // mostrar «Te queda» mientras compra
  mostrarSumaBandeja: false,// mostrar la suma de lo puesto en la bandeja
  exigirTotal: 'siempre',   // 'nivel' | 'siempre' | 'nunca': calcular el total a mano
                            // por defecto se pide en TODOS los niveles, incluido
                            // el 1 (precio fijo): sumar precios ya es el ejercicio.
  tacharAuto: true,         // tachar solo los productos ya conseguidos
  ayudaSubtotal: true,      // mostrar el total del carro mientras compra
  ayudaCalculadora: false,  // calculadora en pantalla
  bloquearExceso: true,     // impedir pasarse del presupuesto
  textoGrande: false,
  sonido: true,
  pedirEstrategia: true,    // preguntar cómo lo pensó al resolver un desafío
  permitirIncorrecta: true, // dejar seguir con una respuesta equivocada
  proyeccion: false         // letra grande para mostrar al curso
};

/* Paso de la balanza, en gramos. Con precios múltiplos de $400 el resultado
   siempre es un múltiplo de $100. Algunos productos usan su propio paso: en la
   feria de Botalcura el maíz se vende por kilos enteros. */
const PASO_BALANZA = 250;

/** Cuánto sube o baja la balanza para este producto. */
function pasoDe(producto) {
  return (producto && producto.pasoPeso) || PASO_BALANZA;
}

/* ============================================================================
   Desafíos no rutinarios (Experiencia 3)
   ----------------------------------------------------------------------------
   Tomados de la Clase 3. Tres formas de responder:

     numero      → se escribe una cantidad en el teclado
     eleccion    → se elige entre dos o tres opciones
     combinacion → se arma una compra; la valida una regla, no una respuesta
                   única, así que hay muchas soluciones correctas

   Los precios se leen del catálogo de Botalcura, de modo que enunciado y
   respuesta nunca se puedan desincronizar.
   ========================================================================== */

/* Atajos para escribir los enunciados sin repetir números */
const _LECHE = 900, _HUEVO = 220, _MIEL = 3500, _MAIZ = 1500, _PAPAS = 8000;
const _CANASTA = _LECHE + 6 * _HUEVO + _MIEL;   /* 900 + 1.320 + 3.500 = 5.720 */

const DESAFIOS = [
  {
    id: 'desayuno',
    tipo: 'numero',
    titulo: 'El desayuno de la tía Gloria',
    enunciado: 'La tía Gloria compra 2 litros de leche y 3 huevos. ¿Cuánto dinero debe pagar en total?',
    muestra: ['leche', 'huevo'],
    respuesta: 2 * _LECHE + 3 * _HUEVO,
    unidad: 'pesos',
    pista: 'Primero calcula cuánto cuestan los 2 litros de leche. Después los 3 huevos. Al final, súmalos.',
    explicacion: `2 × ${pesos(_LECHE)} = ${pesos(2 * _LECHE)} · 3 × ${pesos(_HUEVO)} = ${pesos(3 * _HUEVO)} · en total ${pesos(2 * _LECHE + 3 * _HUEVO)}`
  },
  {
    id: 'comparar',
    tipo: 'eleccion',
    titulo: '¿Qué cuesta más?',
    enunciado: '¿Qué cuesta más: un saco de papas o 6 kilos de maíz?',
    muestra: ['papas', 'maiz'],
    opciones: [
      { texto: 'El saco de papas', valor: _PAPAS, correcta: false },
      { texto: '6 kilos de maíz', valor: 6 * _MAIZ, correcta: true },
      { texto: 'Cuestan lo mismo', valor: null, correcta: false }
    ],
    pista: 'El saco de papas ya tiene su precio. Para el maíz, multiplica el precio del kilo por 6.',
    explicacion: `El saco de papas cuesta ${pesos(_PAPAS)}. 6 kilos de maíz cuestan 6 × ${pesos(_MAIZ)} = ${pesos(6 * _MAIZ)}. El maíz cuesta ${pesos(6 * _MAIZ - _PAPAS)} más.`
  },
  {
    id: 'huevos-miel',
    tipo: 'numero',
    titulo: 'Huevos por un tarro de miel',
    enunciado: 'Con el dinero que cuesta un tarro de miel, ¿cuántos huevos se pueden comprar?',
    muestra: ['miel', 'huevo'],
    respuesta: Math.floor(_MIEL / _HUEVO),
    unidad: 'huevos',
    pista: `El tarro de miel cuesta ${pesos(_MIEL)} y cada huevo ${pesos(_HUEVO)}. Ve sumando de a ${pesos(_HUEVO)} hasta acercarte, sin pasarte.`,
    explicacion: `${Math.floor(_MIEL / _HUEVO)} huevos cuestan ${pesos(Math.floor(_MIEL / _HUEVO) * _HUEVO)}. Con uno más te pasarías del precio del tarro, así que sobran ${pesos(_MIEL - Math.floor(_MIEL / _HUEVO) * _HUEVO)}.`
  },
  {
    id: 'sobra-sebastian',
    tipo: 'numero',
    titulo: 'Lo que le sobra a Sebastián',
    enunciado: 'Sebastián tiene $10.000. Compra un saco de papas y 2 litros de leche. ¿Cuánto dinero le sobra?',
    muestra: ['papas', 'leche'],
    respuesta: 10000 - (_PAPAS + 2 * _LECHE),
    unidad: 'pesos',
    pista: 'Suma primero todo lo que compró. Después réstalo de los $10.000 que tenía.',
    explicacion: `${pesos(_PAPAS)} + 2 × ${pesos(_LECHE)} = ${pesos(_PAPAS + 2 * _LECHE)}. Y $10.000 − ${pesos(_PAPAS + 2 * _LECHE)} = ${pesos(10000 - (_PAPAS + 2 * _LECHE))}.`
  },
  {
    id: 'sofia',
    tipo: 'combinacion',
    titulo: '¿Qué puede comprar Sofía?',
    enunciado: 'Sofía tiene $5.000. Arma una compra que pueda pagar con ese dinero.',
    tope: 5000,
    regla: 'cabe',
    pista: 'Hay muchas respuestas buenas. Prueba una y fíjate si te alcanza.',
    explicacion: 'Este problema tiene muchas soluciones. Lo importante es no pasarse de $5.000.'
  },
  {
    id: 'miel-huevos',
    tipo: 'numero',
    titulo: 'La compra de Isaías',
    enunciado: 'Isaías compra 2 tarros de miel y 10 huevos. ¿Cuánto paga?',
    muestra: ['miel', 'huevo'],
    respuesta: 2 * _MIEL + 10 * _HUEVO,
    unidad: 'pesos',
    pista: 'Calcula por separado los tarros de miel y los huevos, y después suma.',
    explicacion: `2 × ${pesos(_MIEL)} = ${pesos(2 * _MIEL)} · 10 × ${pesos(_HUEVO)} = ${pesos(10 * _HUEVO)} · en total ${pesos(2 * _MIEL + 10 * _HUEVO)}`
  },
  {
    id: 'sube-leche',
    tipo: 'numero',
    titulo: 'Sube el precio de la leche',
    enunciado: 'La leche sube $200. ¿Cuánto cuestan ahora 3 litros?',
    muestra: ['leche'],
    respuesta: 3 * (_LECHE + 200),
    unidad: 'pesos',
    pista: 'Primero averigua cuánto vale ahora un litro. Recién después multiplica por 3.',
    explicacion: `Un litro pasa de ${pesos(_LECHE)} a ${pesos(_LECHE + 200)}. Y 3 × ${pesos(_LECHE + 200)} = ${pesos(3 * (_LECHE + 200))}.`
  },
  {
    id: 'gastar-todo',
    tipo: 'combinacion',
    titulo: 'Gastar la mayor cantidad posible',
    enunciado: 'Tienes $10.000. Arma la compra que gaste la mayor cantidad de dinero posible, sin pasarte.',
    tope: 10000,
    regla: 'maximizar',
    pista: 'Prueba distintas combinaciones. Fíjate cuánto te va sobrando: mientras menos sobre, mejor.',
    explicacion: 'Se puede llegar justo a los $10.000. Por ejemplo: un saco de papas ($8.000) y 2 litros de leche ($1.800) dejan $200; agregando algo de $200 se gasta todo.'
  },
  {
    id: 'canastas-cuantas',
    tipo: 'numero',
    titulo: 'Las canastas del curso',
    enunciado: 'Cada canasta lleva 1 litro de leche, 6 huevos y 1 tarro de miel. El curso tiene 5 litros de leche, 37 huevos y 6 tarros de miel. ¿Cuántas canastas completas puede armar?',
    muestra: ['leche', 'huevo', 'miel'],
    respuesta: 5,
    unidad: 'canastas',
    pista: 'Mira cuántas canastas alcanzan con cada producto por separado. El que alcance para menos es el que manda.',
    explicacion: 'Con 5 litros de leche salen 5 canastas. Con 37 huevos alcanzan para 6. Con 6 tarros de miel, para 6. La leche es la que se acaba primero: 5 canastas. Sobran 7 huevos y 1 tarro de miel.'
  },
  {
    id: 'canasta-valor',
    tipo: 'numero',
    titulo: '¿Cuánto vale una canasta?',
    enunciado: 'Una canasta lleva 1 litro de leche, 6 huevos y 1 tarro de miel. ¿Cuánto dinero vale?',
    muestra: ['leche', 'huevo', 'miel'],
    respuesta: _CANASTA,
    unidad: 'pesos',
    pista: 'Calcula cada parte y súmalas: la leche, los 6 huevos y la miel.',
    explicacion: `${pesos(_LECHE)} + 6 × ${pesos(_HUEVO)} + ${pesos(_MIEL)} = ${pesos(_CANASTA)}`
  },
  {
    id: 'canastas-veinte',
    tipo: 'numero',
    titulo: 'Canastas con $20.000',
    enunciado: `Cada canasta vale ${pesos(_CANASTA)}. ¿Cuántas canastas completas se pueden comprar con $20.000?`,
    muestra: ['leche', 'huevo', 'miel'],
    respuesta: Math.floor(20000 / _CANASTA),
    unidad: 'canastas',
    pista: 'Ve sumando canastas: una, dos, tres… hasta que ya no te alcance para otra.',
    explicacion: `${Math.floor(20000 / _CANASTA)} canastas cuestan ${pesos(Math.floor(20000 / _CANASTA) * _CANASTA)}. Para una cuarta faltaría dinero. Sobran ${pesos(20000 - Math.floor(20000 / _CANASTA) * _CANASTA)}.`
  }
];

/* --- Tarjetas de estrategia ------------------------------------------------
   Después de resolver, el estudiante marca cómo lo pensó. Se eligen tocando
   dibujos y palabras cortas, no escribiendo: el curso tiene vocabulario
   limitado y varios estudiantes con barreras léxicas.
   ------------------------------------------------------------------------- */
const ESTRATEGIAS = [
  { id: 'sumar',      emoji: '➕', texto: 'Sumé de a poco' },
  { id: 'multiplicar',emoji: '✖️', texto: 'Multipliqué' },
  { id: 'restar',     emoji: '➖', texto: 'Resté del total' },
  { id: 'repartir',   emoji: '➗', texto: 'Repartí en partes iguales' },
  { id: 'monedas',    emoji: '🪙', texto: 'Lo hice con las monedas' },
  { id: 'dibujo',     emoji: '✏️', texto: 'Lo dibujé o lo anoté' },
  { id: 'probar',     emoji: '🔁', texto: 'Probé y corregí' },
  { id: 'mental',     emoji: '🧠', texto: 'Lo pensé en la cabeza' }
];
