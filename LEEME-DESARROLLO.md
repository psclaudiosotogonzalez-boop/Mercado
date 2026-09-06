# Para quien retome el desarrollo

Empieza por **`CLAUDE.md`**: ahí está el contexto del proyecto, las
restricciones que no se pueden romper y las decisiones pedagógicas que se
tomaron con el profesor.

```bash
python3 construir.py     # reconstruye «Mercado (archivo unico).html»
npm install              # solo la primera vez, para la app de escritorio
npm start                # abre la app
npm run app              # genera el instalador en instalador/

cd pruebas && npm install && node descargar-chromium.js
node regresion.js
```

- `Mercado (archivo unico).html` es **generado**. No editarlo a mano.
- Las fuentes están en `index.html`, `css/` y `js/`, y **no dependen de npm**:
  el archivo único tiene que seguir abriéndose con doble clic.
- `electron/` es solo la cáscara de escritorio: ventana, menú, actualizaciones
  y el servidor de aula en Node (`electron/servidor.cjs`).
- El respaldo del modo aula vive en `aula/` (servidor Python, sin dependencias).
  Las dos implementaciones tienen que comportarse igual.
- Para publicar una versión: sube el número en `package.json` y corre
  `npm run publicar` (necesita `GH_TOKEN` con permiso sobre el repositorio).
