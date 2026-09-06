# Mercado — juego de manejo de dinero chileno

Material de matemática para **4° básico** de la Escuela Rural Osvaldo Hiriart
Corvalán (Botalcura, Región del Maule, Chile). Cubre el **OA 7** y la
**Experiencia 3** de la planificación del profesor.

Todo el proyecto está en **español de Chile**: interfaz, código, comentarios,
nombres de variables y mensajes. Mantener ese idioma.

---

## Cómo trabajar en este proyecto

```bash
python3 construir.py      # empaqueta todo en «Mercado (archivo unico).html»
```

`construir.py` incrusta CSS, JS e imágenes (en base64) en un solo HTML que se
abre con **doble clic, sin servidor y sin internet**. Ese archivo es el
entregable: el profesor lo copia a un pendrive y listo. También deja la copia
que sirve el modo aula (`aula/Mercado (archivo unico).html`) al día; si no,
las tablets reciben la versión anterior y el fallo solo se nota en clase.

**Nunca editar `Mercado (archivo unico).html` a mano.** Es generado. Se editan
las fuentes y se reconstruye.

```bash
npm start                 # abre la app de escritorio (Electron)
npm run app               # genera el instalador en instalador/
npm run icono             # rehace electron/icono.ico desde electron/icono.svg
npm run publicar          # instalador + publicación en GitHub Releases
```

**El juego no sabe que existe Electron.** La app solo levanta el servidor de
aula y abre una ventana apuntando a él; el HTML es exactamente el mismo que se
abre con doble clic. Si algo del juego falla en la app, falla igual en el
navegador: se depura ahí, que es más cómodo.

### Orden de carga de los módulos (importa)

`util.js → data.js → svg.js → lista.js → mercado.js → caja.js → desafios.js →
feria.js → aula.js → app.js`

`util.js` va primero porque los enunciados de los desafíos formatean precios
(`pesos()`) en el momento de construirse. Si se agrega un módulo, actualizar
tanto `index.html` como la lista `JS` de `construir.py`.

### Estructura

| Ruta | Qué hay |
|---|---|
| `index.html` | Todas las pantallas (`<section class="pantalla">`) |
| `css/style.css` | Hoja única, con variables de color en `:root` |
| `js/data.js` | Productos, niveles, desafíos, configuración por defecto |
| `js/lista.js` | Genera la lista de compras y la billetera |
| `js/mercado.js` | Anaquel, carro, calculadora |
| `js/caja.js` | Pago, vuelto, boleta |
| `js/desafios.js` | Modo Desafíos (problemas no rutinarios) |
| `js/feria.js` | Feria en parejas (dos tablets por puesto) |
| `js/aula.js` | Modo aula: pantalla del profesor y de los estudiantes |
| `js/app.js` | Arranque, navegación, panel «Preparar la actividad» |
| `img/` | Monedas y billetes (únicas imágenes raster; el resto es SVG) |
| `aula/` | Servidor Python + copia del juego (respaldo del modo aula) |
| `electron/` | La app de escritorio: ventana, menú y el servidor de aula en Node |

---

## Restricciones que no se pueden romper

1. **Sin librerías ni build de JS *dentro del juego*.** Nada de npm, bundlers
   ni frameworks en `js/`: el archivo único tiene que seguir abriéndose con
   doble clic, sin nada instalado. El `package.json` de la raíz es solo la
   cáscara de escritorio (Electron); no debe entrar ni una dependencia suya en
   el juego. Si un cambio obliga a instalar algo para que el juego funcione,
   está mal encarado.
2. **Funciona sin internet.** Todo local. El modo aula usa solo la biblioteca
   estándar (Node en la app, Python en el respaldo: sin `pip install` ni
   dependencias de npm). Lo único que toca la red es la búsqueda de
   actualizaciones, y falla en silencio si no hay conexión.
3. **Formato de moneda a mano.** Usar `pesos()` y `miles()` de `util.js`, nunca
   `toLocaleString`: en las tablets del colegio devuelve `$11000` sin punto.
4. **Navegadores antiguos.** Las tablets son viejas. Evitar sintaxis posterior a
   ~2016: nada de *spread* de objeto (`{...a}`), *optional chaining* (`?.`),
   *nullish* (`??`) ni `Array.flat()`. `Object.assign` y `Object.entries` sí se
   usan y están verificados. Cada módulo va en su propio `<script>`.
