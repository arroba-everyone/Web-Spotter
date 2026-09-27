/**
 * Reglas y vocabulario de la cola de denuncias.
 *
 * Todo lo de aquí es lógica pura: ni toca el DOM ni sabe que existe Supabase.
 * Así se puede comprobar sin navegador, igual que la física de las burbujas.
 *
 * El panel va solo en español (PANEL-ADMIN.md §7): es interno.
 */

/** Estados por los que pasa una denuncia, tal como los llama la base de datos. */
export type EstadoDenuncia = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

/** Qué se ha denunciado. */
export type TipoObjetivo = 'user' | 'message' | 'photo' | 'group' | 'event';

/** Por qué se ha denunciado. */
export type MotivoDenuncia =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'nudity'
  | 'fake_profile'
  | 'minor'
  | 'violence'
  | 'scam'
  | 'other';

/** Medidas que puede tomar quien modera. Son las de `moderation_action_enum`. */
export type AccionModeracion =
  | 'none'
  | 'warning'
  | 'content_removal'
  | 'mute'
  | 'suspend'
  | 'ban'
  | 'shadow_ban';

/** Una fila de la cola, tal como la devuelve `admin_reports`. */
export interface FilaDenuncia {
  id: string;
  created_at: string;
  status: EstadoDenuncia;
  target_type: TipoObjetivo;
  reason: MotivoDenuncia | null;
  description: string | null;
  reporter_id: string;
  reporter_name: string | null;
  reported_user_id: string | null;
  reported_name: string | null;
  reported_status: string | null;
  message_body: string | null;
  message_hidden: boolean | null;
  group_name: string | null;
  denuncias_acumuladas: number;
}

/**
 * Horas que lleva esperando una denuncia.
 *
 * `ahora` se pasa como argumento en vez de leer el reloj aquí dentro: así la
 * función siempre devuelve lo mismo con los mismos datos y se puede comprobar.
 */
export function horasEsperando(creadaEn: string, ahora: Date): number {
  const milisegundos = ahora.getTime() - new Date(creadaEn).getTime();
  return Math.max(0, Math.floor(milisegundos / 3_600_000));
}

/**
 * Las condiciones de uso publicadas prometen revisar el contenido denunciado en
 * 24 horas. Pasado ese plazo, la denuncia va en rojo.
 */
export const PLAZO_RESPUESTA_HORAS = 24;

export function estaFueraDePlazo(fila: FilaDenuncia, ahora: Date): boolean {
  if (fila.status === 'resolved' || fila.status === 'dismissed') return false;
  return horasEsperando(fila.created_at, ahora) >= PLAZO_RESPUESTA_HORAS;
}

/** «hace 3 h», «hace 2 días». Para una cola, el tiempo exacto no aporta nada. */
export function esperaEnPalabras(creadaEn: string, ahora: Date): string {
  const horas = horasEsperando(creadaEn, ahora);
  if (horas < 1) return 'hace menos de 1 h';
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
}

const ESTADOS: Record<EstadoDenuncia, string> = {
  pending: 'Sin atender',
  reviewing: 'En revisión',
  resolved: 'Resuelta',
  dismissed: 'Descartada',
};

const MOTIVOS: Record<MotivoDenuncia, string> = {
  spam: 'Spam',
  harassment: 'Acoso',
  hate_speech: 'Mensaje de odio',
  nudity: 'Desnudos',
  fake_profile: 'Perfil falso',
  minor: 'Menor de edad',
  violence: 'Violencia',
  scam: 'Estafa',
  other: 'Otro',
};

const OBJETIVOS: Record<TipoObjetivo, string> = {
  user: 'Persona',
  message: 'Mensaje',
  photo: 'Foto',
  group: 'Grupo',
  event: 'Quedada',
};

const ACCIONES: Record<AccionModeracion, string> = {
  none: 'Sin medida',
  warning: 'Aviso',
  content_removal: 'Contenido retirado',
  mute: 'Silenciada',
  suspend: 'Suspendida',
  ban: 'Expulsada',
  shadow_ban: 'Oculta',
};

const ESTADOS_CUENTA: Record<string, string> = {
  pending: 'Alta sin terminar',
  active: 'Activa',
  suspended: 'Suspendida',
  banned: 'Expulsada',
  deleted: 'Borrada',
};

/** Traduce sin romperse si mañana la base de datos añade un valor nuevo. */
function traducir<T extends string>(diccionario: Record<T, string>, valor: T | null): string {
  if (valor === null) return 'Sin especificar';
  return diccionario[valor] ?? valor;
}

export const etiquetaEstado = (valor: EstadoDenuncia | null) => traducir(ESTADOS, valor);
export const etiquetaMotivo = (valor: MotivoDenuncia | null) => traducir(MOTIVOS, valor);
export const etiquetaObjetivo = (valor: TipoObjetivo | null) => traducir(OBJETIVOS, valor);
export const etiquetaAccion = (valor: AccionModeracion | null) => traducir(ACCIONES, valor);
export const etiquetaEstadoCuenta = (valor: string | null) =>
  valor === null ? 'Sin cuenta' : (ESTADOS_CUENTA[valor] ?? valor);

/**
 * Una denuncia por «menor de edad» no admite esperar: se pone la primera de la
 * cola aunque sea más nueva. Queda pendiente que Paula decida si además se
 * trata distinto (PANEL-ADMIN.md, «lo que hace falta de nuestra parte»).
 */
export function esUrgente(fila: FilaDenuncia): boolean {
  return fila.reason === 'minor';
}

/**
 * Orden de la cola: primero lo urgente, después lo más antiguo.
 *
 * La base de datos ya las devuelve por fecha; esto solo sube las de menores.
 */
export function ordenarCola(filas: readonly FilaDenuncia[]): FilaDenuncia[] {
  return [...filas].sort((a, b) => {
    if (esUrgente(a) !== esUrgente(b)) return esUrgente(a) ? -1 : 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}
