/**
 * Punto de entrada del multiidioma.
 *
 * Los componentes no importan «es» ni «en» directamente: piden el diccionario
 * del idioma en el que se está renderizando y trabajan contra la misma forma.
 */

import { es, type Dictionary } from './es';
import { en } from './en';

/** Idiomas que publica el sitio. Debe coincidir con «i18n.locales» de la config. */
export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

const dictionaries: Record<Locale, Dictionary> = { es, en };

/**
 * Devuelve los textos del idioma pedido.
 *
 * Acepta «string | undefined» porque «Astro.currentLocale» puede venir sin
 * definir en rutas que no cuelgan de un idioma (por ejemplo la página 404).
 * En ese caso se cae al español, que es el idioma por defecto del sitio.
 */
export function useTranslations(locale: string | undefined): Dictionary {
  return isLocale(locale) ? dictionaries[locale] : dictionaries[defaultLocale];
}

/** Comprueba que una cadena cualquiera sea uno de los idiomas del sitio. */
export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export type { Dictionary };