5. **El diseño del dinero es intocable.** Las imágenes salieron del cuadernillo
   oficial que usa el curso; los estudiantes deben reconocer el dinero real.

---

## Decisiones pedagógicas (no son detalles de estilo)

Estas decisiones se tomaron con el profesor y **no deben revertirse sin
preguntarle**:

- **Sin cronómetro y sin ranking.** La presión de tiempo perjudica al perfil de
  este curso, y la Experiencia 3 pide justificar y comparar estrategias, no
  responder rápido. El modo aula muestra quién respondió y quién sigue
  pensando, nunca un orden de llegada.
- **El error no se castiga.** Se corrige con pistas específicas y reintentos
  ilimitados. Tras dos intentos el estudiante puede *dejar su respuesta* y
  seguir: queda anotada como «para revisar juntos».
- **Instrucciones breves y visuales.** Hay estudiantes con vocabulario
  limitado. Preferir siempre elegir/tocar antes que escribir. Por eso las
  estrategias son tarjetas ilustradas y no un campo de texto.
- **Los apoyos se retiran de a poco.** Casi todo es configurable en *Preparar
  la actividad*: subtotales, calculadora, tachado de la lista, «Te queda»,
  suma de la bandeja, exigir el cálculo del total.
- **Nada de pistas automáticas que hagan el cálculo.** Si se agrega un
  indicador nuevo, pensar si resuelve por el estudiante lo que debía calcular.
  Ya pasó dos veces (ver más abajo).

### Reglas finas que cuestan de descubrir

- **Con vuelto, la billetera NO debe permitir pagar justo** (`lista.js`:
  `generarBilleteraConVuelto` + `puedePagarJusto`). Si se puede pagar exacto, el
  estudiante se salta el cálculo del vuelto, que es lo que se ejercita. Para
  totales muy redondos ($20.000) es matemáticamente imposible impedirlo:
  ahí `armarPartida` sortea otra lista.
- **Ocultar una cifra implica ocultar todo lo que la delate.** Al apagar «Te
  queda» hubo que ocultar también la barra y el semáforo. Al quitar la suma de
  la bandeja hubo que quitar los avisos «Faltan $2.400» del botón *Pagar*, que
  daban la misma respuesta con un clic.
- **Precios por kilo múltiplos de $400 y balanza de 250 g**, para que el
  resultado siempre sea una cifra redonda. Excepción: en la feria de Botalcura
  el maíz se vende por kilos enteros (`pasoPeso`), como en la clase.
- **La feria de Botalcura usa los precios exactos de la Clase 3**: leche $900 el
  litro, huevo $220, tarro de miel $3.500, kilo de maíz $1.500, saco de papas
  $8.000. No cambiarlos.

---

## Modo aula (multijugador)

Hay **dos implementaciones del mismo servidor**, con las mismas rutas y las
mismas respuestas:

| Dónde | Cuándo se usa |
|---|---|
| `electron/servidor.cjs` | Dentro de la app de escritorio. Es el camino normal. |
| `aula/servidor.py` | Respaldo: se lanza con `Iniciar modo aula.bat` si la app falla en la sala. Necesita Python. |

**Si se toca una, hay que tocar la otra.** `pruebas/paridad-aula.js` recorre una
clase completa contra las dos y compara respuesta por respuesta; no necesita
instalar nada.

Levanta un servidor HTTP en el puerto 8080 dentro de la red del colegio. El
profesor abre una sala con código de 6 dígitos; las tablets entran por
`http://<ip>:8080`. Las tablets consultan novedades cada ~700 ms (sondeo, no
WebSockets, para no depender de nada externo).

La ventana de la app se abre en `http://<ip>:8080/`, no en `127.0.0.1`: el juego
dicta a los estudiantes lo que ve en `location.host`, así que abriéndola por la
IP de red la pantalla del profesor muestra sola la dirección correcta.

A diferencia del servidor Python, el de Node **no sirve archivos sueltos**: solo
el HTML del juego y `/api/*`. El juego es autocontenido, así que no hace falta
nada más.

Cuatro pestañas: **Desafíos**, **Ir de compras**, **En parejas**,
**Seguimiento** (+ informe imprimible).

