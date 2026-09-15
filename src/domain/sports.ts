/**
 * Los deportes que reconoce Spotter y el color con el que se identifica cada uno.
 *
 * Vive en «domain» porque es una regla de producto, no una decisión de maquetación:
 * el mismo dato lo consumen las burbujas del inicio, los chips de perfil y las
 * leyendas. El color no se escribe aquí como hexadecimal, sino como el nombre del
 * token CSS, para que claro y oscuro se resuelvan solos.
 */

/** Identificador estable de cada disciplina. Nunca se traduce ni se muestra. */
export type SportId =
  | 'gym'
  | 'running'
  | 'cycling'
  | 'hyrox'
  | 'calisthenics'
  | 'other';

export interface Sport {
  id: SportId;
  /** Variable CSS con el color de la disciplina, definida en tokens.css. */
  colorVariable: string;
}

export const sports: readonly Sport[] = [
  { id: 'gym', colorVariable: '--colorSportGym' },
  { id: 'running', colorVariable: '--colorSportRunning' },
  { id: 'cycling', colorVariable: '--colorSportCycling' },
  { id: 'hyrox', colorVariable: '--colorSportHyrox' },
  { id: 'calisthenics', colorVariable: '--colorSportCalisthenics' },
  { id: 'other', colorVariable: '--colorSportOther' },
] as const;

/** Devuelve el color de una disciplina listo para usar en un atributo «style». */
export function sportColor(id: SportId): string {
  const sport = sports.find((candidate) => candidate.id === id);
  // «other» es el gris neutro y hace de red de seguridad si llegara un id nuevo
  // desde el backend antes de que la web lo conozca.
  return `var(${sport?.colorVariable ?? '--colorSportOther'})`;
}
