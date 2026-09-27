import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // Título SEO corto (<60 car.) para el <title>; si falta, se usa `title`.
    seoTitle: z.string().max(60).optional(),
    description: z.string(),
    // Respuesta directa a la pregunta del artículo, en 40-70 palabras. Es el bloque
    // que un motor de respuesta extrae y cita: va bajo el H1 y como `abstract` en
    // el esquema. Sin él, el artículo solo se puede citar entero, y no se cita.
    enCorto: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    // Portada generada con IA que muestra a una persona real (p. ej. el personaje
    // entrenado de Javi). El Reglamento europeo de IA (art. 50.4) obliga a avisar:
    // se pinta un pie visible bajo la imagen.
    heroAI: z.boolean().default(false),
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
    // Perfiles para los que tiene sentido el servicio (P3 — orientación a decisión).
    paraQuien: z.array(z.string()).default([]),
    // Entregables concretos que se llevan al cliente (P3 — qué incluye).
    entregables: z.array(z.string()).default([]),
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
