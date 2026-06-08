# Infraestructura — javicebrian.es

Configuración de despliegue para el VPS Hostinger (Ubuntu 24.04, KVM 2).

El despliegue se hace con **Dokploy** sobre Docker (mismo VPS que el CRM Imedes).
Dokploy hace pull de la rama `main` en GitHub y construye una imagen limpia con el
`Dockerfile` de cada app. El deploy lo dispara Javi con el botón **Deploy / Redeploy**
en el panel de Dokploy.

## Arquitectura

```
                    Cloudflare (CDN + DNS)
                              │
                              ▼
                   Traefik (Dokploy) :80/:443
                   (termina SSL, enruta por host)
                              │
              ┌───────────────┴────────────────┐
              ▼                                ▼
    App "web" (contenedor)          App "contact" (contenedor)
    nginx Alpine sirve dist/        Node :3001 — Express + Resend
    (HTML estáticos Astro)          (formulario de contacto)
```

Las dos apps son contenedores independientes en Dokploy, ambos construidos desde
este mismo repo. Traefik (incluido en Dokploy) termina SSL con Let's Encrypt y
enruta el tráfico por host/path a cada contenedor. Cloudflare queda delante como
CDN + DNS.

## Estructura de archivos

```
infra/
├── README.md                          ← este archivo
├── nginx-container.conf               ← config nginx del contenedor web (301 + caché)
├── nginx-javicebrian.conf             ← LEGACY: config nginx nativo del VPS (pre-Dokploy)
└── contact-server/
    ├── Dockerfile                     ← imagen del microservicio (Dokploy)
    ├── package.json                   ← dependencias Node
    ├── server.js                      ← microservicio Express + Resend
    ├── .env.example                   ← plantilla de variables (referencia)
    └── javicebrian-contact.service    ← LEGACY: unidad systemd (pre-Dokploy)

Dockerfile                             ← (raíz) imagen de la web estática (Dokploy)
```

## Despliegue (Dokploy)

Ambas apps siguen el mismo ciclo: push a `main` → Deploy en Dokploy.

### 1. Web estática Astro (app "web")

- **Origen**: rama `main` de este repo en GitHub.
- **Build**: `Dockerfile` de la raíz. Es multistage:
  1. `node:20-alpine` instala dependencias con `npm ci` y compila el sitio con
     `npm run build` (genera `dist/`).
  2. `nginx:1.27-alpine` copia `infra/nginx-container.conf` como config y sirve
     `dist/` en el puerto 80. nginx aplica los 301 de preservación SEO; **no**
     gestiona SSL ni reverse proxy (de eso se encarga Traefik).
- El `.dockerignore` excluye `infra/contact-server`, `dist`, `node_modules`,
  `.git`, etc., así que el contenedor de la web solo lleva el código necesario y
  hace build limpio.

**Para desplegar un cambio**: hacer push a `main` y pulsar **Redeploy** en la app
"web" de Dokploy. Dokploy reconstruye la imagen y levanta el contenedor nuevo.

### 2. Microservicio de contacto (app "contact")

- **Origen**: misma rama `main`, subcarpeta `infra/contact-server/`.
- **Build**: `infra/contact-server/Dockerfile` (`node:20-alpine`, `npm ci --omit=dev`,
  arranca con `node server.js`, expone el puerto 3001).
- **Variables de entorno**: se configuran en el panel de Dokploy (no en un `.env`
  del VPS). Ver `contact-server/.env.example` como referencia de qué se necesita:
  - `RESEND_API_KEY` — API key de Resend
  - `RESEND_FROM` — dirección verificada en Resend (ej. `web@javicebrian.es`)
  - `RESEND_TO` — destino del lead
  - `TURNSTILE_SECRET` — Cloudflare Turnstile secret (si está activo)
  - `PORT` — opcional, default 3001

**Para desplegar un cambio**: push a `main` y **Redeploy** en la app "contact".

### 3. Enrutado y SSL (Traefik)

Traefik viene con Dokploy y se configura desde su panel:

- Termina SSL con Let's Encrypt (renovación automática) para `javicebrian.es` y
  `www.javicebrian.es`.
- Enruta por host hacia el contenedor de la web.
- El `/api/contact` puede enrutarse a la app "contact" directamente desde Traefik
  (por host/path) o, alternativamente, vía proxy desde nginx (regla comentada en
  `nginx-container.conf`).

