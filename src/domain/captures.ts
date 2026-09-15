/**
 * Capturas de la app que usa la web.
 *
 * Se importan como módulos y no se sirven desde «public» para que Astro las
 * convierta en WebP y genere varios tamaños: los originales pesan unos 300 KB y
 * miden 1206 × 2622 px, y un móvil no necesita descargar eso.
 *
 * Son de la app en desarrollo del 14/09/2026. Las personas que salen son Juan y
 * amigos suyos, no usuarios reales: están autorizadas para la web (confirmado
 * por Juan el 15/09/2026).
 */
import type { ImageMetadata } from 'astro';

import spotNotice from '../assets/capturas/02-aviso-spot.jpg';
import discover from '../assets/capturas/03-descubrir.jpg';
import quickLook from '../assets/capturas/04-vista-previa.jpg';
import otherProfile from '../assets/capturas/05-perfil-otro.jpg';
import messages from '../assets/capturas/06-mensajes.jpg';
import chat from '../assets/capturas/07-chat.jpg';
import placeSearch from '../assets/capturas/10-buscador-sitios.jpg';
import settings from '../assets/capturas/13-ajustes.jpg';

export type CaptureId =
  | 'spotNotice'
  | 'discover'
  | 'quickLook'
  | 'otherProfile'
  | 'messages'
  | 'chat'
  | 'placeSearch'
  | 'settings';

export const captures: Record<CaptureId, ImageMetadata> = {
  spotNotice,
  discover,
  quickLook,
  otherProfile,
  messages,
  chat,
  placeSearch,
  settings,
};
