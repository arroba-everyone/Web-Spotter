/**
 * Tipos de las variables de entorno propias.
 *
 * Sin esto, `import.meta.env.PUBLIC_SPOTTER_SUPABASE_URL` sería `any` y un error
 * de escritura en el nombre no lo cazaría nadie hasta ver el panel en blanco.
 *
 * Las dos son públicas a propósito: acaban en el JavaScript que descarga el
 * navegador. La clave de servicio de Supabase no entra nunca en la web.
 */
interface ImportMetaEnv {
  readonly PUBLIC_SPOTTER_SUPABASE_URL: string;
  readonly PUBLIC_SPOTTER_SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
