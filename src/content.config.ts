/**
 * Colecciones de contenido.
 *
 * Los textos legales viven en Markdown y no dentro de un componente porque los
 * escribe y revisa alguien que no toca código. Cambiar una frase de la política
 * de privacidad no debería obligar a abrir un fichero de maquetación.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const legal = defineCollection({
  // El identificador de cada documento incluye la carpeta, así que queda como
  // «es/privacidad» o «en/privacidad». De ahí se saca el idioma y la ruta.
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    /** Fecha de la última revisión. Se muestra: un texto legal sin fecha no vale. */
    updated: z.coerce.date(),
    /**
     * Marca que el texto todavía no lo ha revisado un profesional.
     *
     * Mientras esté a true, la página pinta un aviso bien visible. Es la forma
     * de que un borrador no acabe publicado por descuido.
     */
    needsLegalReview: z.boolean().default(true),
  }),
});

export const collections = { legal };
