# javicebrian.es — Astro

Sitio web de marca personal de Javi Cebrián construido con Astro + Tailwind CSS 4.

## Stack

- **Framework:** Astro 5 (output estático)
- **Estilos:** Tailwind CSS 4 + CSS variables (paleta B + tipografía Inter/Bebas Neue)
- **Tipo:** TypeScript estricto
- **Plugins:** @astrojs/sitemap, @astrojs/rss

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # arrancar dev server (http://localhost:4321)
npm run build      # generar /dist con la web estática
npm run preview    # previsualizar /dist localmente
```

## Estructura

```
src/
├── content/blog/     ← posts en Markdown (oleada 2)
├── components/       ← Header, Footer, Monograma
├── layouts/          ← BaseLayout, BlogLayout
├── pages/            ← rutas de la web
└── styles/global.css ← tokens de marca + Tailwind
```

## Marca

- Manual de marca v1.1 en `../../../proyecto-marca-personal-javicebrian/manual-marca/`
- Logo concepto 2C — paquete completo en `../../../proyecto-marca-personal-javicebrian/assets/logos/final/`
- Paleta B: Verde Imedes #8DBE3F · Negro carbón #1A1A1A · Blanco roto #FAFAF7

## Hoja de ruta

- [x] **Oleada 1** — setup, sistema de diseño, home, quien-soy, contacto, 404, blog placeholder
- [ ] Oleada 2 — migración de los 13 posts del blog (Markdown)
- [ ] Oleada 3 — API endpoint contacto con Resend, páginas legales
- [ ] Oleada 4 — build final + plan de redirecciones 301
- [ ] Despliegue al VPS Hostinger (cuando se mude el CRM Imedes)
