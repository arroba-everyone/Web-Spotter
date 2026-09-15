/**
 * Simulación de las burbujas de «Descubrir».
 *
 * Es la firma visual del producto: cinco personas al día flotando despacio,
 * que se pueden arrastrar y que rebotan entre sí. La escasez es intencional,
 * así que el número de burbujas no es un detalle decorativo.
 *
 * Este fichero es lógica pura: no conoce el DOM, no dibuja nada y no lee
 * eventos. Recibe un tamaño y un tiempo transcurrido, y devuelve posiciones.
 * Así se puede probar sin navegador y la vista queda reducida a pintar.
 */

import type { SportId } from './sports';

export interface Bubble {
  id: string;
  sportId: SportId;
  /** Centro de la burbuja, en píxeles del contenedor. */
  x: number;
  y: number;
  /** Velocidad en píxeles por segundo. */
  velocityX: number;
  velocityY: number;
  /** Radio en píxeles. Se recalcula al cambiar el tamaño del contenedor. */
  radius: number;
  /** Desviación de tamaño respecto a la media, para que no parezcan clones. */
  radiusFactor: number;
}

/** Cuánta velocidad conserva una burbuja tras chocar. Menos de 1 = pierde brío. */
const COLLISION_DAMPING = 0.92;

/**
 * Proporción del contenedor que ocupan las burbujas entre todas.
 *
 * Por debajo se ven perdidas; por encima no caben y se pasan la vida
 * empujándose contra las paredes. Un tercio deja aire para que se muevan.
 */
const FILL_RATIO = 0.30;

/**
 * Radio máximo y mínimo de una burbuja, en píxeles.
 *
 * El reparto por área, solo, no basta: en una pantalla grande el contenedor
 * crece y las burbujas crecen con él hasta que se comen la portada y se
 * superponen. El tope las deja en un tamaño de foto de perfil por muy ancha que
 * sea la ventana; el suelo evita que en un móvil estrecho se queden en canicas.
 */
const MAX_RADIUS = 110;
const MIN_RADIUS = 38;

/**
 * Hueco que se deja entre dos burbujas al chocar, como fracción de sus radios.
 *
 * A 1 chocarían justo al tocarse, que es correcto pero se lee como si estuvieran
 * pegadas: los aros de cristal quedan pared con pared y parecen superpuestas.
 * Este margen deja siempre un poco de negro entre medias.
 */
const BUBBLE_GAP = 1.08;

/**
 * Cuánto se desvía cada burbuja del reparto regular al nacer, en radianes.
 *
 * Sin esto las cinco caen a la misma distancia y con el mismo ángulo entre
 * ellas, y la composición inicial se lee como una estrella de cinco puntas.
 */
const ANGLE_JITTER = 0.85;

/**
 * Cuántas veces se repite la separación en cada fotograma.
 *
 * Una sola pasada no basta cuando el sitio es justo: al apartar dos burbujas,
 * una de ellas puede acabar metida dentro de una tercera, y ese solape ya no se
 * deshace hasta el fotograma siguiente. Repitiendo, el amontonamiento se
 * desenreda dentro del mismo fotograma.
 */
const SEPARATION_PASSES = 4;

/** Distancia mínima al centro al nacer, como fracción del reparto completo. */
const MIN_SPAWN_DISTANCE = 0.52;

/**
 * Ruido repetible entre 0 y 1.
 *
 * Es determinista a propósito: la misma burbuja cae siempre en el mismo sitio,
 * así que la portada no baila entre recargas ni depende de «Math.random», que
 * daría una composición distinta y a veces mala en cada visita.
 */
