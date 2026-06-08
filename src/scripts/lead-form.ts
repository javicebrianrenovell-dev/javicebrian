/**
 * Form multi-paso del lead cualificado.
 * - Pasos 1-3: validación inline (cada paso pide su radio antes de avanzar).
 * - Paso 4: datos de contacto + envío.
 * - El score se calcula SIEMPRE en servidor; aquí solo recogemos respuestas.
 */

const TOTAL_STEPS = 4;

// Helper de analítica: no-op si no hay consentimiento/GA configurado.
function track(event: string, params: Record<string, unknown> = {}): void {
  const fn = (window as unknown as { jcTrack?: (e: string, p?: Record<string, unknown>) => void }).jcTrack;
  if (typeof fn === 'function') fn(event, params);
}

export function initLeadForm(): void {
  const form = document.getElementById('lead-form') as HTMLFormElement | null;
  if (!form) return;

  const steps = Array.from(
    form.querySelectorAll<HTMLFieldSetElement>('.lf-step')
  );
  const stepLabel = document.getElementById('lf-step') as HTMLSpanElement | null;
  const pctLabel = document.getElementById('lf-pct') as HTMLSpanElement | null;
  const bar = document.getElementById('lf-bar') as HTMLDivElement | null;
  const prevBtn = document.getElementById('lf-prev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('lf-next') as HTMLButtonElement | null;
  const submitBtn = document.getElementById('lf-submit') as HTMLButtonElement | null;
  const submitLabel = document.getElementById('lf-submit-label') as HTMLSpanElement | null;
  const feedback = document.getElementById('lf-feedback') as HTMLDivElement | null;

  if (!stepLabel || !pctLabel || !bar || !prevBtn || !nextBtn || !submitBtn || !submitLabel || !feedback) return;

  let current = 1;
  let started = false; // para emitir form_start una sola vez

  const render = (): void => {
    steps.forEach(s => {
      const n = parseInt(s.dataset.step || '0', 10);
      s.classList.toggle('hidden', n !== current);
    });
    stepLabel.textContent = String(current);
    const pct = Math.round((current / TOTAL_STEPS) * 100);
    pctLabel.textContent = String(pct);
    bar.style.width = `${pct}%`;

    prevBtn.disabled = current === 1;

    const isLast = current === TOTAL_STEPS;
    nextBtn.classList.toggle('hidden', isLast);
    submitBtn.classList.toggle('hidden', !isLast);

    const firstFocus = steps[current - 1]?.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([type="checkbox"]), textarea, select'
    );
    firstFocus?.focus({ preventScroll: true });
  };

  const validateStep = (n: number): boolean => {
    if (n === 1) return !!form.querySelector<HTMLInputElement>('input[name="organizacion"]:checked');
    if (n === 2) return !!form.querySelector<HTMLInputElement>('input[name="encargo"]:checked');
    if (n === 3) {
      return !!form.querySelector<HTMLInputElement>('input[name="plazo"]:checked')
          && !!form.querySelector<HTMLInputElement>('input[name="presupuesto"]:checked');
    }
    if (n === 4) {
      const nombre = (form.querySelector<HTMLInputElement>('input[name="nombre"]')?.value || '').trim();
      const email = (form.querySelector<HTMLInputElement>('input[name="email"]')?.value || '').trim();
      const rgpd = !!form.querySelector<HTMLInputElement>('input[name="rgpd"]:checked');
      const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
      return nombre.length > 0 && emailOk && rgpd;
    }
    return false;
  };

  const showStepError = (msg: string): void => {
    feedback.className = 'block mb-6 p-4 rounded-md text-sm font-semibold bg-[#1A1A1A]/5 text-[#1A1A1A] border border-[#1A1A1A]/10';
    feedback.textContent = msg;
    setTimeout(() => {
      if (feedback.textContent === msg) feedback.className = 'hidden';
    }, 4000);
  };

  prevBtn.addEventListener('click', () => {
    if (current > 1) {
      current -= 1;
      feedback.className = 'hidden';
      render();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!validateStep(current)) {
      showStepError('Elige una opción para continuar.');
      return;
    }
    if (!started) {
      started = true;
      track('form_start');
    }
    if (current < TOTAL_STEPS) {
      current += 1;
      feedback.className = 'hidden';
      render();
    }
  });

  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    if (!validateStep(4)) {
      showStepError('Necesito al menos nombre, email válido y aceptar la política de privacidad.');
      return;
    }

    submitBtn.disabled = true;
    submitLabel.textContent = 'Enviando…';
    feedback.className = 'hidden';

    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    data.access_key = 'bc65817d-03b0-4c30-8571-3bdb79dda23c';
    data.subject = `[Web] Empezar proyecto — ${data.nombre || ''}`;
    data.from_name = 'Formulario javicebrian.es';
    data.replyto = data.email || '';
    data.cc = 'jcebrian@grupimedes.com';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        // Conversión. Solo datos de cualificación, nunca datos personales.
        track('generate_lead', {
          organizacion: data.organizacion || '',
          encargo: data.encargo || '',
          plazo: data.plazo || '',
          presupuesto: data.presupuesto || '',
        });
        feedback.className = 'block mb-6 p-5 rounded-md bg-[#8DBE3F]/15 text-[#1A1A1A] border border-[#8DBE3F]';
        feedback.innerHTML = `
          <p class="font-display text-xs text-[#1A1A1A] mb-2">RECIBIDO</p>
          <p class="text-lg font-extrabold tracking-tight mb-2">Gracias, ${escapeHtml(String(data.nombre || ''))}.</p>
          <p class="text-sm font-normal leading-relaxed">He recibido tu consulta y te respondo personalmente en menos de 48 horas.</p>
        `;
        steps.forEach(s => s.classList.add('hidden'));
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        submitBtn.classList.add('hidden');
        feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        throw new Error(json.message || 'No pudimos enviar tu consulta.');
      }
    } catch (err) {
      feedback.className = 'block mb-6 p-4 rounded-md text-sm font-semibold bg-red-50 text-red-900 border border-red-200';
      feedback.textContent = `✗ ${err instanceof Error ? err.message : 'Error inesperado'}. Escríbeme directamente a jcebrian@grupimedes.com.`;
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = 'Enviar →';
    }
  });

  render();
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] as string));
}
