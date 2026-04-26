/**
 * Sistema de animaciones — Nivel B
 *
 * 1. Hero stagger on load — líneas del titular aparecen en cadencia
 * 2. Parallax scroll — monograma decorativo flota
 * 3. Reveal on scroll — bloques aparecen al entrar viewport
 * 4. Pillars stagger — los 3 pilares entran en secuencia
 * 5. Line reveal — manifiesto se ilumina línea a línea con scroll
 * 6. Magnetic buttons — CTAs atraen el cursor
 *
 * Stack: Motion One (3 KB) + Intersection Observer nativo.
 * Respeta prefers-reduced-motion.
 */

import { animate, inView } from 'motion';

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]; // cubic-bezier "easeOutExpo"
const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 1. Hero stagger on load
 * Aplica fade+up secuencial a los elementos con data-stagger-line en el hero.
 */
function initHeroStagger(): void {
  if (reducedMotion()) {
    document.querySelectorAll<HTMLElement>('[data-stagger-line]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  const lines = document.querySelectorAll<HTMLElement>('[data-stagger-line]');
  lines.forEach((line, i) => {
    animate(
      line,
      { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] },
      { duration: 0.85, delay: 0.1 + i * 0.13, ease: easing }
    );
  });
}

/**
 * 2. Parallax scroll
 * Mueve elementos con data-parallax="0.3" según scroll vertical.
 */
function initParallax(): void {
  if (reducedMotion()) return;

  const els = document.querySelectorAll<HTMLElement>('[data-parallax]');
  if (!els.length) return;

  let ticking = false;
  const update = () => {
    const scrollY = window.scrollY;
    els.forEach(el => {
      const speed = parseFloat(el.dataset.parallax || '0.3');
      el.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
    });
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
}

/**
 * 3. Reveal on scroll
 * Bloques con data-reveal aparecen con fade+up al entrar viewport.
 */
function initRevealOnScroll(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!els.length) return;

  if (reducedMotion()) {
    els.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  els.forEach(el => {
    inView(
      el,
      () => {
        animate(
          el,
          { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] },
          { duration: 0.75, ease: easing }
        );
      },
      { amount: 0.2 }
    );
  });
}

/**
 * 4. Pillars stagger
 * Los pilares (data-pillar) entran en secuencia cuando su contenedor (data-pillars-group) entra viewport.
 */
function initPillarsStagger(): void {
  const groups = document.querySelectorAll<HTMLElement>('[data-pillars-group]');
  if (!groups.length) return;

  if (reducedMotion()) {
    document.querySelectorAll<HTMLElement>('[data-pillar]').forEach(p => {
      p.style.opacity = '1';
      p.style.transform = 'none';
    });
    return;
  }

  groups.forEach(group => {
    const pillars = group.querySelectorAll<HTMLElement>('[data-pillar]');
    inView(
      group,
      () => {
        pillars.forEach((p, i) => {
          animate(
            p,
            { opacity: [0, 1], transform: ['translateY(36px)', 'translateY(0px)'] },
            { duration: 0.75, delay: i * 0.15, ease: easing }
          );
        });
      },
      { amount: 0.3 }
    );
  });
}

/**
 * 5. Line reveal en manifiesto
 * Cada línea con data-line-reveal arranca atenuada y se ilumina al entrar viewport.
 */
function initLineReveal(): void {
  const lines = document.querySelectorAll<HTMLElement>('[data-line-reveal]');
  if (!lines.length) return;

  if (reducedMotion()) {
    lines.forEach(l => l.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  lines.forEach(line => observer.observe(line));
}

/**
 * 6. Magnetic buttons
 * El cursor atrae sutilmente los elementos con data-magnetic dentro de su radio.
 */
function initMagneticButtons(): void {
  if (reducedMotion()) return;
  if (window.matchMedia('(hover: none)').matches) return; // skip en touch

  const buttons = document.querySelectorAll<HTMLElement>('[data-magnetic]');
  buttons.forEach(btn => {
    const strength = parseFloat(btn.dataset.magnetic || '0.25');
    let raf = 0;

    btn.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        btn.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    });

    btn.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      animate(
        btn,
        { transform: 'translate3d(0px, 0px, 0)' },
        { duration: 0.6, ease: easing }
      );
    });
  });
}

/**
 * 7. Mask-up reveal
 * Texto que sube desde una máscara (clip overflow). Cinematográfico.
 */
function initMaskUp(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-mask-up]');
  if (!els.length) return;

  if (reducedMotion()) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }

  els.forEach(el => {
    const delay = parseInt(el.dataset.delay || '0', 10);
    inView(
      el,
      () => {
        setTimeout(() => el.classList.add('is-in'), delay);
      },
      { amount: 0.2 }
    );
  });
}

/**
 * 8. Scale-in
 */
function initScaleIn(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-scale-in]');
  if (!els.length) return;

  if (reducedMotion()) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }

  els.forEach(el => {
    const delay = parseInt(el.dataset.delay || '0', 10);
    inView(
      el,
      () => {
        setTimeout(() => el.classList.add('is-in'), delay);
      },
      { amount: 0.2 }
    );
  });
}

/**
 * Init de todas las animaciones.
 * Se llama al cargar y tras cada View Transition de Astro.
 */
export function initAnimations(): void {
  initHeroStagger();
  initParallax();
  initRevealOnScroll();
  initPillarsStagger();
  initLineReveal();
  initMagneticButtons();
  initMaskUp();
  initScaleIn();
}
