# Mercado · Manejo de dinero

Juego educativo para practicar el manejo del peso chileno: hacer las compras
con un presupuesto y pagar en la caja con billetes y monedas de verdad.

Basado en el *Cuadernillo de manejo de dinero* (teocognitiva, Terapia Ocupacional).

---

## Cómo abrirlo

Hay dos maneras, y las dos sirven.

### 1. La aplicación (recomendada en el computador del profesor)

Instala **Mercado** con el instalador (`Mercado Setup <versión>.exe`) y ábrelo
desde el escritorio, como cualquier programa.

- No hay que instalar Python ni abrir ventanas negras.
- El **modo aula ya viene encendido**: al abrir la app, las tablets pueden
  conectarse enseguida. La dirección que tienen que escribir aparece en
  *Modo aula*, y también en el menú **Clase → Copiar la dirección**.
- Se **actualiza sola**: cuando el computador tenga internet, avisa si hay una
  versión nueva. El juego sigue funcionando sin conexión.

> La primera vez, Windows preguntará si permites la conexión: elige
> **Redes privadas** y acepta. Sin eso las tablets no llegan.

### 2. El archivo único (pendrive, o cualquier otro computador)

**Abre `Mercado (archivo unico).html` con doble clic.** Eso es todo.

Ese archivo lleva dentro los estilos, el código y las imágenes del dinero, así
que funciona aunque lo muevas solo a otra carpeta, al escritorio o a un pendrive.

> **Si antes lo viste sin colores y con los botones muertos**, fue porque el
> `index.html` se abrió sin sus carpetas `css/` y `js/` al lado — algo que pasa
> típicamente al hacer doble clic dentro del ZIP sin descomprimirlo primero.
> El archivo único elimina ese problema de raíz.

Junto a ese archivo está el mismo juego separado en `index.html`, `css/` y
`js/`, para editarlo. Después de modificarlo, `python3 construir.py` regenera el
archivo único (y actualiza la copia que usa el modo aula).

---

## Modo aula (opcional)

En la aplicación viene **ya incluido**: se enciende solo al abrirla. La carpeta
`aula/` guarda el respaldo en Python, por si algún día la app fallara en la sala
(menú **Clase → Abrir la carpeta de respaldo**).

Permite conectar varias tablets a la misma clase: tú
proyectas o miras tu tablero, y los estudiantes trabajan desde sus dispositivos.
Se dirigen **las dos actividades**: los desafíos y las compras. Al mandar una
compra, todas las tablets reciben la misma lista, el mismo presupuesto y los
mismos billetes, así los resultados se pueden comparar en clase.
Todo dentro de la red del colegio, sin internet. Con la aplicación no hace falta
instalar nada; el camino con Python está explicado paso a paso en
`aula/LEEME - modo aula.md`.

Tiene cuatro pestañas: **Desafíos**, **Ir de compras**, **En parejas** y
**Seguimiento**.

**En parejas** arma puestos de feria: uno vende y cobra, el otro compra y
revisa el vuelto, y los roles rotan. Los puestos se pueden armar al azar o
**elegidos por el profesor**, para juntar a propósito a quien le cuesta más
con quien le va mejor. El presupuesto de cada comprador es **ajustable**, y si
el vendedor cobra mal, el comprador puede devolver el cobro para que se
recalcule, sin quedar atrapado sin poder pagar. Cuando los dos números no calzan tienen
que ponerse de acuerdo hablando, que es justo la argumentación que pide la
Experiencia 3.

Desde **Seguimiento** se genera un **informe imprimible** con todo lo trabajado
—incluido qué conviene retomar la próxima clase—, para guardar como PDF o como
archivo. Sirve de evidencia del OA 7.

El tablero **no ordena ni puntúa**: muestra quién ya respondió y quién sigue
pensando, y al revelar, todas las respuestas juntas con la estrategia que marcó
cada uno.

El juego suelto sigue funcionando con doble clic, sin servidor. Si se abre así,
el modo aula ni aparece.

## Dos modos

**🛒 Ir de compras** — Lista, presupuesto, carro y pago en la caja. Problemas
rutinarios: automatizar la suma, la multiplicación y el vuelto.

**🧠 Desafíos** — Once problemas **no rutinarios** tomados de la Clase 3, con
los precios de la feria del campo. Varios admiten más de una respuesta
correcta. Al resolver, el estudiante marca cómo lo pensó.

## Cómo se juega

