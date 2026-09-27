// Constantes de configuración del sitio.

// Google Analytics 4 — ID de medición (formato G-XXXXXXXXXX).
// Propiedad "javicebrian.es". Déjalo vacío para desactivar GA4 por completo
// (no se carga ningún script ni se muestra el banner de consentimiento).
// La variable de entorno PUBLIC_GA_ID, si existe, tiene prioridad.
export const GA_MEASUREMENT_ID: string = import.meta.env.PUBLIC_GA_ID ?? 'G-RT586XLMS6';

// Umami — analítica sin cookies, autoalojada en el VPS (ver infra/README.md).
// Se carga siempre (no necesita consentimiento: no usa cookies ni guarda datos
// personales). El script y el envío van por la propia web: /u/m.js y /u/api/hit.
// Déjalo vacío para desactivarlo.
export const UMAMI_WEBSITE_ID: string = import.meta.env.PUBLIC_UMAMI_ID ?? 'e53bc9fe-7126-4660-a35f-ffef73a89016';
