// Share images (Open Graph) at 1200x630, generated at build time from each
// blog cover. Covers are 16:9 and LinkedIn/WhatsApp crop them to 1.91:1 on
// their own; doing the crop here keeps the frame predictable and the file
// as a plain JPEG under 300 KB, which every network accepts.
import type { APIRoute, GetStaticPaths } from 'astro';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE_DIR = path.resolve('public/blog-images');

export const getStaticPaths = (() =>
  readdirSync(SOURCE_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => ({
      params: { file: f.replace(/\.[^.]+$/, '') },
      props: { source: f },
    }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const image = await sharp(path.join(SOURCE_DIR, props.source))
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/jpeg' } });
};
