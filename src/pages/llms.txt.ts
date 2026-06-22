import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

// /llms.txt — índice en markdown para que los LLM entiendan e indexen la web.
// Estándar: https://llmstxt.org. Se genera desde el contenido, así que siempre está al día.
export async function GET(context: APIContext) {
  const site = context.site?.toString().replace(/\/$/, '') ?? 'https://javicebrian.es';

  const servicios = (await getCollection('services', ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );

  const posts = (await getCollection('blog', ({ data }) => !data.draft && data.pubDate <= new Date()))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const fecha = (d: Date) => d.toISOString().slice(0, 10);

  const lines: string[] = [];
  lines.push('# Javi Cebrián — Comunicación, sostenibilidad e IA con criterio');
  lines.push('');
  lines.push(
    '> Director de Comunicación y Desarrollo de Negocio en Imedes (consultora ambiental). Ayudo a empresas de medio ambiente y de servicios a convertir su trabajo en sostenibilidad e inteligencia artificial en decisiones, reputación y negocio medible. Comunicación con criterio, sostenibilidad que se mide e IA que se usa. Comunica. Decide. Multiplica.'
  );
  lines.push('');
  lines.push(
    `Web oficial: ${site}. Idioma: español (España). Autor: Javi Cebrián. Sectores de referencia: residuos, agua, energía, servicios locales, administración pública y empresas con agenda de sostenibilidad e IA.`
  );
  lines.push('');

  lines.push('## Empieza aquí');
  lines.push(
    `- [Diagnóstico IA + Comunicación en 14 días](${site}/diagnostico/): servicio de entrada de pago. Un mapa priorizado de qué hacer con la IA y la comunicación, qué no, y con qué retorno. Con garantía de devolución.`
  );
  lines.push(`- [Quién soy](${site}/quien-soy/): trayectoria, criterio y las tres palancas (comunicación, sostenibilidad, IA).`);
  lines.push(`- [Servicios](${site}/servicios/): cómo puede ayudar a tu organización.`);
  lines.push(`- [Trabajemos juntos](${site}/trabajemos-juntos/): formulario para plantear un proyecto.`);
  lines.push('');

  lines.push('## Servicios');
  for (const s of servicios) {
    lines.push(`- [${s.data.title}](${site}/${s.slug}/): ${s.data.description}`);
  }
  lines.push('');

  lines.push('## Artículos del blog');
  for (const p of posts) {
    lines.push(`- [${p.data.title}](${site}/blog/${p.slug}/) (${fecha(p.data.pubDate)}): ${p.data.description}`);
  }
  lines.push('');

  lines.push('## Recursos y contacto');
  lines.push(`- [Checklist: 20 controles para comunicar sostenibilidad sin greenwashing](${site}/recursos/checklist-greenwashing/): recurso descargable gratuito.`);
  lines.push(`- [Blog completo](${site}/blog/): todos los artículos.`);
  lines.push(`- [Contacto](${site}/contacto/): para hablar de un proyecto.`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