1. **Preparar la actividad** (profesor): nivel, presupuesto, largo de la lista,
   forma de pago y qué apoyos quedan disponibles. El presupuesto y la
   cantidad de cada producto elegido a mano se escriben con un teclado
   numérico —los mismos dígitos y la misma tecla ⌫ del resto del juego—, no
   con el teclado del sistema.
2. **Mercado**: el estudiante recorre las secciones y arma su carro siguiendo
   la lista. Arriba ve en todo momento cuánta plata le queda. **En todos los
   niveles**, incluido el 1 (precio fijo), hay que sumar el total a mano y
   escribirlo antes de poder ir a pagar.
3. **Caja**: el presupuesto está convertido en billetes y monedas reales.
   Los toca para ponerlos en la bandeja y pagar.
4. **Boleta**: resumen de la compra, el vuelto y hasta tres estrellas.

## Los cuatro niveles

| Nivel | Cómo se venden los productos | Qué se practica |
|---|---|---|
| 1 · Precio fijo | Un precio por producto completo | Sumar precios |
| 2 · Por unidad | Precio por unidad × la cantidad pedida | Multiplicar |
| 3 · Por kilo | Precio por kilo, balanza de 250 en 250 g | Fracciones de kilo |
| 4 · Súper reto | Los tres modos juntos, presupuesto ajustado | Todo lo anterior |

### Calcular el total a mano, en todos los niveles

El carro no muestra el total de la compra ni, desde el nivel 2, el subtotal
de cada línea. En el nivel 1 (precio fijo) cada producto muestra su único
precio, y el estudiante suma esos precios mentalmente o con la calculadora;
desde el nivel 2 en adelante, muestra el **precio por unidad** y la
**cantidad** — por ejemplo `Paltas · $800 c/u · × 8` —, que es la información
que necesita para multiplicar y sumar. El estudiante escribe el resultado y
pulsa *Comprobar*. La caja no se abre hasta que acierta.

No hay castigo por equivocarse: puede reintentar las veces que quiera y la
pista le dice si se pasó o se quedó corto. Si cambia algo del carro, el total
vuelve a pedirse, porque ya no es el mismo.

El profesor puede ajustar esto en *Preparar la actividad* → *Calcular el
total a mano*: **Siempre** (todos los niveles, la opción de por defecto),
**Desde el nivel 2** (como antes) o **Nunca**.

El profesor puede exigirlo siempre, nunca, o dejarlo desde el nivel 2.

---

## Modo Desafíos y la Experiencia 3

Pensado para el **OA 7** y los indicadores de la Experiencia 3. Cada desafío
sale directo de la Clase 3, con los precios de la feria sin alterar: leche $900
el litro, huevo $220, tarro de miel $3.500, kilo de maíz $1.500, saco de papas
$8.000.

| Desafío | Qué pone en juego |
|---|---|
| El desayuno de la tía Gloria | Multiplicar y sumar |
| ¿Qué cuesta más? | Comparar cantidades distintas |
| Huevos por un tarro de miel | Repartir, con resto |
| Lo que le sobra a Sebastián | Restar del total |
| ¿Qué puede comprar Sofía? | **Muchas respuestas correctas** |
| La compra de Isaías | Dos multiplicaciones y una suma |
| Sube el precio de la leche | Razonar antes de calcular |
| Gastar la mayor cantidad posible | **Optimizar, probar y corregir** |
| Las canastas del curso (×3) | Recursos limitados, valor y cuántas alcanzan |

**Los problemas abiertos no se corrigen contra una cifra.** En «¿qué puede
comprar Sofía?» vale cualquier compra bajo $5.000; en «gastar lo máximo» el
juego acepta la compra y dice cuánto sobró, invitando a afinar. Eso es lo que
hace que el problema sea no rutinario: importa la estrategia, no acertar un
número.

**Justificar sin escribir.** Al resolver aparecen ocho tarjetas —*sumé de a
poco, multipliqué, resté del total, repartí, lo hice con las monedas, lo
dibujé, probé y corregí, lo pensé en la cabeza*— y se marcan las que se usaron.
Cubre «justifica el procedimiento» y «analiza distintas alternativas» sin
exigir redacción, que es una barrera real para varios estudiantes del curso.