function noise(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Cuánto se acercan al borde las burbujas al nacer.
 *
 * A 1 nacerían pegadas a las paredes; a 0, todas amontonadas en el centro.
 * El valor deja aire suficiente para que la composición inicial se lea entera.
 */
const INITIAL_SPREAD = 0.85;

/** Rango de velocidad inicial, en píxeles por segundo. Deliberadamente lento. */
const MIN_INITIAL_SPEED = 12;
const MAX_INITIAL_SPEED = 26;

/**
 * Hasta qué distancia se notan entre sí las burbujas, en múltiplos del contacto.
 *
 * Solo con choques, al cabo de medio minuto todas acababan apelotonadas en un
 * lado por puro azar. Esta repulsión de corto alcance mantiene la composición
 * repartida sin que se note que hay algo empujando.
 */
const SEPARATION_RANGE = 1.25;

/** Fuerza de esa repulsión, en píxeles por segundo al cuadrado. */
const SEPARATION_STRENGTH = 120;

/**
 * Atracción hacia el centro del marco, en 1/s².
 *
 * Muy débil a propósito: no debe verse. Su único trabajo es que el conjunto no
 * se descuelgue hacia una esquina y deje media portada vacía.
 */
const CENTERING_STRENGTH = 1.1;

/** Velocidad máxima, en píxeles por segundo. Las burbujas flotan, no corren. */
const MAX_SPEED = 46;

/**
 * Cuánto se deja superar ese techo justo después de revolverlas o lanzarlas.
 *
 * Con el techo normal, un lanzamiento o un «agita» se quedaba en un empujón
 * tímido: la burbuja salía despedida y a los dos fotogramas ya iba a paso de
 * paseo. Durante un momento se permite ir mucho más rápido, y luego se vuelve
 * poco a poco a la calma.
 */
const AGITATED_SPEED_MULTIPLIER = 14;

/** En cuántos segundos se disipa casi toda la agitación. */
const AGITATION_DECAY_SECONDS = 1.4;

/** Velocidad que recibe cada burbuja al revolver, en píxeles por segundo. */
const SHUFFLE_MIN_SPEED = 260;
const SHUFFLE_MAX_SPEED = 520;

/**
 * Distancia a la que el cursor empieza a apartar las burbujas, en píxeles.
 *
 * No es para jugar, es para que se note que están vivas: al pasar el ratón por
 * encima se hacen a un lado un poco, como si hubiera aire entre medias.
 */
const POINTER_RANGE = 150;

/** Fuerza con la que el cursor las aparta, en píxeles por segundo al cuadrado. */
const POINTER_STRENGTH = 900;

/**
 * Techo de tiempo por fotograma, en segundos.
 *
 * Si la pestaña queda en segundo plano, el navegador deja de llamar al bucle y
 * al volver entrega un salto de varios segundos. Sin este tope, las burbujas
 * atravesarían el contenedor de golpe.
 */
const MAX_STEP_SECONDS = 1 / 30;

export class BubbleField {
  private bubbles: Bubble[];
  private width: number;
  private height: number;
  /** Se guarda aparte porque el radio se calcula antes de crear la lista. */
  private readonly bubbleCount: number;
  /** Burbuja que el usuario tiene agarrada, si hay alguna. */
  private grabbedId: string | null = null;

  /** Entre 0 (calma) y 1 (recién revueltas). Sube el techo de velocidad. */
  private agitation = 0;

  /** Posición del cursor sobre el contenedor, o null si no está encima. */
  private pointer: { x: number; y: number } | null = null;

  constructor(sportIds: readonly SportId[], width: number, height: number) {
    this.width = width;
    this.height = height;
    this.bubbleCount = sportIds.length;
    this.bubbles = sportIds.map((sportId, index) =>
      this.createBubble(sportId, index, sportIds.length),
    );

    // La composición de partida también tiene que estar limpia. El reparto
    // inicial es aproximado y puede dejar dos burbujas montadas: si la animación
    // aún no ha avanzado ningún fotograma, eso es exactamente lo que se ve.
    this.separateOverlaps();
  }

  /** Estado actual, para que la vista lo pinte. Solo lectura. */
  get all(): readonly Bubble[] {
    return this.bubbles;
  }

  /**
   * Avanza la simulación.
   * @param deltaSeconds Tiempo transcurrido desde el fotograma anterior.
   */
  step(deltaSeconds: number): void {
    const step = Math.min(deltaSeconds, MAX_STEP_SECONDS);

    // La agitación cae de forma exponencial: rápido al principio, suave al final.
    this.agitation *= Math.exp(-step / (AGITATION_DECAY_SECONDS / 3));

    this.applySoftForces(step);

    for (const bubble of this.bubbles) {
      // La burbuja agarrada la mueve el puntero, no la simulación.
      if (bubble.id === this.grabbedId) continue;

      this.limitSpeed(bubble);
      bubble.x += bubble.velocityX * step;
      bubble.y += bubble.velocityY * step;
      this.bounceOffWalls(bubble);
    }

    this.resolveCollisions();
    this.separateOverlaps();

    // Separar dos burbujas puede empujar una fuera del marco, así que el límite
    // se comprueba al final: es lo último que toca las posiciones antes de pintar.
    for (const bubble of this.bubbles) {
      this.clampInsideWalls(bubble);
    }
  }

  /** Reajusta posiciones y radios cuando cambia el tamaño del contenedor. */
  resize(width: number, height: number): void {
    // Se conserva la posición relativa para que al girar el móvil o redimensionar
    // la ventana las burbujas no salten a una esquina.
    const scaleX = this.width > 0 ? width / this.width : 1;
    const scaleY = this.height > 0 ? height / this.height : 1;

    this.width = width;
    this.height = height;

    for (const bubble of this.bubbles) {
      bubble.x *= scaleX;
      bubble.y *= scaleY;
      bubble.radius = this.radiusFor(bubble.radiusFactor);
      this.clampInsideWalls(bubble);
    }

    // Al cambiar de tamaño los radios cambian, así que dos que antes cabían
    // pueden quedar montadas.
    this.separateOverlaps();
  }

  /** Devuelve la burbuja que contiene ese punto, o null si no hay ninguna. */
  bubbleAt(x: number, y: number): Bubble | null {
    // Se recorre al revés porque la última dibujada es la que está encima.
    for (let index = this.bubbles.length - 1; index >= 0; index -= 1) {
      const bubble = this.bubbles[index]!;
      if (Math.hypot(bubble.x - x, bubble.y - y) <= bubble.radius) return bubble;
    }
    return null;
  }

  grab(id: string): void {
    this.grabbedId = id;
  }

  /** Coloca la burbuja agarrada y le calcula la velocidad con la que se soltará. */
  dragTo(x: number, y: number, deltaSeconds: number): void {
    const bubble = this.bubbles.find((candidate) => candidate.id === this.grabbedId);
    if (!bubble || deltaSeconds <= 0) return;

    bubble.velocityX = (x - bubble.x) / deltaSeconds;
    bubble.velocityY = (y - bubble.y) / deltaSeconds;
    bubble.x = x;
    bubble.y = y;
    this.clampInsideWalls(bubble);
  }

  /** Suelta la burbuja, que sale despedida con la velocidad del arrastre. */
  release(): void {
    this.grabbedId = null;
    // Sin esto el lanzamiento se frenaba en seco contra el techo de velocidad.
    this.agitation = 1;
  }

  /**
   * Revuelve las cinco, como al agitar el móvil en la app.
   *
   * Aquí sí se usa azar de verdad: es un gesto del visitante y se espera que
   * cada vez salga distinto. La colocación inicial, en cambio, es fija.
   */
  shuffle(random: () => number = Math.random): void {
    this.agitation = 1;
    for (const bubble of this.bubbles) {
      if (bubble.id === this.grabbedId) continue;
      const angle = random() * Math.PI * 2;
      const speed = SHUFFLE_MIN_SPEED + random() * (SHUFFLE_MAX_SPEED - SHUFFLE_MIN_SPEED);
      bubble.velocityX = Math.cos(angle) * speed;
      bubble.velocityY = Math.sin(angle) * speed;
    }
  }

  /** Dónde está el cursor, para que las burbujas se aparten. null si ha salido. */
  setPointer(x: number | null, y: number | null): void {
    this.pointer = x === null || y === null ? null : { x, y };
  }

  // --- Interno ----------------------------------------------------------

  private createBubble(sportId: SportId, index: number, total: number): Bubble {
    // Tamaños distintos para que la escena no parezca un patrón.
    const radiusFactor = 0.84 + noise(index * 3) * 0.3;
    const radius = this.radiusFor(radiusFactor);

    /*
     * Dónde nace cada una.
     *
     * Se parte de un reparto regular alrededor del centro, que es lo que evita
     * que se amontonen todas en el mismo sitio, y luego se desordena: el ángulo
     * se desvía y la distancia al centro cambia en cada una. Sin ese desorden
     * las cinco quedan equidistantes y la composición inicial se ve como una
     * estrella de cinco puntas.
     *
     * El reparto es sobre una elipse ajustada al contenedor, no un círculo: en
     * una portada alta y estrecha, un círculo las dejaría todas en el medio.
     */
    const evenAngle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const angle = evenAngle + (noise(index) - 0.5) * ANGLE_JITTER;
    const distance = MIN_SPAWN_DISTANCE + noise(index * 5 + 1) * (1 - MIN_SPAWN_DISTANCE);

    const spreadX = Math.max(this.width / 2 - radius, 0) * INITIAL_SPREAD * distance;
    const spreadY = Math.max(this.height / 2 - radius, 0) * INITIAL_SPREAD * distance;

    const speed =
      MIN_INITIAL_SPEED + noise(index * 11 + 7) * (MAX_INITIAL_SPEED - MIN_INITIAL_SPEED);

    return {
      id: `${sportId}-${index}`,
      sportId,
      x: this.width / 2 + Math.cos(angle) * spreadX,
      y: this.height / 2 + Math.sin(angle) * spreadY,
      velocityX: Math.cos(angle + Math.PI / 3) * speed,
      velocityY: Math.sin(angle + Math.PI / 3) * speed,
      radiusFactor,
      radius,
    };
  }

  /**
   * Radio para que las burbujas ocupen «FILL_RATIO» del contenedor.
   *
   * Se reparte el área disponible entre todas y se despeja el radio del círculo,
   * así que el resultado se adapta solo a un móvil estrecho o a una pantalla
   * ancha sin necesidad de puntos de ruptura.
   *
   * El resultado se acota entre «MIN_RADIUS» y «MAX_RADIUS»: el reparto por área
   * crece sin freno con el tamaño de la ventana, y sin tope las burbujas acaban
   * superponiéndose en una pantalla grande.
   */
  private radiusFor(factor: number): number {
    const area = this.width * this.height;
    const count = Math.max(this.bubbleCount, 1);
    const averageRadius = Math.sqrt((area * FILL_RATIO) / (Math.PI * count));
    const radius = averageRadius * factor;
    return Math.min(Math.max(radius, MIN_RADIUS), MAX_RADIUS);
  }

  /**
   * Fuerzas continuas: separación entre vecinas y un tirón mínimo hacia el centro.
   *
   * A diferencia del choque, que es instantáneo, estas actúan en todo momento y
   * son las que dan la sensación de que las burbujas «se buscan el sitio».
   */
  private applySoftForces(step: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (let i = 0; i < this.bubbles.length; i += 1) {
      const bubble = this.bubbles[i]!;
      if (bubble.id === this.grabbedId) continue;

      // Tirón hacia el centro, proporcional a lo lejos que esté de él.
      bubble.velocityX += (centerX - bubble.x) * CENTERING_STRENGTH * step;
      bubble.velocityY += (centerY - bubble.y) * CENTERING_STRENGTH * step;

      if (this.pointer) {
        const awayX = bubble.x - this.pointer.x;
        const awayY = bubble.y - this.pointer.y;
        // Se mide desde el borde de la burbuja y no desde su centro: una grande
        // tiene que reaccionar igual de pronto que una pequeña.
        const gap = Math.hypot(awayX, awayY) - bubble.radius;
        if (gap < POINTER_RANGE) {
          const distance = Math.max(Math.hypot(awayX, awayY), 1);
          const push = (1 - Math.max(gap, 0) / POINTER_RANGE) * POINTER_STRENGTH * step;
          bubble.velocityX += (awayX / distance) * push;
          bubble.velocityY += (awayY / distance) * push;
        }
      }

      for (let j = 0; j < this.bubbles.length; j += 1) {
        if (i === j) continue;
        const other = this.bubbles[j]!;

        const deltaX = bubble.x - other.x;
        const deltaY = bubble.y - other.y;
        const distance = Math.hypot(deltaX, deltaY);
        const range = (bubble.radius + other.radius) * SEPARATION_RANGE;

        if (distance === 0 || distance >= range) continue;

        // Cuanto más cerca, más empuje: a distancia «range» la fuerza es cero.
        const push = (1 - distance / range) * SEPARATION_STRENGTH * step;
        bubble.velocityX += (deltaX / distance) * push;
        bubble.velocityY += (deltaY / distance) * push;
      }
    }
  }

  /** Recorta la velocidad para que ningún choque dispare una burbuja. */
  private limitSpeed(bubble: Bubble): void {
    const maximum = MAX_SPEED * (1 + this.agitation * (AGITATED_SPEED_MULTIPLIER - 1));
    const speed = Math.hypot(bubble.velocityX, bubble.velocityY);
    if (speed <= maximum || speed === 0) return;

    const factor = maximum / speed;
    bubble.velocityX *= factor;
    bubble.velocityY *= factor;
  }

  private bounceOffWalls(bubble: Bubble): void {
    if (bubble.x - bubble.radius < 0 && bubble.velocityX < 0) {
      bubble.velocityX = -bubble.velocityX;
    }
    if (bubble.x + bubble.radius > this.width && bubble.velocityX > 0) {
      bubble.velocityX = -bubble.velocityX;
    }
    if (bubble.y - bubble.radius < 0 && bubble.velocityY < 0) {
      bubble.velocityY = -bubble.velocityY;
    }
    if (bubble.y + bubble.radius > this.height && bubble.velocityY > 0) {
      bubble.velocityY = -bubble.velocityY;
    }
    this.clampInsideWalls(bubble);
  }

  private clampInsideWalls(bubble: Bubble): void {
    bubble.x = Math.min(Math.max(bubble.x, bubble.radius), this.width - bubble.radius);
    bubble.y = Math.min(Math.max(bubble.y, bubble.radius), this.height - bubble.radius);
  }

  /**
   * Choque elástico entre pares de burbujas.
   *
   * Se tratan como discos de la misma masa, así que basta con intercambiar la
   * componente de velocidad que va en la línea que une sus centros. La componente
   * perpendicular no cambia, que es lo que hace que se rocen en vez de frenarse.
   */
  /**
   * Aparta las burbujas hasta que ninguna pise a otra.
   *
   * Va aparte del choque porque son dos cosas distintas: el choque decide cómo
   * salen rebotadas, y esto arregla el hecho de estar montadas. Se repite varias
   * veces porque separar un par puede crear un solape nuevo con una tercera.
   */
  private separateOverlaps(): void {
    for (let pass = 0; pass < SEPARATION_PASSES; pass += 1) {
      let touched = false;

      for (let i = 0; i < this.bubbles.length; i += 1) {
        for (let j = i + 1; j < this.bubbles.length; j += 1) {
          const a = this.bubbles[i]!;
          const b = this.bubbles[j]!;

          const deltaX = b.x - a.x;
          const deltaY = b.y - a.y;
          const distance = Math.hypot(deltaX, deltaY);
          const minimumDistance = (a.radius + b.radius) * BUBBLE_GAP;

          if (distance === 0 || distance >= minimumDistance) continue;

          const normalX = deltaX / distance;
          const normalY = deltaY / distance;
          const overlap = (minimumDistance - distance) / 2;

          // La que está agarrada por el dedo no se mueve: manda el gesto.
          if (a.id !== this.grabbedId) {
            a.x -= normalX * overlap;
            a.y -= normalY * overlap;
            this.clampInsideWalls(a);
          }
          if (b.id !== this.grabbedId) {
            b.x += normalX * overlap;
            b.y += normalY * overlap;
            this.clampInsideWalls(b);
          }

          touched = true;
        }
      }

      // Si en una pasada entera no se tocaba ninguna, ya están todas separadas.
      if (!touched) return;
    }
  }

  private resolveCollisions(): void {
    for (let i = 0; i < this.bubbles.length; i += 1) {
      for (let j = i + 1; j < this.bubbles.length; j += 1) {
        const a = this.bubbles[i]!;
        const b = this.bubbles[j]!;

        const deltaX = b.x - a.x;
        const deltaY = b.y - a.y;
        const distance = Math.hypot(deltaX, deltaY);
        const minimumDistance = (a.radius + b.radius) * BUBBLE_GAP;

        if (distance === 0 || distance >= minimumDistance) continue;

        // Vector unitario de a hacia b.
        const normalX = deltaX / distance;
        const normalY = deltaY / distance;

        // Velocidad de acercamiento a lo largo de la normal.
        const relativeSpeed =
          (b.velocityX - a.velocityX) * normalX + (b.velocityY - a.velocityY) * normalY;

        // Si ya se están separando, no hay choque que resolver.
        if (relativeSpeed > 0) continue;

        const impulse = relativeSpeed * COLLISION_DAMPING;
        if (a.id !== this.grabbedId) {
          a.velocityX += impulse * normalX;
          a.velocityY += impulse * normalY;
        }
        if (b.id !== this.grabbedId) {
          b.velocityX -= impulse * normalX;
          b.velocityY -= impulse * normalY;
        }
      }
    }
  }
}
