// Constantes de configuración del sitio.

// Google Analytics 4 — ID de medición (formato G-XXXXXXXXXX).
// Propiedad "javicebrian.es". Déjalo vacío para desactivar GA4 por completo
// (no se carga ningún script ni se muestra el banner de consentimiento).
// La variable de entorno PUBLIC_GA_ID, si existe, tiene prioridad.
export const GA_MEASUREMENT_ID: string = import.meta.env.PUBLIC_GA_ID ?? 'G-RT586XLMS6';
