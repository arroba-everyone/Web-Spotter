/**
 * Inclina levemente los elementos marcados con «data-tilt» siguiendo al puntero.
 *
 * Es un comportamiento compartido (lo usan los teléfonos y las tarjetas del
 * equipo), por eso vive aquí y no dentro de un componente. Solo escribe dos
 * variables CSS; cómo se aplican lo decide el estilo de cada elemento.
 *
 * No hace nada en pantallas táctiles, donde no hay puntero que seguir, ni si el
 * sistema pide menos movimiento.
 */

/** Grados máximos de inclinación. Más de esto marea en lugar de dar profundidad. */
const MAX_TILT_DEGREES = 6;

function enableTilt(element: HTMLElement): void {
  element.addEventListener('pointermove', (event) => {
    const rect = element.getBoundingClientRect();
    // De -0,5 a 0,5 según dónde esté el puntero dentro del elemento.
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    element.style.setProperty('--tiltY', `${relativeX * MAX_TILT_DEGREES * 2}deg`);
    element.style.setProperty('--tiltX', `${-relativeY * MAX_TILT_DEGREES * 2}deg`);
  });

  element.addEventListener('pointerleave', () => {
    element.style.setProperty('--tiltX', '0deg');
    element.style.setProperty('--tiltY', '0deg');
  });
}

const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersStillness = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (hasFinePointer && !prefersStillness) {
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(enableTilt);
}
