# Logotipos preparados para web

Vienen de los originales de la agencia, con dos arreglos. **Los originales
se guardan fuera del repositorio**; si la agencia entrega ficheros corregidos, basta con
sustituir los de esta carpeta y no hay que tocar código.

## 1. Los de fondo oscuro venían rotos

`logo-completo-fondo-oscuro.svg` y `logo-cuadrado-fondo-oscuro.svg` no traían el
pin dibujado, sino una referencia a una imagen externa
(`LOGO 512 RELEASE fondo transparente 2_Mesa de trabajo 1.png`) que **no está en
la entrega**. En un navegador salía el icono de imagen rota junto a la palabra
«spotter».

Arreglo: se ha insertado el pin vectorial que sí traían los ficheros de fondo
claro. **Conviene pedirle a la agencia el SVG bueno**, porque ahí faltan también
todos los ficheros originales de esa imagen.

## 2. Recortados al contenido

En los originales el dibujo ocupaba una fracción del marco —en el logotipo
completo, un 17 %—, de modo que fijar una altura dibujaba una marca tres veces más
pequeña de lo esperado. Se ha ajustado el `viewBox` al contenido:

| Fichero | Marco original | Marco recortado |
|---|---|---|
| `logo-completo-fondo-*.svg` | `0 0 700 500` | `114 174 454 138` |
| `logo-cuadrado-fondo-*.svg` | `0 0 512 512` | `80 71 349 349` |
| `simbolo.svg` | — | `177 114 156 156` |

Claro y oscuro comparten recorte a propósito: así tienen la misma proporción y se
pueden intercambiar sin que el logotipo cambie de tamaño al cambiar de tema.

## 3. `simbolo.svg`

El pin suelto, en vectorial. La entrega solo lo traía en PNG, y el favicon lo
necesita vectorial. Es idéntico en claro y en oscuro, así que hay un único
fichero. Se usa donde la palabra «spotter» no se leería: favicon y avatares.
