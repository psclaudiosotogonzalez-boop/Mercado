/* Deja un Chromium utilizable en /tmp/chromium (o donde diga CHROMIUM).
   Se usa una sola vez, después de `npm install`. */
const chromium = require('@sparticuz/chromium').default;

(async () => {
  try {
    const ruta = await chromium.executablePath();
    console.log('Chromium listo en:', ruta);
    console.log('Si tu sistema ya trae Chrome o Chromium, también puedes usarlo:');
    console.log('  CHROMIUM=/ruta/a/chrome node regresion.js');
  } catch (e) {
    console.error('No se pudo preparar Chromium:', e.message);
    console.error('Alternativa: apunta a un Chrome ya instalado con la variable CHROMIUM.');
    process.exit(1);
  }
})();
