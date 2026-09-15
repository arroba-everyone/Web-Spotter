/**
 * Cuánto falta para que cambie la serie del día.
 *
 * En la app las cinco personas se renuevan con una cuenta atrás. La web la
 * reproduce contando hasta la medianoche del visitante, que es una aproximación
 * honesta: sirve para enseñar la idea, no promete una hora exacta.
 *
 * Es una función pura, sin reloj ni DOM, para poder probarla con cualquier fecha.
 */

/** Horas enteras que quedan hasta la próxima medianoche. Nunca menos de 1. */
export function hoursUntilMidnight(now: Date): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const hours = (midnight.getTime() - now.getTime()) / 3_600_000;
  // Se redondea hacia arriba: a las 23:20 quedan «1 h», no «0 h».
  return Math.max(1, Math.ceil(hours));
}
