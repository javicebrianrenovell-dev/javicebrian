// Constantes de configuración del sitio.

// Google Analytics 4 — ID de medición (formato G-XXXXXXXXXX).
// Déjalo vacío para desactivar GA4 por completo (no se carga ningún script
// ni se muestra el banner de consentimiento).
// Puedes fijarlo aquí o vía variable de entorno PUBLIC_GA_ID en el build.
export const GA_MEASUREMENT_ID: string = import.meta.env.PUBLIC_GA_ID ?? '';
