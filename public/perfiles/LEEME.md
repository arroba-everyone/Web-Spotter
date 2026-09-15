# Fotos de las burbujas de la portada

Son de **Pexels**, con licencia gratuita para uso comercial y sin obligación de
citar al autor. Se descargaron el 7 de septiembre de 2026 y están guardadas aquí
a propósito, en lugar de enlazarlas desde Pexels: así la portada no depende de un
servidor ajeno y ningún visitante de la web deja rastro en él.

| Fichero | Origen |
|---|---|
| `gimnasio.jpg` | pexels.com/photo/3888405 |
| `running.jpg` | pexels.com/photo/7242885 |
| `ciclismo.jpg` | pexels.com/photo/7476445 |
| `hyrox.jpg` | pexels.com/photo/863986 |
| `calistenia.jpg` | pexels.com/photo/13965342 |

## El encuadre no está en el fichero

Las fotos se guardan enteras y **es el CSS el que decide qué se ve dentro del
círculo**, con los campos `focus` y `zoom` de `src/domain/dailySeries.ts`.

Se hace así, y no recortando los ficheros, porque el recorte es lo que más se
retoca: cada vez que cambia una foto habría que volver a recortarla con una
herramienta externa, y cualquiera que abra el proyecto puede en cambio cambiar un
número y ver el resultado al instante.

- **`focus`** dice qué punto de la foto queda en el centro del círculo. Recortar
  por el centro deja la cara fuera casi siempre: en un retrato vertical, el
  centro de la imagen cae a la altura del pecho.
- **`zoom`** acerca la foto. Hace falta cuando la persona sale de cuerpo entero:
  por mucho que se mueva el encuadre, la cara sigue siendo diminuta dentro de una
  burbuja de 140 píxeles.

Al cambiar una foto hay que revisar sus dos valores. Se ajustan mirando.

**Son de relleno.** En cuanto haya perfiles reales autorizados, se sustituyen por
ficheros con estos mismos nombres.
