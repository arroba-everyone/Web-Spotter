#!/bin/sh
# Genera las imágenes para compartir la web, una por idioma, en «public/og/».
#
# Usa Google Chrome en modo sin ventana para hacer una captura de la plantilla.
# Se ejecuta a mano y el resultado se guarda en el repositorio: la imagen solo
# cambia cuando cambia el mensaje de la portada, no en cada compilación.
#
#   sh scripts/imagenSocial/generar.sh
set -e

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"

for language in es en; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --virtual-time-budget=3000 \
    --window-size=1200,630 \
    --screenshot="$ROOT/public/og/spotter-$language.png" \
    "file://$HERE/plantilla.html?lang=$language" 2>/dev/null
  # JPG y no PNG: WhatsApp no enseña la vista previa si la imagen pasa de unos 300 KB.
  sips -s format jpeg -s formatOptions 82 "$ROOT/public/og/spotter-$language.png" \
    --out "$ROOT/public/og/spotter-$language.jpg" >/dev/null
  rm "$ROOT/public/og/spotter-$language.png"
  echo "public/og/spotter-$language.jpg"
done
