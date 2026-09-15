// @ts-check
import { defineConfig } from 'astro/config';

// Configuración del sitio. El dominio real se ajustará al desplegar; hoy solo
// afecta a las URL absolutas del sitemap y las etiquetas Open Graph.
export default defineConfig({
  site: 'https://spotterapp.es',

  // Español es el idioma por defecto y vive en la raíz («/»), no en «/es».
  // Así las URL que ya están indexadas hoy siguen siendo válidas.
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
