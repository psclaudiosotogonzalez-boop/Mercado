/* ============================================================================
   main.cjs — La aplicación de escritorio
   ----------------------------------------------------------------------------
   Envuelve el mismo juego de siempre. El HTML no cambió ni una línea: la app
   levanta el servidor de aula (servidor.cjs) y abre la ventana apuntando a él.

   Por qué la ventana se abre en la dirección de red y no en 127.0.0.1:
   el juego decide si muestra el modo aula mirando su propio protocolo
   (`hayServidor()` en aula.js) y dicta a los estudiantes lo que ve en
   `location.host`. Abriéndola ya en `http://<ip>:8080/`, la pantalla del
   profesor muestra sola la dirección que las tablets tienen que escribir, sin
   tocar el juego.

   Si el servidor no logra arrancar, la ventana carga el HTML directamente desde
   el disco: se pierde el modo aula, pero el juego sigue funcionando entero.
   ========================================================================== */

const { app, BrowserWindow, Menu, dialog, shell, clipboard, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { iniciarServidor } = require('./servidor.cjs');

const JUEGO = path.join(__dirname, '..', 'Mercado (archivo unico).html');
/* La carpeta de respaldo con el servidor en Python y su .bat. Empaquetada va
   fuera del asar (extraResources) para que el profesor pueda abrirla. */
const CARPETA_AULA = app.isPackaged
  ? path.join(process.resourcesPath, 'aula')
  : path.join(__dirname, '..', 'aula');

let ventana = null;
let servidor = null;

/* Una sola copia a la vez: dos ventanas se pelearían el puerto 8080 y el
   profesor terminaría dictando una dirección que no es.

   Si esta es la segunda copia hay que salir SIN arrancar nada: app.quit() no
   impide que `whenReady` alcance a correr, y la segunda copia llegaba a
   levantar un servidor en otro puerto antes de cerrarse. */
const soyLaPrimera = app.requestSingleInstanceLock();
if (!soyLaPrimera) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!ventana) return;
    if (ventana.isMinimized()) ventana.restore();
    ventana.focus();
  });
}

/* --- Actualizaciones ------------------------------------------------------
   Se publican en GitHub Releases (ver "publish" en package.json). El juego no
   necesita internet para nada; esto solo mira si hay una versión nueva cuando
   el computador está conectado, y si no lo está, falla en silencio. */
