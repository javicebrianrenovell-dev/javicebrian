# Infraestructura — javicebrian.es

Configuración de despliegue para el VPS Hostinger (Ubuntu 24.04, KVM 2).

## Arquitectura

```
                    Cloudflare (CDN + DNS)
                              │
                              ▼
                   nginx :80/:443 (Let's Encrypt)
                              │
              ┌───────────────┴────────────────┐
              ▼                                ▼
    HTML estáticos Astro              Microservicio Node :3001
    /var/www/javicebrian.es           /var/www/javicebrian.es-contact
                                      (formulario contacto vía Resend)
```

## Estructura de archivos

```
infra/
├── README.md                          ← este archivo
├── nginx-javicebrian.conf             ← config nginx (redirects + proxy /api)
└── contact-server/
    ├── package.json                   ← dependencias Node
    ├── server.js                      ← microservicio Express + Resend
    ├── .env.example                   ← plantilla variables de entorno
    └── javicebrian-contact.service    ← unidad systemd
```

## Pasos de despliegue (resumen)

### 1. Web estática Astro

```bash
# En tu Mac: build local
npm run build

# Subir contenido de dist/ al VPS por rsync
rsync -avz --delete dist/ root@72.60.214.52:/var/www/javicebrian.es/
```

(En producción esto se automatizará con GitHub Actions — ver siguiente sección).

### 2. Microservicio de contacto

```bash
# En el VPS
sudo mkdir -p /var/www/javicebrian.es-contact
sudo chown -R www-data:www-data /var/www/javicebrian.es-contact

# Copiar contact-server/ al VPS
rsync -avz infra/contact-server/ root@72.60.214.52:/var/www/javicebrian.es-contact/

# En el VPS: instalar dependencias
cd /var/www/javicebrian.es-contact
sudo -u www-data npm install --omit=dev

# Crear .env (copiar desde .env.example y rellenar)
sudo -u www-data cp .env.example .env
sudo -u www-data nano .env

# Instalar como servicio systemd
sudo cp javicebrian-contact.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable javicebrian-contact
sudo systemctl start javicebrian-contact
sudo systemctl status javicebrian-contact

# Comprobar que responde:
curl http://127.0.0.1:3001/health
```

### 3. nginx + SSL

```bash
# Instalar nginx y certbot si no están
sudo apt install -y nginx certbot python3-certbot-nginx

# Copiar configuración
sudo cp infra/nginx-javicebrian.conf /etc/nginx/sites-available/javicebrian.es
sudo ln -s /etc/nginx/sites-available/javicebrian.es /etc/nginx/sites-enabled/

# Validar y recargar
sudo nginx -t
sudo systemctl reload nginx

# Generar SSL con Let's Encrypt (renovación automática incluida)
sudo certbot --nginx -d javicebrian.es -d www.javicebrian.es
```

### 4. Cloudflare (recomendado)

1. Añadir el dominio `javicebrian.es` en el panel de Cloudflare.
2. Cambiar los DNS de Hostinger a los de Cloudflare (Cloudflare te los da en el setup).
3. En SSL/TLS → modo "Full (strict)".
4. En Speed → activar Auto Minify (HTML, CSS, JS) y Brotli.
5. En Caching → Standard.
6. Listo: ahora Cloudflare está delante del VPS con CDN global gratis.

## Variables de entorno de Resend

Antes de arrancar el contact-server hay que:

1. **Crear cuenta en Resend** en https://resend.com (gratis hasta 3.000 emails/mes).
2. **Verificar el dominio** `javicebrian.es` en Resend → DNS → añadir los 3 registros TXT/MX/CNAME que te indiquen.
3. **Crear API key** en Resend → API Keys → "Web javicebrian.es" con permisos solo de envío.
4. **Configurar `From` verificado**, ej. `web@javicebrian.es`.
5. Copiar la key al `.env` del microservicio en el VPS.

## Plan de redirecciones 301 implementadas

| Origen (URL antigua WP) | Destino (Astro) | Motivo |
|---|---|---|
| `/blog-director-comunicacion-valencia/` | `/blog/` | Slug largo SEO antiguo del listado |
| `/blog-director-comunicacion/` | `/blog/` | Cornerstone antiguo no migrado |
| `/contacto-director-comunicacion-valencia/` | `/contacto/` | Slug largo SEO antiguo |
| `/terms-and-conditions/` | `/aviso-legal/` | Página huérfana en inglés desde 2022 |

Las URLs de los 12 posts del blog conservan su slug original, no requieren redirección.

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

## Pendiente para Oleada 4 (CI/CD)

- GitHub Actions que build + rsync al VPS automáticamente al hacer push a `main`.
- Healthcheck de Uptime Kuma o similar para alertar si el VPS o el microservicio caen.
- Plausible self-hosted (cuando el CRM Imedes se mude del VPS).
