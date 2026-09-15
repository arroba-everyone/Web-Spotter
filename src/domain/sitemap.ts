/**
 * Contenido del mapa del sitio (sitemap.xml).
 *
 * El mapa le da a Google la lista de páginas que queremos que conozca, con sus
 * versiones en cada idioma. Es una función pura: recibe las rutas y el dominio
 * y devuelve el XML, así que se puede comprobar sin compilar la web.
 *
 * Formato de las alternativas por idioma, según Google:
 * https://developers.google.com/search/docs/specialty/international/localized-versions
 */

export interface SitemapAlternate {
  hreflang: string;
  href: string;
}

export interface SitemapEntry {
  /** Dirección absoluta de la página. */
  loc: string;
  /** Todas sus versiones, incluida ella misma (Google lo exige). */
  alternates: readonly SitemapAlternate[];
}

/** Escapa lo que no puede ir tal cual dentro de un XML. */
function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function buildSitemap(entries: readonly SitemapEntry[], lastModified: Date): string {
  const date = lastModified.toISOString().slice(0, 10);

  const urls = entries.map((entry) => {
    const alternates = entry.alternates
      .map(
        (alternate) =>
          `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeXml(alternate.href)}"/>`,
      )
      .join('\n');

    return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${date}</lastmod>\n${alternates}\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
