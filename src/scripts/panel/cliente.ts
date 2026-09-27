/**
 * El único punto por el que el panel habla con Supabase.
 *
 * Por qué todo en el navegador: esta web es estática, no hay servidor donde
 * comprobar nada. No es un problema de seguridad, porque quien protege los
 * datos es RLS, dentro de la base de datos: las funciones `admin_*` empiezan
 * comprobando que quien llama es staff, y sin serlo devuelven un error aunque
 * alguien se invente la pantalla entera.
 *
 * La guardia de esta web solo evita enseñar pantallas vacías.
 *
 * La clave que se usa aquí es la pública: está pensada para viajar en el
 * JavaScript que descarga cualquiera. La de servicio no entra nunca en la web.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL_SUPABASE = import.meta.env.PUBLIC_SPOTTER_SUPABASE_URL;
const CLAVE_PUBLICA = import.meta.env.PUBLIC_SPOTTER_SUPABASE_KEY;

let cliente: SupabaseClient | null = null;

/**
 * Cliente único para toda la sesión.
 *
 * `storageKey` propio: si algún día esta web tuviera otra sesión de Supabase,
 * entrar en el panel no echaría a nadie de la otra.
 */
export function clienteSpotter(): SupabaseClient {
  if (cliente) return cliente;

  if (!URL_SUPABASE || !CLAVE_PUBLICA) {
    throw new Error(
      'Faltan PUBLIC_SPOTTER_SUPABASE_URL y PUBLIC_SPOTTER_SUPABASE_KEY. Mira el fichero .env.example.',
    );
  }

  cliente = createClient(URL_SUPABASE, CLAVE_PUBLICA, {
    auth: {
      storageKey: 'sb-spotter-panel',
      persistSession: true,
      autoRefreshToken: true,
      /*
       * Google devuelve al navegador con un código en la dirección, y esto es
       * lo que lo cambia por una sesión. Hace falta para «Entrar con Google».
       */
      detectSessionInUrl: true,
    },
  });
  return cliente;
}

/**
 * Entrar con la cuenta de Google del equipo.
 *
 * El documento del panel descartaba Google (§6.1), pero las cuentas del equipo
 * son de Google y así no hay ninguna contraseña que guardar, repartir ni
 * olvidar. Quien no sea staff se queda fuera igual: lo decide el token, no el
 * botón por el que ha entrado.
 *
 * Para que funcione, la dirección de vuelta tiene que estar permitida en
 * Supabase (Authentication → URL Configuration → Redirect URLs).
 */
export async function entrarConGoogle(): Promise<{ error: string | null }> {
  const { error } = await clienteSpotter().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}${RUTA_ENTRAR}` },
  });
  return { error: error ? mensajeDeError(error) : null };
}

/**
 * Enlace temporal para ver una foto privada.
 *
 * Los cajones de Supabase son privados y así se quedan: en vez de abrirlos, se
 * pide un enlace firmado que caduca solo. Un minuto es de sobra para mirar una
 * foto y poco para que el enlace acabe reenviado por ahí.
 *
 * Devuelve null si la foto ya no está o si el permiso no llega.
 */
export async function urlFirmada(cajon: string, clave: string): Promise<string | null> {
  const { data, error } = await clienteSpotter().storage.from(cajon).createSignedUrl(clave, 60);
  return error ? null : data.signedUrl;
}

/** Ruta de la pantalla de entrar. En un sitio para no escribirla en cinco ficheros. */
export const RUTA_ENTRAR = '/panel/entrar/';
export const RUTA_INICIO = '/panel/';

export interface SesionPanel {
  userId: string;
  email: string;
  esStaff: boolean;
}

/**
 * Lee la sesión guardada.
 *
 * Quién es staff viaja dentro del token (`app_metadata.staff`), que solo se
 * puede cambiar desde Supabase o con la clave de servicio: nadie se lo puede
 * poner a sí mismo desde el navegador.
 */
export async function sesionActual(): Promise<SesionPanel | null> {
  const { data, error } = await clienteSpotter().auth.getUser();
  if (error || !data.user) return null;

  return {
    userId: data.user.id,
    email: data.user.email ?? '',
    esStaff: data.user.app_metadata?.['staff'] === true,
  };
}

/**
 * Deja pasar solo a quien es staff. Devuelve la sesión, o lleva a entrar.
 *
 * Quien tiene cuenta pero no es staff se va con la sesión cerrada y un aviso:
 * mejor eso que una pantalla vacía sin explicación (PANEL-ADMIN.md §6.1).
 */
export async function exigirStaff(): Promise<SesionPanel | null> {
  const sesion = await sesionActual();

  if (!sesion) {
    window.location.replace(RUTA_ENTRAR);
    return null;
  }

  if (!sesion.esStaff) {
    await clienteSpotter().auth.signOut();
    window.location.replace(`${RUTA_ENTRAR}?sinAcceso=1`);
    return null;
  }

  return sesion;
}

export async function salir(): Promise<void> {
  await clienteSpotter().auth.signOut();
  window.location.replace(RUTA_ENTRAR);
}

/**
 * Traduce los errores de Supabase a algo que se pueda leer.
 *
 * Los mensajes vienen en inglés y, los de las funciones, en el idioma en que
 * los escribimos en el SQL. Aquí se recogen los que se van a ver de verdad.
 */
export function mensajeDeError(error: unknown): string {
  const texto = error instanceof Error ? error.message : String(error);

  if (texto.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (texto.includes('Email not confirmed')) return 'Esa cuenta todavía no tiene el correo confirmado.';
  if (texto.includes('no autorizado')) return 'Esta cuenta no tiene acceso al panel.';
  if (texto.includes('Failed to fetch')) return 'No se ha podido conectar. Revisa la conexión.';
  return texto;
}
