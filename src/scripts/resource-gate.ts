/**
 * Gate de recurso descargable (lead magnet).
 * Captura email vía Web3Forms y, al confirmar, redirige al recurso.
 * El recurso (página imprimible) es noindex y solo se enlaza desde aquí.
 */

function track(event: string, params: Record<string, unknown> = {}): void {
  const fn = (window as unknown as { jcTrack?: (e: string, p?: Record<string, unknown>) => void }).jcTrack;
  if (typeof fn === 'function') fn(event, params);
}

export function initResourceGate(): void {
  const form = document.getElementById('resource-form') as HTMLFormElement | null;
  if (!form) return;

  const feedback = document.getElementById('rg-feedback') as HTMLDivElement | null;
  const submitBtn = document.getElementById('rg-submit') as HTMLButtonElement | null;
  if (!feedback || !submitBtn) return;

  const resourceUrl = form.dataset.resource || '/';
  const recurso = form.dataset.recurso || 'recurso';

  const showError = (msg: string): void => {
    feedback.className = 'block mt-4 p-4 rounded-md text-sm font-semibold bg-red-50 text-red-900 border border-red-200';
    feedback.textContent = `✗ ${msg}`;
  };

  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    const email = (form.querySelector<HTMLInputElement>('input[name="email"]')?.value || '').trim();
    const rgpd = !!form.querySelector<HTMLInputElement>('input[name="rgpd"]:checked');
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

    if (!emailOk || !rgpd) {
      showError('Necesito un email válido y que aceptes la política de privacidad.');
      return;
    }

    submitBtn.disabled = true;
    const prevLabel = submitBtn.textContent;
    submitBtn.textContent = 'Enviando…';
    feedback.className = 'hidden';

    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    data.access_key = 'bc65817d-03b0-4c30-8571-3bdb79dda23c';
    data.subject = `[Recurso] ${recurso} — ${data.email || ''}`;
    data.from_name = 'Recurso javicebrian.es';
    data.replyto = data.email || '';
    data.cc = 'jcebrian@grupimedes.com';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        track('generate_lead', { tipo: 'lead_magnet', recurso });
        // Marca de sesión por si el recurso quiere saber que vino del gate.
        try {
          sessionStorage.setItem('jc-recurso', recurso);
        } catch {
          /* no-op */
        }
        window.location.href = resourceUrl;
      } else {
        throw new Error(json.message || 'No pudimos procesar tu solicitud.');
      }
    } catch (err) {
      showError(`${err instanceof Error ? err.message : 'Error inesperado'}. Escríbeme a jcebrian@grupimedes.com.`);
      submitBtn.disabled = false;
      submitBtn.textContent = prevLabel;
    }
  });
}
