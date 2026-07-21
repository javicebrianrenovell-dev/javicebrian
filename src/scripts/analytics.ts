/**
 * Analítica + consentimiento (GA4 con Consent Mode v2).
 *
 * Principios:
 * - Privacidad primero: GA4 NO se carga hasta que el visitante acepta.
 *   Sin aceptación → cero cookies, cero scripts de Google.
 * - El ID vive en src/consts.ts (GA_MEASUREMENT_ID). Si está vacío, todo
 *   este módulo queda inerte: ni banner ni tracking.
 * - track() es seguro de llamar siempre: si no hay consentimiento o no hay
 *   ID, no hace nada.
 *
 * Eventos que medimos (ver data-ga-event en el HTML y llamadas a jcTrack):
 *   - cta_click       { label }      → clics en botones de llamada a la acción
 *   - service_click   { label }      → clics hacia páginas de servicio
 *   - contact_click   { label }      → email / LinkedIn
 *   - form_start      {}             → el visitante avanza del paso 1
 *   - generate_lead   { ... }        → envío correcto del formulario (conversión)
 */

import { GA_MEASUREMENT_ID } from '../consts';

const CONSENT_KEY = 'jc-consent'; // 'granted' | 'denied'

type Consent = 'granted' | 'denied' | null;

function getStoredConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

function storeConsent(value: 'granted' | 'denied'): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* almacenamiento no disponible: seguimos sin persistir */
  }
}

let gaLoaded = false;

function loadGA4(): void {
  if (gaLoaded || !GA_MEASUREMENT_ID) return;
  gaLoaded = true;

  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  // OJO: hay que empujar el objeto `arguments`, NO un array. gtag.js solo
  // procesa las entradas de dataLayer que son `arguments`; las que son arrays
  // reales las ignora. Con `(...args) => push(args)` los comandos entraban en
  // dataLayer y no se ejecutaba ninguno: la biblioteca cargaba, el contenedor
  // se inicializaba y no salía un solo hit a /g/collect. Dos meses sin datos.
  function gtag(..._args: any[]) {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  }
  w.gtag = gtag;

  gtag('js', new Date());
  // Consent Mode v2: analítica concedida, publicidad denegada (no usamos ads).
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });
  gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

/** Envía un evento a GA4. No-op si no hay consentimiento o no hay ID. */
export function track(event: string, params: Record<string, unknown> = {}): void {
  const w = window as any;
  if (!GA_MEASUREMENT_ID || typeof w.gtag !== 'function') return;
  w.gtag('event', event, params);
}

/** Envío manual de page_view tras navegación con View Transitions. */
function trackPageView(): void {
  const w = window as any;
  if (!GA_MEASUREMENT_ID || typeof w.gtag !== 'function') return;
  w.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
  });
}

function hideBanner(): void {
  document.getElementById('cookie-consent')?.classList.add('hidden');
}

function showBanner(): void {
  document.getElementById('cookie-consent')?.classList.remove('hidden');
}

/** Delegación de clics: cualquier elemento con data-ga-event dispara track(). */
function wireTrackedClicks(): void {
  if ((window as any).__jcClicksWired) return;
  (window as any).__jcClicksWired = true;

  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-ga-event]');
    if (!el) return;
    const event = el.dataset.gaEvent;
    if (!event) return;
    track(event, { label: el.dataset.gaLabel || '' });
  });
}

/**
 * Inicializa analítica + consentimiento. Idempotente: se puede llamar en cada
 * astro:page-load. Expone window.jcTrack para scripts sueltos (lead-form).
 */
export function initAnalytics(): void {
  (window as any).jcTrack = track;
  wireTrackedClicks();

  // Sin ID configurado: nada que hacer (ni banner ni GA4).
  if (!GA_MEASUREMENT_ID) return;

  const consent = getStoredConsent();

  if (consent === 'granted') {
    if (!gaLoaded) {
      loadGA4();
    } else {
      // Ya cargado en esta sesión: registrar la nueva vista de la navegación SPA.
      trackPageView();
    }
    hideBanner();
    return;
  }

  if (consent === 'denied') {
    hideBanner();
    return;
  }

  // Sin decisión todavía: mostrar banner y cablear botones una sola vez.
  showBanner();
  const accept = document.getElementById('cookie-accept');
  const reject = document.getElementById('cookie-reject');

  accept?.addEventListener(
    'click',
    () => {
      storeConsent('granted');
      loadGA4();
      hideBanner();
    },
    { once: true }
  );

  reject?.addEventListener(
    'click',
    () => {
      storeConsent('denied');
      hideBanner();
    },
    { once: true }
  );
}
