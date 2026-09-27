/**
 * Comprueba los cálculos de las gráficas del panel.
 *
 * Se ejecuta con «npm run comprobar», junto a la de las burbujas. Falla con un
 * error si algo no cuadra, para que no pase de largo en una compilación.
 *
 * Qué se comprueba y por qué:
 *   1. El techo queda cerca del máximo, no muy por encima. Es el fallo que ya
 *      tuvimos: con 53 mensajes dibujaba un techo de 100 y media gráfica vacía.
 *   2. Ninguna barra se sale del dibujo.
 *   3. Una semana a cero se sigue viendo, porque un cero es un dato.
 */
import { calcularBarras, techo, total, type PuntoSemana } from '../src/domain/panel/grafica.ts';

const fallos: string[] = [];

function comprobar(afirmacion: boolean, queSeEsperaba: string): void {
  if (!afirmacion) fallos.push(queSeEsperaba);
}

// --- 1. El techo es redondo y ajustado --------------------------------------

const casos: ReadonlyArray<{ valores: number[]; esperado: number }> = [
  { valores: [0, 0, 0], esperado: 1 },
  { valores: [0, 1, 6, 2], esperado: 6 },
  { valores: [0, 1, 53, 24], esperado: 60 },
  { valores: [3], esperado: 3 },
  { valores: [120, 340], esperado: 400 },
];

for (const caso of casos) {
  const obtenido = techo(caso.valores);
  comprobar(
    obtenido === caso.esperado,
    `techo(${caso.valores.join(', ')}) debería ser ${caso.esperado} y es ${obtenido}`,
  );
}

for (const caso of casos) {
  const maximo = Math.max(...caso.valores);
  if (maximo > 0) {
    comprobar(
      techo(caso.valores) <= maximo * 2,
      `el techo de ${caso.valores.join(', ')} deja más del doble de hueco sobre la barra más alta`,
    );
  }
}

// --- 2. Las barras caben dentro del dibujo ----------------------------------

const ANCHO = 320;
const ALTO = 110;

const semanas: PuntoSemana[] = [
  { semana: '2026-08-03', valor: 0 },
  { semana: '2026-08-10', valor: 0 },
  { semana: '2026-08-17', valor: 0 },
  { semana: '2026-08-24', valor: 0 },
  { semana: '2026-08-31', valor: 0 },
  { semana: '2026-09-07', valor: 1 },
  { semana: '2026-09-14', valor: 53 },
  { semana: '2026-09-21', valor: 24 },
];

const barras = calcularBarras(semanas, ANCHO, ALTO);

comprobar(barras.length === semanas.length, 'se dibuja una barra por semana');

for (const barra of barras) {
  comprobar(barra.x >= 0 && barra.x + barra.ancho <= ANCHO, `la barra de ${barra.semana} se sale por el lado`);
  comprobar(barra.y >= 0 && barra.y + barra.alto <= ALTO + 0.001, `la barra de ${barra.semana} se sale por arriba o por abajo`);
}

// --- 3. Un cero se sigue viendo ---------------------------------------------

for (const barra of barras) {
  comprobar(barra.alto >= 2, `la semana del ${barra.semana} no se ve: un cero también es un dato`);
}

// La más alta tiene que ocupar buena parte del alto, o la gráfica no dice nada.
const masAlta = Math.max(...barras.map((barra) => barra.alto));
comprobar(masAlta > ALTO * 0.6, 'la barra más alta se queda por debajo del 60 % del dibujo');

comprobar(total(semanas) === 78, 'la suma de la serie de prueba debería ser 78');

// --- Resultado ---------------------------------------------------------------

if (fallos.length > 0) {
  throw new Error(`Las gráficas del panel fallan:\n - ${fallos.join('\n - ')}`);
}

console.log(`Gráficas del panel: ${barras.length} barras comprobadas, todo correcto.`);
