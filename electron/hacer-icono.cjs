/* ============================================================================
   hacer-icono.cjs — Convierte electron/icono.svg en electron/icono.ico
   ----------------------------------------------------------------------------
   Se corre con:  npm run icono
   Usa el propio Electron para dibujar el SVG (no hace falta instalar nada más)
   y arma el .ico a mano: un ICO es una cabecera y una lista de PNG.
   ========================================================================== */

const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const SVG = path.join(__dirname, 'icono.svg');
const ICO = path.join(__dirname, 'icono.ico');
const PNG = path.join(__dirname, 'icono.png');
const TAMANOS = [256, 128, 64, 48, 32, 16];

/** Arma un .ico con varios PNG dentro (Windows los acepta desde Vista). */
function armarIco(imagenes) {
  const cabecera = Buffer.alloc(6);
  cabecera.writeUInt16LE(0, 0);                 // reservado
  cabecera.writeUInt16LE(1, 2);                 // 1 = icono
  cabecera.writeUInt16LE(imagenes.length, 4);

  const entradas = [];
  let desplazamiento = 6 + imagenes.length * 16;

  for (const img of imagenes) {
    const e = Buffer.alloc(16);
    e.writeUInt8(img.lado >= 256 ? 0 : img.lado, 0);   // 0 quiere decir 256
    e.writeUInt8(img.lado >= 256 ? 0 : img.lado, 1);
    e.writeUInt8(0, 2);                          // sin paleta
    e.writeUInt8(0, 3);                          // reservado
    e.writeUInt16LE(1, 4);                       // planos
    e.writeUInt16LE(32, 6);                      // bits por pixel
    e.writeUInt32LE(img.datos.length, 8);
    e.writeUInt32LE(desplazamiento, 12);
    desplazamiento += img.datos.length;
    entradas.push(e);
  }

  return Buffer.concat([cabecera, ...entradas, ...imagenes.map(i => i.datos)]);
}

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const svg = fs.readFileSync(SVG, 'utf8');

  /* Se dibuja UNA vez a 256 y se reescala: crear ventanas de 16 px falla en
     Windows, y de todos modos el reescalado de Electron es mejor que volver a
     rasterizar el SVG a tamaños diminutos. */
  const lado = 256;
  const v = new BrowserWindow({
    width: lado, height: lado, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false }
  });

  const pagina = `<!doctype html><meta charset="utf-8">
    <style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}
    svg{display:block;width:${lado}px;height:${lado}px}</style>${svg}`;
  const temporal = path.join(app.getPath('temp'), 'mercado-icono.html');
  fs.writeFileSync(temporal, pagina, 'utf8');
  await v.loadFile(temporal);
  await new Promise(r => setTimeout(r, 400));

  const foto = await v.webContents.capturePage();
  v.destroy();
  fs.unlinkSync(temporal);

  const imagenes = TAMANOS.map(t => {
    const datos = (t === lado ? foto : foto.resize({ width: t, height: t, quality: 'best' })).toPNG();
    console.log(`  ${t}×${t}  ${datos.length} bytes`);
    return { lado: t, datos };
  });

  fs.writeFileSync(PNG, imagenes[0].datos);
  fs.writeFileSync(ICO, armarIco(imagenes));
  console.log(`
Listo: electron/icono.ico (${TAMANOS.join(', ')} px) y electron/icono.png`);
  app.quit();
}).catch(e => { console.error(e); app.exit(1); });
