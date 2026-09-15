/**
 * Conversión de rutas entre idiomas.
 *
 * El español vive en la raíz («/como-funciona») y el inglés bajo un prefijo
 * («/en/como-funciona»). Estas dos funciones son lo único que sabe eso, para
 * que el selector de idioma y las etiquetas «hreflang» no lo repitan cada una
 * por su cuenta.
 */

import { defaultLocale, isLocale, type Locale } from './index';

/** Quita el prefijo de idioma de una ruta. «/en/contacto» → «/contacto». */
export function pathWithoutLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) segments.shift();
  return `/${segments.join('/')}`;
}

/**
 * Añade el prefijo del idioma a una ruta ya limpia.
 *
 * Siempre termina en barra («/descarga/», «/en/descarga/»). Es la forma en la
 * que Netlify sirve las páginas, y tiene que ser idéntica en la dirección
 * canónica, en los enlaces entre idiomas y en el mapa del sitio: para Google,
 * «/descarga» y «/descarga/» son dos páginas distintas.
 */
export function localizedPath(locale: Locale, pathname: string): string {
  const clean = pathWithoutLocale(pathname);
  const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
  if (locale === defaultLocale) return withSlash;
  // Se evita el «//» cuando la ruta limpia es la raíz.
  return withSlash === '/' ? `/${locale}/` : `/${locale}${withSlash}`;
}
