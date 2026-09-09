/* ============================================================================
   svg.js — Ilustraciones de los productos
   ----------------------------------------------------------------------------
   Cada producto se dibuja con un pictograma de ARASAAC. Son los mismos que usa
   el material de comunicación aumentativa del colegio: trazo negro grueso y
   relleno plano, que es lo que hace que se reconozcan de un vistazo y que no
   desaparezcan sobre el fondo claro de las tarjetas.

   ATRIBUCIÓN OBLIGATORIA — no quitarla:
   Los símbolos pictográficos son propiedad del Gobierno de Aragón, fueron
   creados por Sergio Palao para ARASAAC (https://arasaac.org) y se distribuyen
   con licencia Creative Commons BY-NC-SA. Esa licencia obliga a citar autor,
   origen y licencia, y a distribuir cualquier obra derivada —este juego
   incluido— con la misma licencia. Ver LICENSE.

   Los PNG viven en img/productos/ y construir.py los incrusta en base64 dentro
   del archivo único, igual que las monedas y los billetes.

   Un solo pictograma se modificó: el de la harina traía una flecha apuntando a
   un pan (es un pictograma de «proceso»), y en un anaquel eso confunde. Se
   recortó para dejar solo la bolsa.
   ========================================================================== */

/* --- Qué pictograma le toca a cada producto -------------------------------
   El buscador de ARASAAC responde por palabra y no por significado, así que
   estos se eligieron mirándolos uno a uno: «papa» devolvía el padre, «té» el
   pronombre «tú» y «naranja» la mancha del color.
   ------------------------------------------------------------------------- */
const PICTOGRAMAS = {
  /* --- Mercado --- */
  /* Frutas y verduras */
  manzana:      'img/productos/manzana.png',
  platano:      'img/productos/platano.png',
  tomate:       'img/productos/tomate.png',
  papa:         'img/productos/papa.png',
  zanahoria:    'img/productos/zanahoria.png',
  naranja:      'img/productos/naranja.png',
  palta:        'img/productos/palta.png',
  lechuga:      'img/productos/lechuga.png',
  /* Panadería */
  marraqueta:   'img/productos/marraqueta.png',
  panmolde:     'img/productos/panmolde.png',
  rollocanela:  'img/productos/rollocanela.png',
  empanada:     'img/productos/empanada.png',
  /* Lácteos */
  leche:        'img/productos/leche.png',
  yogurt:       'img/productos/yogurt.png',
  queso:        'img/productos/queso.png',
  mantequilla:  'img/productos/mantequilla.png',
  huevo:        'img/productos/huevo.png',
  /* Carnicería */
  pollo:        'img/productos/pollo.png',
  molida:       'img/productos/molida.png',
  longaniza:    'img/productos/longaniza.png',
  vienesa:      'img/productos/vienesa.png',
  /* Abarrotes */
  arroz:        'img/productos/arroz.png',
  fideos:       'img/productos/fideos.png',
  azucar:       'img/productos/azucar.png',
  aceite:       'img/productos/aceite.png',
  atun:         'img/productos/atun.png',
  mermelada:    'img/productos/mermelada.png',
  /* Bebidas */
  bebida:       'img/productos/bebida.png',
  jugo:         'img/productos/jugo.png',
  agua:         'img/productos/agua.png',
  /* Frutas y verduras */
  sandia:       'img/productos/sandia.png',
  uva:          'img/productos/uva.png',
  choclo:       'img/productos/choclo.png',
  zapallo:      'img/productos/zapallo.png',
  limon:        'img/productos/limon.png',
  /* Lácteos */
  manjar:       'img/productos/manjar.png',
  /* Carnicería */
  pescado:      'img/productos/pescado.png',
  /* Abarrotes */
  porotos:      'img/productos/porotos.png',
  harina:       'img/productos/harina.png',
  te:           'img/productos/te.png',
  cafe:         'img/productos/cafe.png',
  galletas:     'img/productos/galletas.png',
  salsa:        'img/productos/salsa.png',
  /* Bebidas */
  nectar:       'img/productos/nectar.png',
  /* Aseo */
  papel:        'img/productos/papel.png',
  detergente:   'img/productos/detergente.png',
  jabon:        'img/productos/jabon.png',

  /* --- Feria de Botalcura --- */
  /* --- Los cinco de la clase, con sus precios tal cual --- */
  miel:         'img/productos/miel.png',
  maiz:         'img/productos/maiz.png',
  papas:        'img/productos/papas.png',
  /* --- Agregados para dar variedad a los niveles --- */
  panamasado:   'img/productos/panamasado.png'
};

/* Lienzo de respaldo, por si algún día se agrega un producto sin pictograma. */
const SIN_DIBUJO =
  '<rect x="28" y="32" width="44" height="48" rx="6" fill="#D8CBB4"/>' +
  '<path d="M28 44h44" stroke="#B9AB92" stroke-width="3"/>';

/**
 * Devuelve la ilustración de un producto.
 *
 * Va envuelta en un <svg> y no en un <img> a propósito: todo el CSS del juego
 * dimensiona los dibujos con selectores como «.producto svg» o
 * «.carro__item svg». Envolviendo el PNG, el anaquel, el carro, la vitrina de
 * los desafíos y el mostrador de la feria siguen funcionando sin tocar ni una
 * regla de estilo.
 *
 * `preserveAspectRatio` evita deformar los que no son cuadrados (la harina,
 * después del recorte). `xlink:href` va junto a `href` porque los navegadores
 * de las tablets viejas todavía piden el primero.
 */
function dibujoProducto(id) {
  const ruta = PICTOGRAMAS[id];
  const lienzo = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"' +
                 ' xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true">';
  if (!ruta) return lienzo + SIN_DIBUJO + '</svg>';
  return lienzo +
    '<image x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"' +
    ' href="' + ruta + '" xlink:href="' + ruta + '"/></svg>';
}