La canonicalización `www → apex` la hace nginx dentro del contenedor web
(`nginx-container.conf`), porque Traefik reenvía ambos hosts al mismo contenedor.

### 4. Cloudflare (recomendado)

1. Añadir el dominio `javicebrian.es` en el panel de Cloudflare.
2. Cambiar los DNS de Hostinger a los de Cloudflare (Cloudflare te los da en el setup).
3. En SSL/TLS → modo "Full (strict)".
4. En Speed → activar Auto Minify (HTML, CSS, JS) y Brotli.
5. En Caching → Standard.
6. Listo: ahora Cloudflare está delante del VPS con CDN global gratis.

## Variables de entorno de Resend

Antes de que el contact-server pueda enviar correos:

1. **Crear cuenta en Resend** en https://resend.com (gratis hasta 3.000 emails/mes).
2. **Verificar el dominio** `javicebrian.es` en Resend → DNS → añadir los 3 registros TXT/MX/CNAME que te indiquen.
3. **Crear API key** en Resend → API Keys → "Web javicebrian.es" con permisos solo de envío.
4. **Configurar `From` verificado**, ej. `web@javicebrian.es`.
5. Copiar la key a las **env vars de la app "contact" en Dokploy** (no a un `.env`
   del VPS).

## Plan de redirecciones 301 implementadas

Las reglas viven en `nginx-container.conf` (config del contenedor web).

| Origen (URL antigua WP) | Destino (Astro) | Motivo |
|---|---|---|
| `/blog-director-comunicacion-valencia/` | `/blog/` | Slug largo SEO antiguo del listado |
| `/blog-director-comunicacion/` | `/blog/` | Cornerstone antiguo no migrado |
| `/contacto-director-comunicacion-valencia/` | `/contacto/` | Slug largo SEO antiguo |
| `/terms-and-conditions/` | `/aviso-legal/` | Página huérfana en inglés desde 2022 |

Además, los 12 posts del blog se redirigen de `/<slug>/` (WordPress) a
`/blog/<slug>/` (Astro) con reglas explícitas en `nginx-container.conf`, y hay
reglas genéricas para `/category/`, `/tag/` y `/author/`.

## Cómo verificar las redirecciones tras el cutover

```bash
# Cada redirección debe devolver 301
for url in /blog-director-comunicacion-valencia/ /blog-director-comunicacion/ /contacto-director-comunicacion-valencia/ /terms-and-conditions/; do
  echo "=== $url ==="
  curl -sI "https://javicebrian.es$url" | head -3
done
```

Resultado esperado en cada caso:
```
HTTP/2 301
location: https://javicebrian.es/<destino>/
```

## Método antiguo (legacy, pre-Dokploy)

> Conservado solo como referencia histórica. **Ya no se usa.** El despliegue
> actual es vía Dokploy (ver arriba).

Antes de Dokploy, la web se desplegaba con `rsync` de `dist/` al VPS y el
microservicio corría como servicio systemd con nginx nativo terminando SSL:

```bash
# Web estática: build local + rsync (DEPRECATED)
npm run build
rsync -avz --delete dist/ root@72.60.214.52:/var/www/javicebrian.es/

# Contact-server: rsync + systemd (DEPRECATED)
rsync -avz infra/contact-server/ root@72.60.214.52:/var/www/javicebrian.es-contact/
sudo cp javicebrian-contact.service /etc/systemd/system/
sudo systemctl enable --now javicebrian-contact

# SSL: certbot sobre nginx nativo (DEPRECATED — ahora lo hace Traefik)
sudo certbot --nginx -d javicebrian.es -d www.javicebrian.es
```

Los archivos `nginx-javicebrian.conf` y `contact-server/javicebrian-contact.service`
pertenecen a este flujo antiguo y pueden eliminarse cuando se confirme que ya no
hacen falta.

## Pendiente

- **Healthcheck** de Uptime Kuma o similar para alertar si el VPS o alguna de las
  apps caen.
- **Plausible self-hosted** (cuando el CRM Imedes se mude del VPS).
- *(Opcional)* Auto-deploy en Dokploy al hacer push a `main` mediante webhook de
  GitHub, si se decide quitar el paso manual de Redeploy. Hoy el deploy es manual
  a propósito.
