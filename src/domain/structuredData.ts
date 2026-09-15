/**
 * Datos estructurados (JSON-LD) para buscadores.
 *
 * Le cuentan a Google, con un vocabulario que entiende (schema.org), qué es cada
 * cosa: que Spotter es una organización, que tiene una app en iOS y Android,
 * dónde están sus fichas y cuáles son sus preguntas frecuentes. Con eso puede
 * relacionar la web con las tiendas y con Instagram como una misma marca.
 *
 * Son funciones puras que devuelven objetos: no saben nada de HTML. El layout
 * los convierte en etiquetas «script».
 *
 * Lo que no se declara, a propósito:
 * - Precio y valoraciones de la app. Google los exige para la ficha enriquecida
 *   de apps, pero no hay valoraciones reales ni precio confirmado, y marcar datos
 *   que no existen está penalizado. Cuando el equipo confirme el precio, se
 *   añade «offers» en «mobileApplication». Fuente:
 *   https://developers.google.com/search/docs/appearance/structured-data/software-app
 */
import { links } from './links';

/** Lo mínimo que necesitan los datos de cada página. */
export interface PageContext {
  /** Dirección absoluta del sitio, con barra final: «https://spotterapp.es/». */
  siteUrl: string;
  /** Idioma de la página, en formato BCP 47: «es», «en». */
  language: string;
  description: string;
}

/** Identificadores estables para que los objetos se puedan citar entre sí. */
function idFor(siteUrl: string, fragment: string): string {
  return `${siteUrl}#${fragment}`;
}

export function organization(context: PageContext): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': idFor(context.siteUrl, 'organization'),
    name: 'Spotter',
    url: context.siteUrl,
    logo: new URL('brand/simbolo-512.png', context.siteUrl).href,
    // «sameAs» es lo que une la web con los perfiles de la marca en otros sitios.
    sameAs: [links.instagram, links.appStore, links.googlePlay],
  };
}

export function website(context: PageContext): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': idFor(context.siteUrl, 'website'),
    name: 'Spotter',
    url: context.siteUrl,
    inLanguage: ['es', 'en'],
    publisher: { '@id': idFor(context.siteUrl, 'organization') },
  };
}

export function mobileApplication(context: PageContext): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    '@id': idFor(context.siteUrl, 'app'),
    name: 'Spotter',
    description: context.description,
    operatingSystem: 'iOS, Android',
    // Categoría de la lista que admite Google para apps.
    applicationCategory: 'HealthApplication',
    inLanguage: context.language,
    installUrl: [links.appStore, links.googlePlay],
    publisher: { '@id': idFor(context.siteUrl, 'organization') },
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** Las preguntas frecuentes, las mismas que se ven en la página: nunca otras. */
export function faqPage(items: readonly FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
