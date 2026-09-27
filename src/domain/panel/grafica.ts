/**
 * Cálculos de las gráficas de barras del panel.
 *
 * Lógica pura: recibe números y devuelve medidas. No sabe que existe el DOM ni
 * el SVG, así que se puede comprobar sin navegador.
 *
 * Son gráficas de barras y no de líneas a propósito: cada barra es «lo que pasó
 * esa semana», un recuento, y una línea entre recuentos sugiere un camino
 * continuo que no existe.
 */

export interface PuntoSemana {
  /** Lunes de la semana, en formato «2026-09-21». */
  semana: string;
  valor: number;
}

export interface BarraDibujada {
  semana: string;
  valor: number;
  /** Posición y tamaño dentro del área de dibujo, ya en píxeles. */
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Separación entre barras, para que se lean como cosas distintas. */
const HUECO = 2;

/**
 * Techo de la gráfica: el número redondo justo por encima del valor más alto.
 *
 * Redondear a saltos fijos deja huecos absurdos (con un máximo de 53, un salto
 * de 50 pinta un techo de 100 y media gráfica vacía). Esto elige el salto según
 * la magnitud de los datos, de forma que el techo queda cerca del máximo y aun
 * así es una cifra redonda: 6 se queda en 6, y 53 sube a 60.
 *
 * Con todo a cero devuelve 1, para no dividir entre cero al calcular alturas.
 */
export function techo(valores: readonly number[]): number {
  const maximo = Math.max(0, ...valores);
  if (maximo <= 0) return 1;

  // Un cuarto del máximo es el salto que da unas cuatro divisiones.
  const aproximado = maximo / 4;
  const magnitud = 10 ** Math.floor(Math.log10(aproximado));
  const veces = aproximado / magnitud;
  const salto = (veces <= 1 ? 1 : veces <= 2 ? 2 : veces <= 5 ? 5 : 10) * magnitud;

  return Math.ceil(maximo / salto) * salto;
}

/**
 * Convierte los datos en rectángulos.
 *
 * Las barras a cero se dibujan con dos píxeles de alto en vez de con ninguno:
 * una semana sin nada es un dato, y si no se dibuja parece que falta.
 */
export function calcularBarras(
  puntos: readonly PuntoSemana[],
  ancho: number,
  alto: number,
): BarraDibujada[] {
  if (puntos.length === 0) return [];

  const limite = techo(puntos.map((punto) => punto.valor));
  const anchoBarra = Math.max(1, ancho / puntos.length - HUECO);

  return puntos.map((punto, indice) => {
    const altoBarra = punto.valor === 0 ? 2 : Math.max(2, (punto.valor / limite) * alto);
    return {
      semana: punto.semana,
      valor: punto.valor,
      x: indice * (ancho / puntos.length),
      y: alto - altoBarra,
      ancho: anchoBarra,
      alto: altoBarra,
    };
  });
}

/** «21 sep», que es lo que hace falta debajo de una barra. */
export function etiquetaSemana(semana: string): string {
  return new Date(`${semana}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

/** Lo que se lee al pasar el ratón por encima de una barra. */
export function textoDeBarra(barra: BarraDibujada, unidad: string): string {
  const cantidad = barra.valor === 1 ? `1 ${unidad.replace(/s$/, '')}` : `${barra.valor} ${unidad}`;
  return `Semana del ${etiquetaSemana(barra.semana)}: ${cantidad}`;
}

/** Suma de un periodo, para decir de un vistazo si hay algo o no hay nada. */
export function total(puntos: readonly PuntoSemana[]): number {
  return puntos.reduce((suma, punto) => suma + punto.valor, 0);
}