**Se puede dejar una respuesta equivocada.** Tras dos intentos aparece *Dejar
mi respuesta y seguir*: queda anotada, el estudiante ve la correcta junto a la
suya con el procedimiento explicado, y puede marcar igual cómo lo pensó. En el
modo aula el profesor la ve como «para revisar juntos». Quedar atascado hasta
acertar frustra y enseña poco; comparar el propio camino con el correcto
enseña bastante. Se desactiva en *Preparar la actividad*.

**Pistas que no resuelven.** Se piden a voluntad o aparecen solas al segundo
intento fallido. Orientan el camino sin dar el resultado, en línea con el
aprendizaje por ensayo y error.

**Modo proyección.** El botón «Letra grande» agranda todo para mostrar un
problema al curso completo y discutirlo, mientras trabajan con sus pizarras y
el dinero ficticio. El juego no reemplaza esa parte de la clase: la acompaña.

### Una advertencia sobre la calculadora

Si el objetivo del momento es **cálculo mental**, conviene dejarla apagada. Se
desactiva en *Preparar la actividad* y es útil sobre todo para comprobar al
final, no para resolver.

## Los dos catálogos

**Mercado** — 47 productos de supermercado en 7 secciones.

**Feria de Botalcura** — Los cinco productos de la clase con sus precios
exactos, más cinco del campo agregados para que cada nivel tenga variedad
(con solo cinco, el nivel del kilo se quedaba con uno). Aquí el peso se mide en
**kilos enteros**, como en la clase, no en cuartos de kilo.

Se elige en *Preparar la actividad*.

## Diseño

Dirección visual de aplicación infantil sobre la feria libre chilena: fondo
celeste pastel, tarjetas blancas muy redondeadas, toldos a rayas sobre cada
anaquel, cajones de madera para los productos y precios en carteles de cartón.

Los botones tienen relieve y se hunden al presionarlos. Nada depende de pasar
el mouse por encima, las zonas táctiles nunca bajan de 56 px y se eliminó el
retardo de 300 ms al tocar, así que funciona igual con el dedo que con mouse.

## Decisiones que vale la pena conocer

**El presupuesto es dinero, no un número.** Al empezar se reparte en billetes y
monedas concretas. El reparto siempre incluye una combinación que permite pagar
la cuenta exacta, así que el pago justo nunca es imposible.

**La billetera trae piezas variadas.** Un presupuesto de $30.000 no se entrega
como un billete de $20.000 más uno de $10.000: eso deja casi nada que decidir
en la caja. Se reparte en piezas medianas, de modo que existan muchas
combinaciones posibles para llegar al total. El reparto siempre incluye una
combinación que permite pagar exacto.

**La calculadora vive en la columna izquierda**, bajo la lista, para que nunca
tape el carro. Tiene las cuatro operaciones (`+`, `−`, `×`, `÷`) y `=`, y
respeta la prioridad: `6 × 200 + 1.500` da $2.700 y no $10.200. La tecla **⌫**
borra el último número, para no rehacer toda la cuenta por un error de tecleo;
está también en los teclados de los desafíos y del vuelto. Si una división
no da exacta, muestra los decimales con coma, como se escriben en Chile
(`1.000 ÷ 3 = $333,33`).

**Los precios por kilo son múltiplos de $400.** Con la balanza avanzando de 250
en 250 gramos, cada paso da siempre una cifra redonda, sin decimales imposibles
de calcular a mano.

**El punto de miles se arma a mano.** No se usa `toLocaleString`, porque depende
de datos de idioma que algunas tablets no traen y los montos aparecerían como
`$11000`. Leer `$11.000` es justamente parte de lo que se está enseñando.

**El error se corrige, no se castiga.** Si algo no cabe en el presupuesto, el
producto se sacude y avisa. Todo se puede sacar del carro y de la bandeja.

**La devolución es específica.** La boleta dice qué faltó, qué sobró, por cuánto
se pasó del presupuesto y en cuánto se equivocó el vuelto.

**«Te queda» se puede apagar.** Arriba, el juego muestra en todo momento
cuánto dinero le va quedando. Eso es un apoyo útil al principio, pero también
una pista: el estudiante ve si le alcanza sin necesidad de calcular. Con la
casilla *Mostrar «Te queda» mientras compra* apagada, solo ve cuánto dinero
traía —el rótulo cambia a «Traes»— y desaparecen también la barra y el
semáforo, que delataban lo mismo sin números.

