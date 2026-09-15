/**
 * La serie del día que se enseña en la portada.
 *
 * Son cinco porque cinco es el número real del producto, no una cifra elegida
 * para que quede bonito: la escasez es lo que diferencia a Spotter de una lista
 * infinita. Si algún día el producto cambia ese número, se cambia aquí.
 */
import type { SportId } from './sports';

export interface SeriesMember {
  sportId: SportId;
  /** Se muestran cuando no hay foto. Dos letras. */
  initials: string;
  /** Ruta de la foto, o null para mostrar las iniciales. */
  photo: string | null;
  /**
   * Qué punto de la foto queda en el centro del círculo, en el formato de la
   * propiedad CSS «object-position».
   *
   * Hace falta porque las fotos no son cuadradas y recortarlas por el centro
   * deja la cara fuera casi siempre: en un retrato vertical, el centro de la
   * imagen cae a la altura del pecho.
   */
  focus: string;
  /**
   * Cuánto se acerca la foto, si hace falta. 1 es la foto tal cual.
   *
   * Se usa en las fotos donde la persona sale de cuerpo entero: por mucho que se
   * mueva el encuadre, la cara sigue siendo diminuta dentro de una burbuja de
   * 140 píxeles. El acercamiento se hace sobre el mismo punto que marca «focus».
   */
  zoom?: number;
}

export const dailySeries: readonly SeriesMember[] = [
  { sportId: 'gym', initials: 'AL', photo: '/perfiles/gimnasio.jpg', focus: '76% 34%', zoom: 1.3 },
  { sportId: 'running', initials: 'MG', photo: '/perfiles/running.jpg', focus: '41% 12%', zoom: 1.35 },
  { sportId: 'cycling', initials: 'JR', photo: '/perfiles/ciclismo.jpg', focus: '40% 27%', zoom: 2.6 },
  { sportId: 'hyrox', initials: 'CT', photo: '/perfiles/hyrox.jpg', focus: '56% 42%', zoom: 1.5 },
  { sportId: 'calisthenics', initials: 'NB', photo: '/perfiles/calistenia.jpg', focus: '35% 10%', zoom: 2.6 },
] as const;
