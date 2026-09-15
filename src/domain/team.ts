/**
 * Las personas del equipo.
 *
 * Solo el dato estable: quién es y con qué color se le acompaña. Lo que dice cada
 * uno es texto traducible y vive en el diccionario del idioma, bajo la misma clave.
 *
 * La foto no se declara aquí. El componente busca un fichero con el mismo nombre
 * que el identificador en «src/assets/equipo/» («paula.jpg», «juan.png»…). Si no
 * lo encuentra, enseña la inicial sobre un degradado, igual que la app con los
 * perfiles sin foto. Así, añadir una foto es soltar un fichero en esa carpeta.
 */
import type { SportId } from './sports';

export type TeamMemberId = 'paula' | 'juan' | 'pablo';

export interface TeamMember {
  id: TeamMemberId;
  name: string;
  /** Color del degradado cuando no hay foto. Se toma de un deporte para no inventar colores. */
  accentSport: SportId;
}

export const team: readonly TeamMember[] = [
  { id: 'paula', name: 'Paula', accentSport: 'gym' },
  { id: 'juan', name: 'Juan', accentSport: 'cycling' },
  { id: 'pablo', name: 'Pablo', accentSport: 'hyrox' },
] as const;
