/**
 * Enlaces externos del sitio, todos en un único fichero.
 *
 * Están aquí y no repartidos por los componentes porque cambian por motivos
 * ajenos al diseño: una ficha de tienda nueva, un correo distinto. Cuando eso
 * pase, se toca este fichero y nada más.
 */

export const links = {
  // Fichas reales, sacadas de spotterapp.es/descarga el 14/09/2026. Las dos
  // tiendas tendrán la versión 2.0 (confirmado por Juan).
  appStore: 'https://apps.apple.com/es/app/spotter-entrena-acompa%C3%B1ado/id6755760038',
  // El número de la ficha. Safari lo usa para ofrecer la app arriba de la web.
  appStoreId: '6755760038',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.spotter.com&hl=es',

  // La política publicada, que es la que exigen las tiendas (brief, §10).
  privacyPolicy: 'https://arrobaeveryone.com/spotter/privacidad',

  instagram: 'https://www.instagram.com/spotterapp_es/',
  instagramHandle: '@spotterapp_es',

  // PENDIENTE: confirmar la dirección de contacto que atiende Paula.
  contactEmail: 'hola@spotterapp.es',
} as const;
