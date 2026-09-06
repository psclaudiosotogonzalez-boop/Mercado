/* ============================================================================
   svg.js — Ilustraciones de los productos
   ----------------------------------------------------------------------------
   Todas las ilustraciones son SVG generado en código: sin imágenes externas,
   escalables y livianas. Estilo común: formas planas, esquinas suaves, un
   brillo claro y una sombra de apoyo, dentro de un lienzo de 100 × 100.

   (Las ÚNICAS imágenes rasterizadas del proyecto son las monedas y billetes,
   extraídos del cuadernillo original porque su diseño debe conservarse.)
   ========================================================================== */

/* Sombra de apoyo común a todos los productos */
const PISO = '<ellipse cx="50" cy="90" rx="30" ry="5" fill="#000" opacity=".08"/>';

/** Envuelve el contenido en un <svg> con el lienzo estándar. */
function svg(inner) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${PISO}${inner}</svg>`;
}

/* --- Dibujos, uno por producto -------------------------------------------- */
const DIBUJOS = {

  /* ---------- Frutas y verduras ---------- */
  /* La manzana viene de un dibujo que trajo el profesor: trazo negro grueso,
     rojo plano y dos hojas. Redibujada en SVG para que siga siendo liviana y
     escalable como el resto del catálogo. */
  manzana: () => svg(`
    <g fill="none" stroke="#000" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round">
      <path d="M50 35C45 29 35 26 29 29 20 33 16 45 18 58c2 14 9 27 17 31 4 2 9 1 12-1 1.5-1 3.5-1 5 0 3 2 8 3 12 1 8-4 15-17 17-31 2-13-2-25-11-29-6-3-16 0-21 6z" fill="#ED2024"/>
      <path d="M48 34 54 20l6-8 6 4-8 8-5 11z" fill="#A75E30"/>
      <path d="M48 30c-10 0-19-4-23-11-3-5-3-9-2-10 9 0 18 4 22 11 2 4 3 8 3 10z" fill="#9BCB3C"/>
      <path d="M58 24c5-7 13-11 20-11 4 0 7 2 7 3-3 6-11 10-19 9-4 0-7 0-8-1z" fill="#9BCB3C"/>
      <path d="M29 13c4 6 10 12 16 15M64 20c5-3 11-4 16-3" stroke-width="1.9"/>
    </g>`),

  platano: () => svg(`
    <path d="M24 22c-5 24 6 46 34 52 6 1 9-3 8-7-24-6-34-24-32-45 0-4-9-4-10 0z" fill="#C88C15"/>
    <path d="M32 20c-5 24 6 45 34 51 6 1 9-3 8-7-24-6-34-23-32-44 0-4-9-4-10 0z" fill="#E3A81C"/>
    <path d="M40 18c-5 24 6 45 34 51 6 1 9-3 8-7-24-6-34-23-32-44 0-4-9-4-10 0z" fill="#F5C63D"/>
    <path d="M44 26c-2 18 7 32 26 38" stroke="#FBE49B" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M20 20c0-5 5-8 12-8h14c6 0 9 3 8 8l-1 4H21z" fill="#7D5A18"/>
    <path d="M74 66c6-1 9 2 8 6-1 4-6 6-10 5z" fill="#7D5A18"/>
    <path d="M66 71c5-1 8 1 7 4" stroke="#5C420F" stroke-width="2" fill="none"/>`),

  tomate: () => svg(`
    <circle cx="50" cy="56" r="28" fill="#DE3B2C"/>
    <path d="M28 48c4-10 13-16 22-16 5 0 9 1 13 4-6-2-24-1-35 12z" fill="#F05B45"/>
    <path d="M50 30c-3-6-10-8-10-8s0 6 4 9c-6-3-13-1-13-1s4 6 10 6c-4 2-6 6-6 6s8 1 12-2c2 3 6 3 6 3s4 0 6-3c4 3 12 2 12 2s-2-4-6-6c6 0 10-6 10-6s-7-2-13 1c4-3 4-9 4-9s-7 2-10 8z" fill="#4E9E5B"/>
    <ellipse cx="38" cy="50" rx="5" ry="7" fill="#fff" opacity=".3" transform="rotate(-20 38 50)"/>`),

  papa: () => svg(`
    <ellipse cx="34" cy="62" rx="20" ry="15" fill="#B98A55" transform="rotate(-12 34 62)"/>
    <ellipse cx="66" cy="64" rx="18" ry="14" fill="#A87A47" transform="rotate(14 66 64)"/>
    <ellipse cx="50" cy="40" rx="21" ry="16" fill="#C69965" transform="rotate(-6 50 40)"/>
    <circle cx="44" cy="36" r="2.2" fill="#8A6538"/><circle cx="56" cy="44" r="2" fill="#8A6538"/>
    <circle cx="30" cy="60" r="2" fill="#8A6538"/><circle cx="70" cy="66" r="2" fill="#8A6538"/>
    <ellipse cx="44" cy="33" rx="7" ry="4" fill="#fff" opacity=".25" transform="rotate(-6 44 33)"/>`),

  zanahoria: () => svg(`
    <path d="M50 88c-4 0-16-32-16-44 0-8 7-13 16-13s16 5 16 13c0 12-12 44-16 44z" fill="#E8802B"/>
    <path d="M50 31c-9 0-16 5-16 13 0 10 8 32 13 41-2-14-6-34-6-42 0-6 4-10 9-12z" fill="#F59A4C"/>
    <path d="M42 48h16M40 60h20M44 72h12" stroke="#C4661C" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M50 31c-2-8-10-13-10-13s-2 9 4 13c-8-3-16 2-16 2s7 7 16 5c-3 2-4 5-4 5h20s-1-3-4-5c9 2 16-5 16-5s-8-5-16-2c6-4 4-13 4-13s-8 5-10 13z" fill="#4E9E5B"/>`),

  naranja: () => svg(`
    <circle cx="50" cy="55" r="29" fill="#EE8A20"/>
    <path d="M27 44c5-10 14-16 24-16 5 0 10 2 14 5-8-3-27-2-38 11z" fill="#FBA83F"/>
    <circle cx="50" cy="55" r="29" fill="none" stroke="#D2731A" stroke-width="1.5" opacity=".5"/>
    <circle cx="42" cy="47" r="1.6" fill="#D2731A"/><circle cx="58" cy="52" r="1.6" fill="#D2731A"/>
    <circle cx="48" cy="66" r="1.6" fill="#D2731A"/><circle cx="63" cy="66" r="1.6" fill="#D2731A"/>
    <path d="M50 27c0-4 4-6 4-6s2 4 0 7z" fill="#7A4A22"/>
    <path d="M54 24c6-6 14-4 14-4s-2 9-9 9c-3 0-5-2-5-5z" fill="#4E9E5B"/>`),

  palta: () => svg(`
    <path d="M50 20c-12 0-20 12-20 26 0 17 9 30 20 30s20-13 20-30c0-14-8-26-20-26z" fill="#4B7A2C"/>
    <path d="M50 26c-9 0-15 10-15 22 0 14 7 25 15 25s15-11 15-25c0-12-6-22-15-22z" fill="#8DB84A"/>
    <ellipse cx="50" cy="56" rx="11" ry="13" fill="#9A6B34"/>
    <ellipse cx="46" cy="51" rx="4" ry="5" fill="#B98A55"/>
    <path d="M40 34c2-5 6-8 6-8" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>`),

  lechuga: () => svg(`
    <circle cx="50" cy="56" r="30" fill="#3F8C3C"/>
    <path d="M50 26c-14 0-26 9-29 22 6-9 15-11 21-8-4-7 1-13 8-14z" fill="#63B04B"/>
    <path d="M50 28c-13 0-24 11-24 26 0 8 4 15 10 20-3-8-2-16 3-20-5-6-3-14 3-17-2-6 3-9 8-9z" fill="#7CC65C"/>
    <path d="M64 34c8 4 13 13 13 22 0 9-4 17-11 21 4-8 4-17 0-23 4-6 2-15-2-20z" fill="#63B04B"/>
    <path d="M42 44c4 6 4 16 0 24M58 44c-4 6-4 16 0 24" stroke="#2F6B2C" stroke-width="2" opacity=".4" fill="none"/>`),

  /* ---------- Panadería ---------- */
  marraqueta: () => svg(`
    <path d="M18 58c0-16 13-26 32-26s32 10 32 26c0 10-8 16-32 16S18 68 18 58z" fill="#C98A2E"/>
    <path d="M18 58c0-16 13-26 32-26s32 10 32 26c0-6-14-10-32-10s-32 4-32 10z" fill="#E2A952"/>
    <path d="M50 32v42" stroke="#8E5D18" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M34 36c-3 6-3 26 0 34M66 36c3 6 3 26 0 34" stroke="#A96F1F" stroke-width="2.5" opacity=".7" fill="none"/>
    <ellipse cx="34" cy="46" rx="8" ry="4" fill="#fff" opacity=".25"/>`),

  panmolde: () => svg(`
    <path d="M22 44c0-12 12-18 28-18s28 6 28 18v28c0 4-3 6-7 6H29c-4 0-7-2-7-6z" fill="#E2B36A"/>
    <path d="M22 46c0-12 12-20 28-20-14 8-14 34-14 52h-7c-4 0-7-2-7-6z" fill="#F0CB92"/>
    <path d="M36 30c4-3 9-4 14-4 16 0 28 6 28 18v6c-6-8-22-14-42-20z" fill="#C99A50"/>
    <path d="M44 34v44M58 32v46M70 36v42" stroke="#C99A50" stroke-width="2" opacity=".6"/>`),

  berlin: () => svg(`
    <ellipse cx="50" cy="56" rx="30" ry="24" fill="#D79B45"/>
    <ellipse cx="50" cy="50" rx="30" ry="22" fill="#EFB865"/>
    <path d="M22 50c6-9 16-14 28-14s22 5 28 14c-4-14-15-20-28-20s-24 6-28 20z" fill="#F7D296"/>
    <path d="M24 44c8 3 18 4 26 4s18-1 26-4" stroke="#C4802F" stroke-width="2.5" fill="none" opacity=".6"/>
    <circle cx="38" cy="42" r="2" fill="#fff"/><circle cx="52" cy="38" r="2" fill="#fff"/>
    <circle cx="64" cy="44" r="2" fill="#fff"/><circle cx="45" cy="48" r="2" fill="#fff"/>
    <circle cx="60" cy="50" r="2" fill="#fff"/>`),

  empanada: () => svg(`
    <path d="M22 62c0-20 13-34 28-34s28 14 28 34c0 6-12 10-28 10s-28-4-28-10z" fill="#D9A155"/>
    <path d="M28 56c2-16 11-28 22-28-8 6-13 20-14 36-5-2-8-5-8-8z" fill="#EDBE79"/>
    <path d="M22 62c4-4 10-6 14-2 4-4 10-4 14 0 4-4 10-4 14 0 4-4 10-2 14 2v6c0 6-12 10-28 10s-28-4-28-10z" fill="#C48A3C"/>
    <path d="M40 40c6-2 14-2 20 0" stroke="#B5772C" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),

  /* ---------- Lácteos ---------- */
  leche: () => svg(`
    <path d="M32 34h36v46a4 4 0 0 1-4 4H36a4 4 0 0 1-4-4z" fill="#F2F6FA"/>
    <path d="M32 34h14v50H36a4 4 0 0 1-4-4z" fill="#fff"/>
    <path d="M32 34 50 16l18 18z" fill="#DDE7F0"/>
    <path d="M32 34 50 16v18z" fill="#EEF4F9"/>
    <rect x="32" y="50" width="36" height="20" fill="#3F7FC4"/>
    <rect x="32" y="50" width="14" height="20" fill="#5C9BDD"/>
    <path d="M40 58c3-3 7-3 10 0s7 3 10 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="44" y="12" width="12" height="7" rx="2" fill="#3F7FC4"/>`),

  yogurt: () => svg(`
    <path d="M32 38h36l-4 42a5 5 0 0 1-5 4H41a5 5 0 0 1-5-4z" fill="#FBFBFB"/>
    <path d="M32 38h13l-3 46h-1a5 5 0 0 1-5-4z" fill="#fff"/>
    <ellipse cx="50" cy="38" rx="19" ry="6" fill="#E85C8A"/>
    <ellipse cx="50" cy="36" rx="19" ry="6" fill="#F27DA4"/>
    <rect x="37" y="50" width="26" height="20" rx="4" fill="#E85C8A"/>
    <circle cx="44" cy="60" r="4" fill="#fff"/><circle cx="53" cy="58" r="3" fill="#fff"/>
    <circle cx="58" cy="65" r="2.5" fill="#fff"/>`),

  queso: () => svg(`
    <path d="M18 68V52l58-22v16z" fill="#E0A81E"/>
    <path d="M18 68V52l58-22v6z" fill="#F5C63D"/>
    <path d="M18 68h58V46l-58 22z" fill="#F0BC33"/>
    <path d="M18 68h58v8H18z" fill="#D19A18"/>
    <circle cx="36" cy="58" r="5" fill="#D19A18"/><circle cx="54" cy="52" r="4" fill="#D19A18"/>
    <circle cx="66" cy="60" r="3.5" fill="#D19A18"/><circle cx="46" cy="64" r="3" fill="#D19A18"/>`),

  mantequilla: () => svg(`
    <path d="M20 46h60v30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="#F7D46A"/>
    <path d="M20 46h20v34H24a4 4 0 0 1-4-4z" fill="#FBE596"/>
    <path d="M20 46 34 32h60L80 46z" fill="#FDF0BE"/>
    <path d="M80 46 94 32v30L80 76z" fill="#E8C04F"/>
    <rect x="30" y="52" width="40" height="18" rx="3" fill="#fff" opacity=".85"/>
    <path d="M36 60h28M36 66h18" stroke="#C99A2E" stroke-width="3" stroke-linecap="round"/>`),

  huevo: () => svg(`
    <ellipse cx="36" cy="58" rx="17" ry="21" fill="#F0E3CE"/>
    <ellipse cx="31" cy="52" rx="6" ry="9" fill="#fff" opacity=".7"/>
    <ellipse cx="64" cy="54" rx="18" ry="22" fill="#F7EEDE"/>
    <ellipse cx="59" cy="47" rx="6" ry="9" fill="#fff" opacity=".8"/>
    <path d="M46 74a20 20 0 0 0 20 2" stroke="#DCCBB0" stroke-width="2" fill="none"/>`),

  /* ---------- Carnicería ---------- */
  pollo: () => svg(`
    <path d="M34 30c-3-6 1-11 6-9l9 5-4 10zM66 30c3-6-1-11-6-9l-9 5 4 10z" fill="#D9A96D"/>
    <path d="M30 32c-4-5 0-11 6-9M70 32c4-5 0-11-6-9" stroke="#C08A4E" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="56" rx="29" ry="26" fill="#E8BE84"/>
    <path d="M50 30c-16 0-29 12-29 26 0 8 4 15 11 20-4-6-6-13-6-20 0-13 10-24 24-26z" fill="#F5D6A8"/>
    <path d="M21 54c-5 1-8 5-8 9s4 7 9 6" fill="#DCB075"/>
    <path d="M79 54c5 1 8 5 8 9s-4 7-9 6" fill="#DCB075"/>
    <path d="M40 46c6-4 14-4 20 0M36 62c9 4 19 4 28 0" stroke="#CFA271" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="39" cy="44" rx="7" ry="5" fill="#fff" opacity=".3" transform="rotate(-18 39 44)"/>`),

  molida: () => svg(`
    <path d="M16 60h68v14a5 5 0 0 1-5 5H21a5 5 0 0 1-5-5z" fill="#E6EAEE"/>
    <path d="M16 60h12v19h-7a5 5 0 0 1-5-5z" fill="#F5F8FA"/>
    <path d="M20 60c0-14 13-24 30-24s30 10 30 24z" fill="#C9402F"/>
    <path d="M24 60c2-11 13-19 26-19-9 3-16 10-18 19z" fill="#E0574A"/>
    <circle cx="38" cy="50" r="3" fill="#B22F20"/><circle cx="52" cy="46" r="3" fill="#B22F20"/>
    <circle cx="62" cy="53" r="3" fill="#B22F20"/><circle cx="46" cy="55" r="2.5" fill="#B22F20"/>
    <circle cx="42" cy="44" r="2" fill="#F0A79E"/><circle cx="58" cy="42" r="2" fill="#F0A79E"/>`),

  longaniza: () => svg(`
    <path d="M22 44c0-8 8-12 16-9 6 2 8 8 6 14-2 7 2 12 9 12s11-5 9-12c-2-6 0-12 6-14 8-3 16 1 16 9" stroke="#A8442E" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="M22 44c0-8 8-12 16-9 6 2 8 8 6 14-2 7 2 12 9 12" stroke="#C4573C" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M44 49h6M50 61h6M68 44h6" stroke="#7E2F1E" stroke-width="3" stroke-linecap="round"/>
    <circle cx="34" cy="42" r="2" fill="#E8A08C" opacity=".6"/>
    <circle cx="66" cy="42" r="2" fill="#E8A08C" opacity=".6"/>`),

  vienesa: () => svg(`
    <rect x="20" y="34" width="60" height="46" rx="6" fill="#F0D8B8"/>
    <rect x="20" y="34" width="18" height="46" rx="6" fill="#F7E8D2"/>
    <rect x="26" y="42" width="48" height="12" rx="6" fill="#D9694A"/>
    <rect x="26" y="58" width="48" height="12" rx="6" fill="#D9694A"/>
    <rect x="26" y="42" width="20" height="12" rx="6" fill="#E88266"/>
    <rect x="26" y="58" width="20" height="12" rx="6" fill="#E88266"/>
    <rect x="20" y="28" width="60" height="8" rx="3" fill="#C9AE8A"/>`),

  /* ---------- Abarrotes ---------- */
  arroz: () => svg(`
    <path d="M26 34h48v46a4 4 0 0 1-4 4H30a4 4 0 0 1-4-4z" fill="#F5F1E4"/>
    <path d="M26 34h16v50H30a4 4 0 0 1-4-4z" fill="#FCFAF2"/>
    <path d="M26 34c6-6 16-8 24-8s18 2 24 8z" fill="#E4DECB"/>
    <rect x="32" y="48" width="36" height="24" rx="4" fill="#3F8C6E"/>
    <ellipse cx="44" cy="58" rx="4" ry="2.5" fill="#fff" transform="rotate(-25 44 58)"/>
    <ellipse cx="52" cy="62" rx="4" ry="2.5" fill="#fff" transform="rotate(15 52 62)"/>
    <ellipse cx="58" cy="55" rx="4" ry="2.5" fill="#fff" transform="rotate(-10 58 55)"/>`),

  fideos: () => svg(`
    <path d="M30 26h40v54a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4z" fill="#EFE3C8"/>
    <path d="M30 26h14v58H34a4 4 0 0 1-4-4z" fill="#F7EFDC"/>
    <path d="M36 26h4v58h-4zM44 26h4v58h-4zM52 26h4v58h-4zM60 26h4v58h-4z" fill="#E3C77E"/>
    <rect x="26" y="42" width="48" height="20" rx="4" fill="#C9412F"/>
    <path d="M34 52h32" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`),

  azucar: () => svg(`
    <path d="M26 36h48v44a4 4 0 0 1-4 4H30a4 4 0 0 1-4-4z" fill="#EDEDF2"/>
    <path d="M26 36h16v48H30a4 4 0 0 1-4-4z" fill="#F8F8FC"/>
    <path d="M26 36c6-7 16-9 24-9s18 2 24 9z" fill="#DCDCE4"/>
    <rect x="32" y="50" width="36" height="22" rx="4" fill="#5C9BDD"/>
    <rect x="38" y="56" width="9" height="9" rx="2" fill="#fff"/>
    <rect x="50" y="56" width="9" height="9" rx="2" fill="#fff"/>
    <rect x="44" y="46" width="9" height="9" rx="2" fill="#fff" opacity=".8"/>`),

  aceite: () => svg(`
    <path d="M40 30h20v10c8 4 12 10 12 18v24a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4V58c0-8 4-14 12-18z" fill="#E8B93C"/>
    <path d="M40 30h8v12c-6 4-10 9-10 16v28h-6a4 4 0 0 1-4-4V58c0-8 4-14 12-18z" fill="#F5D06A"/>
    <rect x="42" y="18" width="16" height="13" rx="3" fill="#4E7A3C"/>
    <rect x="34" y="56" width="32" height="22" rx="4" fill="#4E7A3C"/>
    <circle cx="50" cy="66" r="7" fill="#EFE3C8"/>
    <path d="M50 61c3 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1-4 4-7z" fill="#E8B93C"/>`),

  atun: () => svg(`
    <ellipse cx="50" cy="42" rx="30" ry="9" fill="#C8CDD4"/>
    <path d="M20 42v22c0 5 13 9 30 9s30-4 30-9V42z" fill="#AEB5BE"/>
    <path d="M20 42v22c0 4 8 7 18 8V44z" fill="#C8CDD4"/>
    <ellipse cx="50" cy="42" rx="24" ry="6" fill="#DDE1E6"/>
    <rect x="24" y="48" width="52" height="16" rx="3" fill="#3F7FC4"/>
    <path d="M34 56c4-5 12-5 16 0-4 5-12 5-16 0z" fill="#fff"/>
    <path d="M52 56c3-3 8-4 8-4l-2 4 2 4s-5-1-8-4z" fill="#fff"/>`),

  mermelada: () => svg(`
    <path d="M32 40h36v38a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6z" fill="#D8365A"/>
    <path d="M32 40h12v44h-6a6 6 0 0 1-6-6z" fill="#E85C7B"/>
    <path d="M32 40c0-6 6-9 18-9s18 3 18 9z" fill="#B62A48"/>
    <rect x="34" y="24" width="32" height="12" rx="3" fill="#4E7A3C"/>
    <rect x="36" y="54" width="28" height="20" rx="4" fill="#FBF3E2"/>
    <circle cx="45" cy="63" r="4" fill="#D8365A"/><circle cx="55" cy="61" r="3.5" fill="#D8365A"/>
    <circle cx="51" cy="69" r="3" fill="#D8365A"/>`),

  /* ---------- Bebidas ---------- */
  bebida: () => svg(`
    <path d="M42 24h16v8c9 5 14 13 14 23v23a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6V55c0-10 5-18 14-23z" fill="#8B4A22"/>
    <path d="M42 24h7v10c-8 5-13 12-13 21v29h-2a6 6 0 0 1-6-6V55c0-10 5-18 14-23z" fill="#A96434"/>
    <rect x="40" y="14" width="20" height="12" rx="3" fill="#C9412F"/>
    <rect x="30" y="50" width="40" height="22" rx="4" fill="#C9412F"/>
    <path d="M36 61c4-4 10-4 14 0s10 4 14 0" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="38" cy="44" rx="3" ry="8" fill="#fff" opacity=".3"/>`),

  jugo: () => svg(`
    <path d="M32 34h36v46a4 4 0 0 1-4 4H36a4 4 0 0 1-4-4z" fill="#F09A2E"/>
    <path d="M32 34h13v50H36a4 4 0 0 1-4-4z" fill="#F7B45C"/>
    <path d="M32 34 50 22l18 12z" fill="#D9821C"/>
    <rect x="37" y="50" width="26" height="22" rx="4" fill="#fff" opacity=".9"/>
    <circle cx="50" cy="61" r="8" fill="#F09A2E"/>
    <path d="M50 53v16M42 61h16" stroke="#D9821C" stroke-width="1.5"/>
    <path d="M62 24 74 12" stroke="#C9412F" stroke-width="5" stroke-linecap="round"/>`),

/* ---------- Ampliación del catálogo ---------- */
  sandia: () => svg(`
    <path d="M12 66a38 38 0 0 1 76 0z" fill="#3F8C3C"/>
    <path d="M16 66a34 34 0 0 1 68 0z" fill="#EAF3D6"/>
    <path d="M20 66a30 30 0 0 1 60 0z" fill="#E24A5B"/>
    <ellipse cx="38" cy="52" rx="2.6" ry="4" fill="#2E2A26" transform="rotate(-18 38 52)"/>
    <ellipse cx="52" cy="46" rx="2.6" ry="4" fill="#2E2A26"/>
    <ellipse cx="64" cy="55" rx="2.6" ry="4" fill="#2E2A26" transform="rotate(16 64 55)"/>
    <ellipse cx="46" cy="60" rx="2.6" ry="4" fill="#2E2A26" transform="rotate(-8 46 60)"/>
    <ellipse cx="34" cy="48" rx="6" ry="4" fill="#fff" opacity=".22" transform="rotate(-30 34 48)"/>`),

  uva: () => svg(`
    <path d="M50 26c0-6 6-10 12-11" stroke="#7A5A2A" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M60 16c8-6 18-2 18-2s-5 10-12 9c-4 0-6-3-6-7z" fill="#5FA845"/>
    <g fill="#8659B5">
      <circle cx="50" cy="34" r="9"/><circle cx="38" cy="46" r="9"/><circle cx="62" cy="46" r="9"/>
      <circle cx="50" cy="50" r="9"/><circle cx="30" cy="60" r="9"/><circle cx="70" cy="60" r="9"/>
      <circle cx="42" cy="63" r="9"/><circle cx="58" cy="63" r="9"/><circle cx="50" cy="76" r="9"/>
    </g>
    <g fill="#A87BD1">
      <circle cx="47" cy="31" r="3.5"/><circle cx="35" cy="43" r="3.5"/><circle cx="27" cy="57" r="3.5"/>
      <circle cx="47" cy="47" r="3.5"/><circle cx="39" cy="60" r="3.5"/>
    </g>`),

  choclo: () => svg(`
    <ellipse cx="50" cy="52" rx="19" ry="30" fill="#E8B93C"/>
    <ellipse cx="43" cy="50" rx="9" ry="24" fill="#F7D46A"/>
    <g fill="#C99A2E">
      <circle cx="42" cy="34" r="2.4"/><circle cx="52" cy="32" r="2.4"/><circle cx="60" cy="40" r="2.4"/>
      <circle cx="42" cy="48" r="2.4"/><circle cx="52" cy="46" r="2.4"/><circle cx="60" cy="54" r="2.4"/>
      <circle cx="42" cy="62" r="2.4"/><circle cx="52" cy="60" r="2.4"/><circle cx="58" cy="68" r="2.4"/>
    </g>
    <path d="M31 44c-10-6-15-18-15-18s13-2 20 6c4 5 4 12 1 16-2-1-4-3-6-4z" fill="#4E9E5B"/>
    <path d="M69 44c10-6 15-18 15-18s-13-2-20 6c-4 5-4 12-1 16 2-1 4-3 6-4z" fill="#63B04B"/>
    <path d="M50 22v-8" stroke="#4E9E5B" stroke-width="4" stroke-linecap="round"/>`),

  zapallo: () => svg(`
    <ellipse cx="50" cy="58" rx="34" ry="26" fill="#E8802B"/>
    <ellipse cx="36" cy="58" rx="14" ry="26" fill="#F59A4C"/>
    <ellipse cx="64" cy="58" rx="14" ry="26" fill="#D4701F"/>
    
    <ellipse cx="50" cy="58" rx="12" ry="26" fill="#F08B3A"/>
    <path d="M50 32V22c0-4 4-6 8-5" stroke="#5D7A32" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="45" rx="7" ry="4" fill="#fff" opacity=".25" transform="rotate(-20 34 45)"/>`),

  limon: () => svg(`
    <ellipse cx="42" cy="60" rx="22" ry="19" fill="#E8C51E" transform="rotate(-12 42 60)"/>
    <ellipse cx="36" cy="54" rx="8" ry="6" fill="#F5DC57" transform="rotate(-12 36 54)"/>
    <ellipse cx="66" cy="48" rx="18" ry="15" fill="#F2D42E" transform="rotate(10 66 48)"/>
    <ellipse cx="61" cy="43" rx="6" ry="5" fill="#F9E784" transform="rotate(10 61 43)"/>
    <path d="M62 34c-1-5 2-8 2-8s3 4 2 8z" fill="#5FA845"/>
    <path d="M66 30c6-6 15-4 15-4s-3 9-10 9c-3 0-5-2-5-5z" fill="#4E9E5B"/>`),

  manjar: () => svg(`
    <path d="M30 40h40v36a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6z" fill="#B5762F"/>
    <path d="M30 40h13v42h-7a6 6 0 0 1-6-6z" fill="#CE8F41"/>
    <ellipse cx="50" cy="40" rx="20" ry="6" fill="#8B5A1E"/>
    <rect x="26" y="26" width="48" height="14" rx="4" fill="#E8B93C"/>
    <rect x="26" y="26" width="16" height="14" rx="4" fill="#F5D06A"/>
    <rect x="34" y="52" width="32" height="20" rx="5" fill="#FBF3E2"/>
    <path d="M40 62c4-4 8-4 10 0s6 4 10 0" stroke="#B5762F" stroke-width="3.5" fill="none" stroke-linecap="round"/>`),

  pescado: () => svg(`
    <path d="M76 50c0-12-14-22-30-22S18 38 18 50s12 22 28 22 30-10 30-22z" fill="#7FA8C4"/>
    <path d="M46 28c-16 0-28 10-28 22 0 6 4 12 10 16-3-5-4-10-4-16 0-9 8-18 22-22z" fill="#A5C6DC"/>
    <path d="M76 50 92 34v32z" fill="#5D8AAA"/>
    <path d="M44 30c4-8 12-10 12-10s0 8-4 12z" fill="#5D8AAA"/>
    <circle cx="30" cy="45" r="5" fill="#fff"/><circle cx="29" cy="45" r="2.6" fill="#2E3A44"/>
    <path d="M52 42a16 16 0 0 1 0 16" stroke="#5D8AAA" stroke-width="3" fill="none"/>
    <path d="M62 40a18 18 0 0 1 0 20" stroke="#5D8AAA" stroke-width="3" fill="none"/>`),

  porotos: () => svg(`
    <path d="M28 34h44v46a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4z" fill="#EFE3C8"/>
    <path d="M28 34h15v50H32a4 4 0 0 1-4-4z" fill="#F7EFDC"/>
    <path d="M28 34c6-7 16-9 22-9s16 2 22 9z" fill="#DCCFB2"/>
    <rect x="34" y="48" width="32" height="24" rx="5" fill="#fff"/>
    <g fill="#8B4A2B">
      <ellipse cx="42" cy="56" rx="5" ry="3.4" transform="rotate(-20 42 56)"/>
      <ellipse cx="55" cy="54" rx="5" ry="3.4" transform="rotate(12 55 54)"/>
      <ellipse cx="48" cy="64" rx="5" ry="3.4" transform="rotate(-8 48 64)"/>
      <ellipse cx="59" cy="64" rx="5" ry="3.4" transform="rotate(24 59 64)"/>
    </g>`),

  harina: () => svg(`
    <path d="M28 34h44v46a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4z" fill="#F5F1E4"/>
    <path d="M28 34h15v50H32a4 4 0 0 1-4-4z" fill="#FCFAF2"/>
    <path d="M28 34c6-7 16-9 22-9s16 2 22 9z" fill="#E4DECB"/>
    <rect x="34" y="48" width="32" height="24" rx="5" fill="#E8B93C"/>
    <path d="M50 52v18M50 56c-4-3-7-2-7-2s1 4 4 5M50 56c4-3 7-2 7-2s-1 4-4 5M50 64c-4-3-7-2-7-2s1 4 4 5M50 64c4-3 7-2 7-2s-1 4-4 5"
      stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>`),

  te: () => svg(`
    <path d="M26 38h48v40a5 5 0 0 1-5 5H31a5 5 0 0 1-5-5z" fill="#B5443C"/>
    <path d="M26 38h15v45h-10a5 5 0 0 1-5-5z" fill="#CE5E52"/>
    <path d="M26 38 50 26l24 12z" fill="#8E312B"/>
    <rect x="33" y="50" width="34" height="24" rx="5" fill="#FBF3E2"/>
    <path d="M42 58h14v7a7 7 0 0 1-14 0z" fill="#B5443C"/>
    <path d="M56 60h4a3 3 0 0 1 0 6h-4" stroke="#B5443C" stroke-width="2.5" fill="none"/>
    <path d="M46 54c0-3 3-3 3-6M52 54c0-3 3-3 3-6" stroke="#C98A2E" stroke-width="2" fill="none" stroke-linecap="round"/>`),

  cafe: () => svg(`
    <path d="M32 40h36v38a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6z" fill="#5C3A1E"/>
    <path d="M32 40h12v44h-6a6 6 0 0 1-6-6z" fill="#7A5230"/>
    <rect x="34" y="24" width="32" height="16" rx="4" fill="#3E2814"/>
    <rect x="34" y="24" width="11" height="16" rx="4" fill="#54391F"/>
    <rect x="36" y="52" width="28" height="22" rx="5" fill="#EFE3C8"/>
    <ellipse cx="46" cy="62" rx="4" ry="5.5" fill="#5C3A1E" transform="rotate(-20 46 62)"/>
    <ellipse cx="55" cy="64" rx="4" ry="5.5" fill="#5C3A1E" transform="rotate(15 55 64)"/>
    <path d="M46 57v10M55 59v10" stroke="#EFE3C8" stroke-width="1.4"/>`),

  galletas: () => svg(`
    <ellipse cx="50" cy="72" rx="26" ry="9" fill="#C4883C"/>
    <ellipse cx="50" cy="64" rx="26" ry="9" fill="#D79B45"/>
    <ellipse cx="50" cy="56" rx="26" ry="9" fill="#C4883C"/>
    <ellipse cx="50" cy="48" rx="26" ry="9" fill="#EFB865"/>
    <ellipse cx="50" cy="46" rx="26" ry="9" fill="#F2C77E"/>
    <g fill="#8E5D18">
      <circle cx="42" cy="44" r="2.4"/><circle cx="54" cy="42" r="2.4"/>
      <circle cx="60" cy="48" r="2.4"/><circle cx="46" cy="50" r="2.4"/>
    </g>`),

  salsa: () => svg(`
    <path d="M30 30h40l-3 50a5 5 0 0 1-5 5H38a5 5 0 0 1-5-5z" fill="#C9412F"/>
    <path d="M30 30h13l-2 55h-3a5 5 0 0 1-5-5z" fill="#E05744"/>
    <path d="M28 24h44v8H28z" fill="#8E2A1C"/>
    <rect x="36" y="48" width="28" height="24" rx="5" fill="#FBF3E2"/>
    <circle cx="50" cy="60" r="8" fill="#E24A34"/>
    <path d="M50 52c-2-4-6-5-6-5s0 4 3 5c-4-1-7 1-7 1s3 3 6 2" fill="#4E9E5B"/>`),

  nectar: () => svg(`
    <path d="M32 34h36v46a4 4 0 0 1-4 4H36a4 4 0 0 1-4-4z" fill="#E24A5B"/>
    <path d="M32 34h13v50H36a4 4 0 0 1-4-4z" fill="#F0707E"/>
    <path d="M32 34 50 22l18 12z" fill="#B53546"/>
    <rect x="37" y="50" width="26" height="22" rx="5" fill="#fff" opacity=".92"/>
    <circle cx="46" cy="61" r="6" fill="#E24A5B"/><circle cx="56" cy="59" r="5" fill="#E8802B"/>
    <path d="M50 58c-1-3-4-4-4-4" stroke="#4E9E5B" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M62 24 74 12" stroke="#5FA845" stroke-width="5" stroke-linecap="round"/>`),

  papel: () => svg(`
    <rect x="16" y="44" width="30" height="38" rx="6" fill="#EDF2F7"/>
    <rect x="16" y="44" width="11" height="38" rx="6" fill="#FBFDFF"/>
    <ellipse cx="31" cy="44" rx="15" ry="7" fill="#DCE6EF"/>
    <ellipse cx="31" cy="44" rx="6" ry="3" fill="#B9C9D8"/>
    <rect x="52" y="38" width="30" height="44" rx="6" fill="#E3EBF3"/>
    <rect x="52" y="38" width="11" height="44" rx="6" fill="#F7FAFD"/>
    <ellipse cx="67" cy="38" rx="15" ry="7" fill="#D2DEE9"/>
    <ellipse cx="67" cy="38" rx="6" ry="3" fill="#B9C9D8"/>
    <path d="M42 54h16M42 62h16" stroke="#C6D5E2" stroke-width="2.5"/>`),

  detergente: () => svg(`
    <path d="M26 36h48v44a5 5 0 0 1-5 5H31a5 5 0 0 1-5-5z" fill="#3F7FC4"/>
    <path d="M26 36h15v49H31a5 5 0 0 1-5-5z" fill="#5C9BDD"/>
    <path d="M26 36c7-8 17-10 24-10s17 2 24 10z" fill="#2F66A5"/>
    <rect x="33" y="50" width="34" height="24" rx="5" fill="#fff"/>
    <circle cx="44" cy="60" r="6" fill="#9ED7F0"/><circle cx="56" cy="57" r="4.5" fill="#C4E9F7"/>
    <circle cx="58" cy="67" r="3.5" fill="#9ED7F0"/><circle cx="48" cy="68" r="3" fill="#C4E9F7"/>`),

  jabon: () => svg(`
    <rect x="22" y="46" width="56" height="30" rx="12" fill="#F0A8C4"/>
    <rect x="22" y="46" width="22" height="30" rx="12" fill="#F7C4D8"/>
    <rect x="30" y="54" width="40" height="14" rx="7" fill="#fff" opacity=".55"/>
    <circle cx="72" cy="34" r="8" fill="#C4E9F7" opacity=".85"/>
    <circle cx="60" cy="26" r="5.5" fill="#9ED7F0" opacity=".85"/>
    <circle cx="80" cy="22" r="4" fill="#C4E9F7" opacity=".85"/>
    <circle cx="69" cy="31" r="2.4" fill="#fff"/>`),

/* ---------- Feria de Botalcura ---------- */
  miel: () => svg(`
    <path d="M28 40h44v36a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8z" fill="#D98A1C"/>
    <path d="M28 40h14v44h-6a8 8 0 0 1-8-8z" fill="#F0A835"/>
    <ellipse cx="50" cy="40" rx="22" ry="6" fill="#B5711A"/>
    <rect x="24" y="26" width="52" height="15" rx="5" fill="#7A4A18"/>
    <rect x="24" y="26" width="17" height="15" rx="5" fill="#96601F"/>
    <rect x="34" y="52" width="32" height="24" rx="6" fill="#FBF0D8"/>
    <path d="M50 57l5 3v6l-5 3-5-3v-6z" fill="#E8B93C"/>
    <path d="M43 62l-4 2v4l4 2M57 62l4 2v4l-4 2" stroke="#E8B93C" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M46 20c0-3 2-5 4-5s4 2 4 5" stroke="#7A4A18" stroke-width="3" fill="none" stroke-linecap="round"/>`),

  panamasado: () => svg(`
    <ellipse cx="50" cy="58" rx="32" ry="24" fill="#C4883C"/>
    
    <ellipse cx="50" cy="53" rx="32" ry="22" fill="#DFA155"/>
    <path d="M18 52c5-11 17-18 32-18s27 7 32 18c-3-16-16-24-32-24s-29 8-32 24z" fill="#EFBE79"/>
    <path d="M38 42c4-2 8-2 12 0M34 60c10 4 22 4 32 0" stroke="#B5772C" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="42" cy="50" r="2" fill="#B5772C"/>
    <circle cx="58" cy="48" r="2" fill="#B5772C"/>
    <circle cx="50" cy="58" r="2" fill="#B5772C"/>
    <ellipse cx="36" cy="45" rx="8" ry="4" fill="#fff" opacity=".22" transform="rotate(-12 36 45)"/>`),

  agua: () => svg(`
    <path d="M42 28h16v6c8 5 12 12 12 21v25a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V55c0-9 4-16 12-21z" fill="#9ED7F0"/>
    <path d="M42 28h7v8c-7 5-11 11-11 19v31h-2a6 6 0 0 1-6-6V55c0-9 4-16 12-21z" fill="#C4E9F7"/>
    <rect x="41" y="18" width="18" height="11" rx="3" fill="#2F7FB5"/>
    <rect x="32" y="52" width="36" height="20" rx="4" fill="#2F7FB5"/>
    <path d="M50 56c4 5 6 8 6 10a6 6 0 0 1-12 0c0-2 2-5 6-10z" fill="#fff"/>
    <path d="M36 40c0-4 3-7 3-7" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round" fill="none"/>`)
};

/* En la feria el maíz se dibuja como el choclo, y el saco de papas usa el
   mismo dibujo que las papas del mercado. */
DIBUJOS.maiz = DIBUJOS.choclo;
DIBUJOS.papas = DIBUJOS.papa;

/** Devuelve el SVG de un producto; si falta el dibujo, usa una bolsa genérica. */
function dibujoProducto(id) {
  const fn = DIBUJOS[id];
  if (fn) return fn();
  return svg('<rect x="28" y="32" width="44" height="48" rx="6" fill="#D8CBB4"/>');
}
