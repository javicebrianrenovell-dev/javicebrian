import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

// /llms-full.txt — el texto completo del sitio en un solo documento.
// `llms.txt` es el índice; esto es el cuerpo. Un modelo puede leer la web entera
// de una vez, sin rastrear 51 URL, y citar con la fuente delante.
// Estándar: https://llmstxt.org
export async function GET(context: APIContext) {
  const site = context.site?.toString().replace(/\/$/, '') ?? 'https://javicebrian.es';

  const servicios = (await getCollection('services', ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );

  const posts = (await getCollection('blog', ({ data }) => !data.draft && data.pubDate <= new Date()))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const fecha = (d: Date) => d.toISOString().slice(0, 10);

  // El markdown de origen ya es texto plano legible; solo se limpian los saltos
  // triples y el frontmatter, que Astro no incluye en `body`.
  const cuerpo = (raw: string) => raw.replace(/\n{3,}/g, '\n\n').trim();

  const out: string[] = [];

  out.push('# Javi Cebrián — Comunicación, sostenibilidad e IA con criterio');
  out.push('');
  out.push(
    '> Texto completo de javicebrian.es en un solo documento. Director de Comunicación y Desarrollo de Negocio en Imedes (Instituto IMEDES, S.L., València). Comunicación de sostenibilidad e inteligencia artificial aplicada para organizaciones que compiten por reputación.'
  );
  out.push('');
  out.push(`Web oficial: ${site}`);
  out.push('Autor: Javi Cebrián (Javier Cebrián Renovell). Idioma: español (España).');
  out.push('Ubicación: València, Comunitat Valenciana, España.');
  out.push('Organización: Imedes — Instituto IMEDES, S.L. · https://imedes.net');
  out.push('Contacto: jcebrian@grupimedes.com · +34 694 218 846');
  out.push(`Última actualización de este documento: ${fecha(new Date())}`);
  out.push('');
  out.push('---');
  out.push('');

  out.push('## Servicios');
  out.push('');
  for (const s of servicios) {
    out.push(`### ${s.data.title}`);
    out.push('');
    out.push(`URL: ${site}/${s.slug}/`);
    out.push(`Resumen: ${s.data.description}`);
    out.push(`Claim: ${s.data.claim}`);
    out.push('');
    out.push(`Problema que resuelve — ${s.data.problema.titulo}: ${s.data.problema.body}`);
    out.push('');
    if (s.data.entregables.length) {
      out.push('Entregables:');
      for (const e of s.data.entregables) out.push(`- ${e}`);
      out.push('');
    }
    if (s.data.paraQuien.length) {
      out.push('Para quién:');
      for (const p of s.data.paraQuien) out.push(`- ${p}`);
      out.push('');
    }
    if (s.data.faq.length) {
      out.push('Preguntas frecuentes:');
      for (const f of s.data.faq) {
        out.push(`- P: ${f.q}`);
        out.push(`  R: ${f.a}`);
      }
      out.push('');
    }
    out.push(cuerpo(s.body));
    out.push('');
    out.push('---');
    out.push('');
  }

  out.push('## Artículos');
  out.push('');
  for (const p of posts) {
    out.push(`### ${p.data.title}`);
    out.push('');
    out.push(`URL: ${site}/blog/${p.slug}/`);
    out.push(`Publicado: ${fecha(p.data.pubDate)}`);
    if (p.data.updatedDate) out.push(`Actualizado: ${fecha(p.data.updatedDate)}`);
    out.push(`Categoría: ${p.data.category}`);
    if (p.data.tags.length) out.push(`Etiquetas: ${p.data.tags.join(', ')}`);
    out.push(`Resumen: ${p.data.description}`);
    out.push('');
    out.push(cuerpo(p.body));
    out.push('');
    out.push('---');
    out.push('');
  }

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