function buscarActualizaciones(aviso) {
  let autoUpdater;
  try {
    autoUpdater = require('electron-updater').autoUpdater;
  } catch (e) {
    if (aviso) dialog.showMessageBox(ventana, { message: 'No pude revisar si hay actualizaciones.' });
    return;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.on('update-not-available', () => {
    if (aviso) {
      dialog.showMessageBox(ventana, {
        type: 'info', title: 'Mercado',
        message: 'Ya tienes la última versión.',
        detail: 'Versión ' + app.getVersion(), buttons: ['Cerrar']
      });
    }
  });
  autoUpdater.on('error', err => {
    if (aviso) {
      dialog.showMessageBox(ventana, {
        type: 'info', title: 'Mercado',
        message: 'No pude revisar si hay actualizaciones.',
        detail: 'Puede que este computador no tenga internet ahora. El juego funciona igual.\n\n' + (err && err.message ? err.message : ''),
        buttons: ['Cerrar']
      });
    }
  });
  autoUpdater.checkForUpdatesAndNotify().catch(() => { /* sin internet: da igual */ });
}

/* --- Menú ----------------------------------------------------------------- */
function montarMenu(datos) {
  const direccion = datos && datos.ip ? `http://${datos.ip}:${datos.puerto}` : null;

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Juego',
      submenu: [
        { label: 'Volver a cargar', accelerator: 'F5', click: () => ventana && ventana.reload() },
        { type: 'separator' },
        { label: 'Imprimir…', accelerator: 'CmdOrCtrl+P', click: () => ventana && ventana.webContents.print() },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Pantalla completa', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Agrandar', role: 'zoomIn' },
        { label: 'Achicar', role: 'zoomOut' },
        { label: 'Tamaño normal', role: 'resetZoom' }
      ]
    },
    {
      label: 'Clase',
      submenu: [
        {
          label: direccion ? `Copiar la dirección para las tablets (${direccion})` : 'Sin red: las tablets no pueden conectarse',
          enabled: !!direccion,
          click: () => {
            clipboard.writeText(direccion);
            dialog.showMessageBox(ventana, {
              type: 'info', title: 'Mercado',
              message: 'Dirección copiada',
              detail: `En las tablets hay que escribir:\n\n${direccion}\n\nEl código de la clase aparece en «Modo aula».`,
              buttons: ['Cerrar']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Abrir la carpeta de respaldo (servidor en Python)',
          click: () => shell.openPath(CARPETA_AULA)
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        { label: 'Buscar actualizaciones…', click: () => buscarActualizaciones(true) },
        { type: 'separator' },
        {
          label: 'Acerca de Mercado',
          click: () => dialog.showMessageBox(ventana, {
            type: 'info', title: 'Mercado',
            message: 'Mercado · Manejo de dinero chileno',
            detail: [
              'Versión ' + app.getVersion(),
              'Escuela Rural Osvaldo Hiriart Corvalán · Botalcura',
              '',
              datos && datos.ip
                ? `Modo aula sirviendo en ${direccion}`
                : 'Sin red disponible: el modo aula no está sirviendo.',
              '',
              'Funciona sin internet.'
            ].join('\n'),
            buttons: ['Cerrar']
          })
        },
        { type: 'separator' },
        { label: 'Herramientas de desarrollo', accelerator: 'CmdOrCtrl+Shift+I', click: () => ventana && ventana.webContents.toggleDevTools() }
      ]
    }
  ]));
}

/* --- Ventana -------------------------------------------------------------- */
function crearVentana(datos) {
  ventana = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 620,
    show: false,
    backgroundColor: '#EAF4FF',     // el mismo --cielo del juego, para que no parpadee en blanco
    title: 'Mercado',
    icon: path.join(__dirname, 'icono.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });

  ventana.once('ready-to-show', () => {
    ventana.maximize();             // en la sala casi siempre se proyecta
    ventana.show();
  });

  /* Los enlaces externos, si algún día hubiera, van al navegador del sistema y
     no reemplazan la ventana del juego. */
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (datos) ventana.loadURL(datos.url);
  else ventana.loadFile(JUEGO);

  ventana.on('closed', () => { ventana = null; });
}

/* --- Arranque ------------------------------------------------------------- */
app.whenReady().then(async () => {
  if (!soyLaPrimera) return;              // ya hay una copia abierta: no tocar nada

  /* El informe de la clase se baja como archivo: que el profesor elija dónde,
     en vez de que aparezca sin más en Descargas. */
  session.defaultSession.on('will-download', (ev, item) => {
    item.setSaveDialogOptions({
      title: 'Guardar el informe de la clase',
      filters: [{ name: 'Página web', extensions: ['html'] }]
    });
  });

  let datos = null;
  try {
    datos = await iniciarServidor({
      juegoHtml: fs.readFileSync(JUEGO, 'utf8'),
      puerto: 8080
    });
    servidor = datos;
    console.log(`[mercado] modo aula en ${datos.url}`);
  } catch (e) {
    console.error('[mercado] no pude levantar el modo aula:', e && e.message);
    dialog.showMessageBox({
      type: 'warning', title: 'Mercado',
      message: 'El modo aula no pudo arrancar.',
      detail: 'El juego funciona igual, pero las tablets no podrán conectarse.\n\n' +
              (e && e.message ? e.message : ''),
      buttons: ['Seguir igual']
    });
  }

  montarMenu(datos);
  crearVentana(datos);

  /* Un rato después de abrir, para no competir con la carga del juego */
  setTimeout(() => buscarActualizaciones(false), 8000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana(datos);
  });
});

app.on('window-all-closed', async () => {
  if (servidor && servidor.detener) await servidor.detener();
  app.quit();
});
