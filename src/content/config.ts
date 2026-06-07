import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // Título SEO corto (<60 car.) para el <title>; si falta, se usa `title`.
    seoTitle: z.string().max(60).optional(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    category: z.enum(['comunicacion', 'sostenibilidad', 'ia', 'herramientas']),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const services = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().max(60).optional(),
    description: z.string(),
    claim: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    // Cluster temático: enlaza con la `category` del blog para mostrar artículos satélite.
    cluster: z.enum(['comunicacion', 'sostenibilidad', 'ia', 'herramientas']),
    order: z.number().default(0),
    problema: z.object({
      titulo: z.string(),
      body: z.string(),
    }),
    metodo: z
      .array(
        z.object({
          num: z.string(),
          titulo: z.string(),
          body: z.string(),
        })
      )
      .default([]),
    casos: z.array(z.string()).default([]),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        })
      )
      .default([]),
    cta: z.object({
      titulo: z.string(),
      texto: z.string(),
    }),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, services };