**La suma de la bandeja está oculta.** En la caja ya no aparece el contador
en vivo del dinero que se va dejando («Puesto en la bandeja $10.000»): esa
cifra hacía la suma por el estudiante. En su lugar hay un recordatorio neutro.
Los avisos del botón *Pagar* tampoco dan la diferencia exacta —dicen «Todavía
no alcanza» en vez de «Faltan $2.400»—, porque si no bastaría apretar el botón
una vez para que el juego resolviera la resta. Se puede volver a encender con
la casilla *Mostrar la suma de la bandeja en la caja*.

**Con vuelto, el vuelto es obligatorio.** Cuando la forma de pago es *Con
vuelto*, la billetera se arma de manera que **no exista ninguna combinación
que dé justo la cuenta**. Antes podía ocurrir que los billetes permitieran
pagar exacto y el estudiante se saltara el cálculo del vuelto, que es
justamente lo que la actividad ejercita. El vuelto que resulta es moderado
(mediana de unos $400) y la billetera conserva monedas y billetes variados.

En algunos totales muy «redondos» —$20.000 exactos, por ejemplo— es
matemáticamente imposible impedir el pago justo, porque esos montos se
alcanzan con casi cualquier combinación. En esos casos el juego sortea otra
lista de compras, que es lo único que puede cambiar sin alterar la actividad.

**Los apoyos se pueden retirar.** Subtotales, calculadora, bloqueo de
presupuesto y tachado automático de la lista se activan por separado, para ir
aumentando la autonomía. Con el tachado desactivado, cada línea de la lista se
vuelve tocable y es el estudiante quien va marcando lo que ya consiguió —
revisar la propia lista pasa a ser parte del ejercicio. También puede
desmarcar si se equivocó.

**La lista se puede armar a mano.** En *Preparar la actividad* el profesor
elige qué productos entran y, además, cuántas unidades o cuántos gramos se
piden de cada uno. Lo que deje en «al azar» se sortea en cada partida. En el
súper reto puede además decidir si un producto se vende por envase, por unidad
o por kilo. El panel muestra un ejemplo del total que costaría esa lista.

Si al cambiar de nivel algún producto elegido ya no se vende de la forma que
ese nivel usa —el pescado solo va por kilo, por ejemplo—, se descarta y el
panel lo avisa, en lugar de dejar una lista que no se puede jugar.

**Sin cronómetro.** El tiempo bajo presión perjudica a los perfiles a los que
apunta este material.

## Compatibilidad

Probado contra un motor de 2016 para asegurar que funcione en tablets escolares
antiguas. Cada módulo va en su propio bloque de código: si un navegador muy
viejo no entendiera uno, el resto sigue funcionando en lugar de caerse entero.

## Pantalla

En pantallas de computador y tablet el mercado se comporta como una aplicación:
la barra del presupuesto, la lista, la calculadora y el carro quedan siempre a
la vista, y solo el anaquel se desplaza por dentro. No hay que mover la página
para encontrar los botones. En pantallas angostas todo se apila en una columna.

## Catálogo

47 productos repartidos en 7 secciones — frutas y verduras, panadería, lácteos,
carnicería, abarrotes, bebidas y aseo — elegidos sobre la canasta básica
chilena. Todos dibujados en SVG.

## Imágenes

Casi todo es SVG generado en código. **Las únicas imágenes rasterizadas son las
diez denominaciones**, extraídas del PDF original en PNG con transparencia,
porque el diseño del dinero debía conservarse sin alteraciones.

## Sin datos ni cuentas

No hay usuarios, puntajes guardados ni base de datos. Lo único que se recuerda
entre sesiones es la configuración del profesor, guardada en el navegador. Si el
navegador bloquea ese guardado, el juego funciona igual.


---

## Verificación

Cada versión se revisa automáticamente antes de entregarse, con un navegador
Chromium real controlado por código:

- **Lógica**: precios, totales, presupuestos y billeteras en miles de partidas.
- **Flujo**: las cuatro dificultades jugadas de punta a punta.
- **Maquetación**: seis tamaños de pantalla, desde netbook 1024×768 hasta
  teléfono. Se comprueba que no haya desplazamiento horizontal, que todo quepa
  sin mover la página, que la calculadora no se superponga al carro y que
  ninguna zona táctil baje de 44 px.
- **Clics reales**: una partida completa tocando los botones como lo haría un
  estudiante, incluida la calculadora y el pago con monedas y billetes.
- **Contraste**: todo el texto cumple el mínimo WCAG AA.

La carpeta `capturas/` muestra cómo se ve cada pantalla.
