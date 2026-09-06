# Pruebas

Scripts de Node que abren el juego en un **Chromium real** y hacen clics de
verdad. No hay framework: cada archivo es autónomo e imprime ✓ / ✗.

`paridad-aula.js` es la excepción: no abre el juego, compara los dos servidores
del modo aula. No necesita instalar nada.

```bash
node paridad-aula.js              # el de la app contra el respaldo en Python
node paridad-aula.js --solo-node  # si no tienes Python a mano
```

## Preparar (una sola vez)

```bash
npm install
node descargar-chromium.js
```

Si ya tienes Chrome o Chromium instalado, puedes saltarte la descarga y
apuntar a él:

```bash
export CHROMIUM=/usr/bin/google-chrome
```

## Correr

```bash
node regresion.js         # los 4 niveles, compra completa, desafíos, teclado
node prueba-vuelto.js     # con vuelto no debe poder pagarse justo
node prueba-tequeda.js    # las opciones que ocultan pistas
node prueba-bandeja.js    # la suma de la bandeja no debe aparecer
```

**Después de tocar `electron/servidor.cjs` o `aula/servidor.py`**, corre
`node paridad-aula.js`: los dos tienen que responder exactamente igual.

El modo aula necesita el servidor corriendo aparte:

```bash
cd ../aula && python3 servidor.py &
node aula-vuelto.js
```

## Antes de dar por bueno un cambio

1. Reproducir el problema con una prueba que falle.
2. Corregir.
3. Volver a correr **todas** las pruebas: varias veces un arreglo en una
   pantalla rompió otra (nombres de clases CSS repetidos, sobre todo).
4. Reconstruir con `python3 ../construir.py`, porque las pruebas leen el
   archivo único, no las fuentes.
