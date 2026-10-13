/**
 * Portada — movimiento ligado al desplazamiento (GSAP + ScrollTrigger)
 *
 * Complementa a animations.ts (Motion: entradas, magnéticos). Aquí solo va
 * lo que depende de la posición de scroll:
 *
 * 1. Hero — el titular se retira y el monograma gira al salir de pantalla
 * 2. Manifiesto — las líneas se iluminan al ritmo del scroll (reversible)
 * 3. Pilares — el número gigante se desplaza a otra velocidad que el texto
 *
 * Solo transform, opacity y color. Con prefers-reduced-motion no se crea nada.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let mm: gsap.MatchMedia | undefined;

export function destroyHomeScroll(): void {
  mm?.revert();
  mm = undefined;
}

export function initHomeScroll(): void {
  destroyHomeScroll();

  const hero = document.querySelector<HTMLElement>('[data-home-hero]');
  if (!hero) return;

  mm = gsap.matchMedia();
  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
    },
    context => {
      const { desktop } = context.conditions as { desktop: boolean };

      // Los ScrollTrigger se crean en el orden en que aparecen en la página.

      // 1. Hero
      if (desktop) {
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
          })
          .to('[data-hero-title]', { yPercent: -10, opacity: 0.3 }, 0)
          .to('[data-hero-mono]', { y: 180, rotation: -14 }, 0);
      }

      // 2. Manifiesto
      const quote = document.querySelector<HTMLElement>('[data-scrub-quote]');
      if (quote) {
        gsap
          .timeline({
            scrollTrigger: { trigger: quote, start: 'top 80%', end: 'bottom 55%', scrub: 0.4 },
          })
          .fromTo(
            quote.querySelectorAll('[data-scrub-line]'),
            // Tenue pero legible (>=4.4:1 sobre el fondo), igual que el line-reveal del resto del sitio.
            { color: 'rgba(250, 250, 247, 0.55)' },
            { color: 'rgb(250, 250, 247)', ease: 'none', duration: 1, stagger: 0.6 }
          );
      }

      // 3. Pilares
      if (desktop) {
        gsap.utils.toArray<HTMLElement>('[data-pilar-num]').forEach(num => {
          gsap.fromTo(
            num,
            { yPercent: 14 },
            {
              yPercent: -14,
              ease: 'none',
              scrollTrigger: {
                trigger: num.closest('section'),
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          );
        });
      }
    }
  );

  // Las tipografías cambian la altura de los bloques al cargar.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
