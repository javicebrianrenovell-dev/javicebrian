/**
 * Microservicio de contacto — javicebrian.es
 *
 * Recibe POST a /api/contact desde el formulario web,
 * valida los campos y envía un email vía Resend.
 *
 * Variables de entorno requeridas:
 * - RESEND_API_KEY     → clave API de Resend (https://resend.com)
 * - CONTACT_TO_EMAIL   → email destino (ej. jcebrian@grupimedes.com)
 * - CONTACT_FROM_EMAIL → email remitente verificado en Resend
 * - PORT               → puerto (default: 3001)
 * - ALLOWED_ORIGIN     → dominio permitido CORS (default: https://javicebrian.es)
 */

import express from 'express';
import { Resend } from 'resend';

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://javicebrian.es';

if (!process.env.RESEND_API_KEY) {
  console.error('ERROR: falta RESEND_API_KEY en variables de entorno');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();

app.use(express.json({ limit: '64kb' }));

// CORS — solo dominio configurado
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// Rate limiting básico en memoria (1 req cada 30s por IP)
const rateLimit = new Map();
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const now = Date.now();
  const last = rateLimit.get(ip) || 0;
  if (now - last < 30_000) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Espera un momento.' });
  }
  rateLimit.set(ip, now);
  // Limpieza ocasional
  if (rateLimit.size > 1000) {
    for (const [k, v] of rateLimit.entries()) {
      if (now - v > 60_000) rateLimit.delete(k);
    }
  }
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true, service: 'contact', ts: Date.now() }));

app.post('/api/contact', async (req, res) => {
  try {
    const { tipo, nombre, email, organizacion, mensaje, rgpd, _hp } = req.body || {};

    // Honeypot anti-bots
    if (_hp) return res.status(200).json({ ok: true });

    // Validación básica
    if (!tipo || !nombre || !email || !mensaje || !rgpd) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Email no válido.' });
    }
    if (mensaje.length > 5000) {
      return res.status(400).json({ error: 'Mensaje demasiado largo.' });
    }

    const tipoLabel = {
      colaboraciones: 'Colaboración',
      asesoramiento: 'Asesoramiento',
      formacion: 'Formación',
      otro: 'Otro',
    }[tipo] || tipo;

    const safe = (s) => String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

    const html = `
<!doctype html>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, sans-serif; color: #1A1A1A; max-width: 600px; margin: 0 auto; padding: 20px; }
  h2 { color: #8DBE3F; }
  .meta { color: #6B6B6B; font-size: 13px; }
  .field { margin: 16px 0; }
  .field strong { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6B6B6B; margin-bottom: 4px; }
  .mensaje { background: #FAFAF7; padding: 16px; border-left: 4px solid #8DBE3F; white-space: pre-wrap; }
</style>
<h2>Nuevo contacto desde javicebrian.es</h2>
<p class="meta">Tipo: <strong>${safe(tipoLabel)}</strong></p>
<div class="field"><strong>Nombre</strong>${safe(nombre)}</div>
<div class="field"><strong>Email</strong><a href="mailto:${safe(email)}">${safe(email)}</a></div>
${organizacion ? `<div class="field"><strong>Organización</strong>${safe(organizacion)}</div>` : ''}
<div class="field">
  <strong>Mensaje</strong>
  <div class="mensaje">${safe(mensaje)}</div>
</div>
<p class="meta" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E5E0;">Recibido el ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
`;

    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'web@javicebrian.es',
      to: process.env.CONTACT_TO_EMAIL || 'jcebrian@grupimedes.com',
      replyTo: email,
      subject: `[Web] ${tipoLabel} — ${nombre}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({ error: 'Error enviando email. Inténtalo más tarde.' });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('Contact handler error:', e);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Contact server listening on :${PORT}`);
});
