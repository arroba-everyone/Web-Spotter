/**
 * Comprueba que las burbujas de la portada nunca se superponen.
 *
 * Se ejecuta sin navegador, contra la simulación directamente, porque mirar una
 * captura de pantalla no sirve para esto: el solape puede aparecer solo en
 * ciertos tamaños de ventana o solo durante unos fotogramas. Aquí se simulan
 * diez segundos en cinco tamaños y se mide el peor caso.
 *
 * Durante la simulación se revuelven dos veces y el cursor pasa por encima,
 * que es cuando van más rápido y más fácil es que se monten.
 *
 *   npm run comprobar
 */
import { BubbleField } from '../src/domain/bubbleField.ts';
import type { SportId } from '../src/domain/sports.ts';

const sports: SportId[] = ['gym', 'running', 'cycling', 'hyrox', 'calisthenics'];

/** Tamaños del contenedor, del móvil a una pantalla grande. */
const sizes: [number, number][] = [
  [343, 420],
  [560, 620],
  [720, 780],
  [900, 900],
  [1200, 1000],
];

/** Diez segundos a 60 fotogramas por segundo. */
const steps = 600;

/** Un píxel de margen: por debajo de eso es redondeo, no un solape visible. */
const tolerance = 1;

let failures = 0;

for (const [width, height] of sizes) {
  const field = new BubbleField(sports, width, height);
  let worstOverlap = 0;
  let largestDiameter = 0;

  // Empieza en el paso 0, antes de simular nada: la composición de partida es
  // justo la que se ve al cargar la página, y es donde apareció el fallo.
  for (let step = 0; step <= steps; step += 1) {
    if (step === 120 || step === 360) field.shuffle();
    // El cursor da una vuelta por el centro entre los pasos 200 y 320.
    if (step === 200) field.setPointer(width / 2, height / 2);
    if (step > 200 && step < 320) {
      const angle = (step / 20) % (Math.PI * 2);
      field.setPointer(width / 2 + Math.cos(angle) * width * 0.25, height / 2 + Math.sin(angle) * height * 0.25);
    }
    if (step === 320) field.setPointer(null, null);

    if (step > 0) field.step(1 / 60);
    const bubbles = field.all;

    for (const bubble of bubbles) {
      largestDiameter = Math.max(largestDiameter, bubble.radius * 2);
    }

    for (let i = 0; i < bubbles.length; i += 1) {
      for (let j = i + 1; j < bubbles.length; j += 1) {
        const a = bubbles[i]!;
        const b = bubbles[j]!;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        worstOverlap = Math.max(worstOverlap, a.radius + b.radius - distance);
      }
    }
  }

  const passed = worstOverlap < tolerance;
  if (!passed) failures += 1;

  console.log(
    `${width}x${height}: diámetro máximo ${Math.round(largestDiameter)} px, ` +
      `solape máximo ${Math.round(worstOverlap)} px ${passed ? 'CORRECTO' : 'FALLA'}`,
  );
}

// Lanzar basta para que el proceso termine con error: así no hace falta traerse
// los tipos de Node solo para llamar a «process.exit».
if (failures > 0) {
  throw new Error(`${failures} de ${sizes.length} tamaños se superponen.`);
}

console.log('\nCorrecto: las burbujas no se superponen en ningún tamaño.');