- El juego abierto con doble clic **no muestra** el modo aula (`hayServidor()`).
- Al mandar una compra, todas las tablets reciben **la misma partida** armada
  una sola vez (lista, presupuesto y billetera idénticos), para poder comparar
  resultados en clase.
- Los alumnos **no desaparecen** de la lista si su tablet se duerme: se marcan
  «sin señal» (los navegadores frenan los temporizadores con la pantalla
  apagada) y se reconectan solos.

### Probar el modo aula

```bash
cd aula && python3 servidor.py     # y abrir http://localhost:8080
```

---

## Pruebas

No hay framework: son scripts de Node con **puppeteer-core** que manejan un
Chromium real y hacen clics de verdad. Están en `pruebas/`.

```bash
cd pruebas && npm install          # puppeteer-core + @sparticuz/chromium
node descargar-chromium.js         # deja el binario en /tmp/chromium
node regresion.js                  # flujos principales
node prueba-vuelto.js              # que no se pueda pagar justo con vuelto
node prueba-tequeda.js             # las opciones de pistas
node prueba-bandeja.js             # suma de la bandeja oculta
node aula-vuelto.js                # modo aula (requiere el servidor arriba)

cd pruebas && node paridad-aula.js # los dos servidores responden igual (sin instalar nada)
```

**Cómo se ha trabajado hasta ahora:** antes de dar por bueno un cambio se
reproduce el problema, se corrige, y se verifica con clics reales en el
navegador — no leyendo el código. Varias veces el diagnóstico «obvio» resultó
equivocado (ver abajo). Conviene mantener esa costumbre.

---

## Cosas pendientes o que conviene saber

- **La manzana marca hacia dónde va el dibujo.** El profesor entregó un dibujo
  con contorno negro grueso; los otros 56 productos son planos, sin línea. Ya
  está decidido: **el contorno se queda y son los demás los que tienen que
  parecerse a ella**, no al revés. Es trabajo de diseño pendiente, a hacer de
  una vez sobre todo el catálogo (`js/svg.js`), no producto por producto.
- **El billete de $1.000 tiene un defecto** heredado de la extracción del PDF
  original: un rectángulo gris «quemado» en el borde derecho, visible a
  resolución nativa. Ya existe una versión reparada por *inpainting* que se usó
  en el cuadernillo imprimible, pero **no se aplicó al juego**. Falta hacerlo.
- **Redes con aislamiento de clientes.** Algunas redes escolares impiden que las
  tablets vean el computador del profesor. Solución documentada: hotspot del
  celular o pedir a informática que lo desactive. No se ha probado en la sala
  real todavía.
- **Firewall de Windows:** al iniciar el servidor hay que aceptar «Redes
  privadas», o las tablets no llegan.

### Errores que ya se cometieron (para no repetirlos)

- Renderizar varias imágenes **WEBP con transparencia** juntas dispara un bug de
  Chromium que dibuja parches blancos. Se usa **PNG** en el material imprimible.
- Al agregar un indicador «útil» se resolvió sin querer el cálculo que el
  estudiante debía hacer. Pasó con «Te queda» y con la suma de la bandeja.
- Las clases CSS nuevas chocaron dos veces con las existentes (`.cuenta`,
  `.billetera`), rompiendo pantallas que ya funcionaban. Revisar antes de
  nombrar.
- Un `<input type="number">` parecía la solución para escribir cifras, pero en
  tablet no ofrece tecla de borrar coherente con el resto del juego. Se
  reemplazó por un teclado modal propio (`abrirTecladoNum` en `util.js`).

---

## Qué se querría mejorar

El profesor mencionó interés en pulir el **diseño visual**. Ideas evaluadas y
no construidas todavía, en orden de aporte:

1. **Voz que lea los enunciados** (`speechSynthesis` del propio dispositivo, sin
   internet). Es lo que más igualaría el acceso, dado el vocabulario limitado
   del curso. Riesgo: depende de que las tablets traigan voz en español.
2. **Crear desafíos propios** desde el panel del profesor, para que el material
   sirva en otras experiencias y otros años.
3. **Gimnasio de tablas de multiplicar** en contexto de dinero, con registro por
   estudiante de qué tabla falla (el documento del curso menciona esos vacíos).
