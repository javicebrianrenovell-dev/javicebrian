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
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { calcularScore, mensajeRespuesta, VALORES_VALIDOS } from './lead-score.js';

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://javicebrian.es';
const LEADS_FILE = process.env.LEADS_FILE || '/var/lib/javicebrian/leads.jsonl';

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

app.post('/api/lead-cualificado', async (req, res) => {
  try {
    const {
      organizacion,
      encargo,
      plazo,
      presupuesto,
      nombre,
      email,
      telefono,
      empresa,
      contexto,
      rgpd,
      _hp,
    } = req.body || {};

    if (_hp) return res.status(200).json({ ok: true, tier: 'GREEN' });

    if (!nombre || !email || !rgpd) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Email no válido.' });
    }
    if (!VALORES_VALIDOS.organizacion.includes(organizacion)
        || !VALORES_VALIDOS.encargo.includes(encargo)
        || !VALORES_VALIDOS.plazo.includes(plazo)
        || !VALORES_VALIDOS.presupuesto.includes(presupuesto)) {
      return res.status(400).json({ error: 'Respuestas no válidas.' });
    }
    if (contexto && contexto.length > 5000) {
      return res.status(400).json({ error: 'Contexto demasiado largo.' });
    }

    const { score, tier, breakdown, etiquetas } = calcularScore({
      organizacion, encargo, plazo, presupuesto,
    });
    const respuesta = mensajeRespuesta(tier);
    const recibidoEn = new Date().toISOString();

    const safe = (s) => String(s ?? '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

    const leadRecord = {
      ts: recibidoEn,
      score, tier,
      organizacion, encargo, plazo, presupuesto,
      nombre, email, telefono: telefono || null,
      empresa: empresa || null,
      contexto: contexto || null,
      ip: (req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress) ?? null,
    };

    try {
      mkdirSync(dirname(LEADS_FILE), { recursive: true });
      appendFileSync(LEADS_FILE, JSON.stringify(leadRecord) + '\n');
    } catch (e) {
      console.error('No se pudo persistir lead:', e.message);
    }

    const tierColor = tier === 'GREEN' ? '#8DBE3F' : tier === 'YELLOW' ? '#E6A623' : '#A0A0A0';
    const html = `
<!doctype html>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, sans-serif; color: #1A1A1A; max-width: 640px; margin: 0 auto; padding: 20px; }
  h2 { color: ${tierColor}; margin: 0 0 4px 0; }
  .tier-badge { display: inline-block; background: ${tierColor}; color: ${tier === 'YELLOW' ? '#1A1A1A' : '#FFFFFF'}; padding: 6px 14px; font-size: 12px; font-weight: 700; letter-spacing: 1px; border-radius: 4px; }
  .meta { color: #6B6B6B; font-size: 13px; margin: 4px 0 20px 0; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  td { padding: 8px 4px; border-bottom: 1px solid #E5E5E0; vertical-align: top; }
  td:first-child { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6B6B6B; width: 38%; }
  td.pts { text-align: right; color: #6B6B6B; font-variant-numeric: tabular-nums; }
  .ctx { background: #FAFAF7; padding: 14px; border-left: 4px solid ${tierColor}; white-space: pre-wrap; margin-top: 8px; }
  .actions a { display: inline-block; margin-right: 12px; padding: 10px 16px; background: #1A1A1A; color: #FFFFFF !important; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 600; }
  .actions a.cta-primary { background: ${tierColor}; color: ${tier === 'YELLOW' ? '#1A1A1A' : '#FFFFFF'} !important; }
</style>
<p><span class="tier-badge">${tier} · ${score}/100</span></p>
<h2>${safe(nombre)}${empresa ? ` — ${safe(empresa)}` : ''}</h2>
<p class="meta">Recibido el ${new Date(recibidoEn).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>

<table>
  <tr><td>Organización</td><td>${safe(etiquetas.organizacion)}</td><td class="pts">+${breakdown.organizacion}</td></tr>
  <tr><td>Encargo</td><td>${safe(etiquetas.encargo)}</td><td class="pts">+${breakdown.encargo}</td></tr>
  <tr><td>Plazo</td><td>${safe(etiquetas.plazo)}</td><td class="pts">+${breakdown.plazo}</td></tr>
  <tr><td>Presupuesto</td><td>${safe(etiquetas.presupuesto)}</td><td class="pts">+${breakdown.presupuesto}</td></tr>
</table>

<table>
  <tr><td>Email</td><td><a href="mailto:${safe(email)}">${safe(email)}</a></td></tr>
  ${telefono ? `<tr><td>Teléfono</td><td><a href="tel:${safe(telefono)}">${safe(telefono)}</a></td></tr>` : ''}
</table>

${contexto ? `<p style="margin-top: 20px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6B6B6B;">Contexto</p><div class="ctx">${safe(contexto)}</div>` : ''}

<p class="actions" style="margin-top: 28px;">
  <a class="cta-primary" href="mailto:${safe(email)}?subject=Re%3A%20Tu%20consulta%20en%20javicebrian.es">Responder por email</a>
  ${telefono ? `<a href="tel:${safe(telefono)}">Llamar</a>` : ''}
</p>
`;

    const subject = `[${tier} · ${score}] ${etiquetas.encargo} — ${nombre}${empresa ? ` (${empresa})` : ''}`;

    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'web@javicebrian.es',
      to: process.env.CONTACT_TO_EMAIL || 'jcebrian@grupimedes.com',
      replyTo: email,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error (lead):', error);
      return res.status(502).json({ error: 'Error enviando email. Inténtalo más tarde.' });
    }

    return res.json({ ok: true, tier, mensaje: respuesta });
  } catch (e) {
    console.error('Lead handler error:', e);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Contact server listening on :${PORT}`);
});
