/**
 * «/sitemap.xml», generado al compilar.
 *
 * La lista de páginas sale de aquí y no se escribe a mano en un fichero para que
 * no se quede vieja: si una página legal deja de ser borrador, entra sola.
 *
 * Quedan fuera las que no se deben indexar: la 404 y los borradores legales.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildSitemap, type SitemapEntry } from '../domain/sitemap';
import { defaultLocale, locales } from '../i18n';
import { localizedPath } from '../i18n/routes';

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL('https://spotterapp.es');

  const reviewedLegalPaths = (await getCollection('legal', ({ id, data }) => id.startsWith('es/') && !data.needsLegalReview)).map(
    (entry) => `/${entry.id.split('/').pop()}`,
  );

  const paths = ['/', '/descarga', ...reviewedLegalPaths];

  const entries: SitemapEntry[] = paths.flatMap((path) => {
    const alternates = [
      ...locales.map((locale) => ({ hreflang: locale, href: new URL(localizedPath(locale, path), origin).href })),
      { hreflang: 'x-default', href: new URL(localizedPath(defaultLocale, path), origin).href },
    ];
    // Una entrada por idioma, y todas con la misma lista de alternativas.
    return locales.map((locale) => ({ loc: new URL(localizedPath(locale, path), origin).href, alternates }));
  });

  return new Response(buildSitemap(entries, new Date()), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
