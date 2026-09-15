/**
 * «/robots.txt»: permite rastrear todo y dice dónde está el mapa del sitio.
 *
 * Se genera para que la dirección del mapa salga del dominio configurado en
 * astro.config.mjs y no haya que cambiarla a mano si cambia el dominio.
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap.xml', site ?? new URL('https://spotterapp.es')).href;
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
