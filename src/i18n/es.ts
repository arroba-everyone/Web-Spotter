/**
 * Textos en español. Es el idioma de referencia: el diccionario inglés se tipa
 * contra este, de forma que añadir una clave aquí obliga a traducirla allí.
 *
 * Vocabulario obligatorio de Spotter 2.0 (brief, §2): se da un «Spot», y cuando
 * la otra persona contesta es un «Spot confirmado». La selección diaria es «tu
 * serie». Una persona de la comunidad es un «spotter».
 *
 * Prohibido en cualquier texto: match, like, corazón, swipe, deslizar, ligar,
 * cita, y cualquier promesa de lo que la app todavía no hace (brief, §3).
 * Tampoco se usan guiones largos en mitad de las frases.
 */
export const es = {
  meta: {
    /*
     * Título y descripción que salen en Google. Están escritos para las
     * búsquedas reales («compañero de gimnasio», «compañeros para entrenar») y
     * con límite: Google corta el título hacia los 60 caracteres y la
     * descripción hacia los 155.
     */
    title: 'Spotter · App para encontrar compañeros de entrenamiento',
    description:
      'Encuentra compañeros de gimnasio, running, ciclismo, Hyrox o calistenia cerca de ti. Cada día, 5 personas con tu horario y tu nivel. En iOS y Android.',
    localeName: 'Español',
    htmlLang: 'es',
    /** Formato que piden Facebook, WhatsApp y LinkedIn: idioma y país. */
    ogLocale: 'es_ES',
    ogImageAlt: 'Spotter: encuentra con quién entrenar. Cinco burbujas con personas que entrenan.',
  },

  downloadPage: {
    title: 'Descargar Spotter · iPhone y Android',
    description:
      'Descarga Spotter en el App Store o en Google Play y encuentra cada día cinco personas que entrenan cerca de ti, con tu horario y tu nivel.',
  },

  notFound: {
    title: 'Esta página no existe',
    body: 'Puede que el enlace sea antiguo o que se haya escrito mal. Lo que buscas seguro que está en la portada.',
    action: 'Ir a la portada',
  },

  nav: {
    label: 'Secciones',
    howItWorks: 'Cómo funciona',
    gym: 'Tu gimnasio',
    safety: 'Seguridad',
    team: 'Equipo',
    download: 'Descargar',
    skipToContent: 'Saltar al contenido',
  },

  hero: {
    eyebrow: 'Entrena acompañado',
    titleLine1: 'Encuentra',
    titleLine2: 'con quién',
    titleHighlight: 'entrenar.',
    subtitle:
      'Cada día, cinco personas que entrenan cerca de ti, con tus deportes y tu horario. Das un Spot, te contestan y ya tenéis plan.',
    secondaryAction: 'Cómo funciona',
    bubblesLabel:
      'Tu serie de hoy: cinco burbujas con la foto de personas que entrenan, cada una con el color de su deporte. Se pueden coger y lanzar.',
  },

  marquee: {
    label: 'Deportes y lema de Spotter',
    motto: ['Spot', 'Body', 'Mind', 'Repeat'],
  },

  sports: {
    names: {
      gym: 'Gimnasio',
      running: 'Running',
      cycling: 'Ciclismo',
      hyrox: 'Hyrox',
      calisthenics: 'Calistenia',
      other: 'Otro',
    },
  },

  howItWorks: {
    eyebrow: 'Cómo funciona',
    title: 'Tres pasos y a entrenar.',
    steps: [
      {
        title: 'Dinos dónde y cómo entrenas',
        body: 'Tu gimnasio exacto, tus deportes, tu nivel y a qué hora sueles ir. Con eso Spotter ya sabe a quién presentarte.',
        captureAlt: 'Buscador de sitios de Spotter con varios gimnasios de Valencia y su distancia.',
      },
      {
        title: 'Cada día, tu serie de cinco',
        body: 'Cinco personas que entrenan cerca y encajan contigo. Flotan en burbujas: las coges, las lanzas, las revuelves. Mañana, cinco nuevas.',
        captureAlt: 'Pantalla Descubrir con cinco burbujas: tres con foto y dos con la inicial.',
      },
      {
        title: 'Da un Spot y quedad',
        body: 'Si alguien te encaja, le das un Spot. Si contesta, se abre el chat y quedáis para entrenar. Así de simple.',
        captureAlt: 'Perfil de Álvaro, 29 años, con sus deportes, su nivel y el botón Dar un Spot.',
        secondCaptureAlt: 'Chat entre dos spotters quedando para entrenar por la mañana.',
      },
    ],
  },

  manifesto: {
    text: 'El fitness no falla por falta de ganas. Falla por falta de compañía.',
  },

  gym: {
    eyebrow: 'Tu gimnasio, exacto',
    titleStart: 'Tu',
    // Se turnan en el titular. El primero es el que se lee sin JavaScript.
    places: ['gimnasio', 'parque', 'club de running', 'box', 'pista'],
    titleEnd: 'exacto.',
    body: 'No te presentamos a gente de un gimnasio cualquiera de tu ciudad. Te presentamos a quien va al tuyo: el mismo sitio, la misma sala y, con suerte, a la misma hora.',
    statValue: 10000,
    statPrefix: '+',
    statLabel: 'gimnasios, parques y pistas de toda España para elegir el tuyo',
    addTitle: '¿No está tu sitio?',
    addBody: 'Lo pones tú en el mapa y listo. Tu parque de calistenia también cuenta.',
    captureAlt: 'Buscador de gimnasios de Spotter filtrando por Valencia.',
  },

  spot: {
    eyebrow: 'Dar un Spot',
    title: 'Aquí se viene a entrenar.',
    body: 'Un spotter es quien te asegura la barra en el banco: acompaña. Por eso un Spot significa una sola cosa, quiero entrenar contigo.',
    rules: [
      {
        title: 'Nadie te escribe sin permiso',
        body: 'Quien da el Spot no puede mandarte nada hasta que contestes. Cero mensajes de desconocidos.',
      },
      {
        title: 'Contestas y hay plan',
        body: 'Si te encaja, contestas, se abre el chat y quedáis. Si no, no pasa nada.',
      },
    ],
    demo: {
      tryIt: 'Pruébalo',
      name: 'Lucía',
      age: '27 años',
      detail: 'Corre por las mañanas',
      action: 'Dar un Spot',
      sent: 'Spot enviado',
      waiting: 'Si contesta, ya podéis hablar. Hasta entonces, no puedes escribirle.',
      replyTitle: 'Lucía te ha dado un Spot',
      replyBody: 'Contesta y empezáis a hablar.',
      replyAction: 'Ir al chat',
      reset: 'Otra vez',
      photoAlt: 'Foto de perfil de Lucía, corriendo en un parque.',
    },
    captureAlt: 'Aviso en la app: Marta te ha dado un Spot, con el botón Ir al chat.',
  },

  community: {
    eyebrow: 'Comunidad',
    title: 'Primero un compañero. Luego, tu grupo.',
    body: 'Grupos de tu gimnasio, de tu deporte o de tu zona: la gente con la que coincides cada semana, en un mismo sitio. Porque un plan en el que te esperan es un plan que no te saltas.',
    groupKinds: ['De tu gimnasio', 'De tu deporte', 'De tu zona'],
    quote: 'La comunidad es el secreto de la constancia.',
    eventsTitle: 'Y fuera de la pantalla, también.',
    eventsBody:
      'Organizamos afterworks deportivos con marcas y centros para que la comunidad se conozca en persona. Los anunciamos en Instagram.',
    eventsAction: 'Síguenos en',
    captureAlt: 'Pantalla Mensajes con las secciones Por contestar, Conversaciones y Grupos.',
  },

  privacy: {
    eyebrow: 'Seguridad',
    title: 'Tu ubicación es tuya. Tus datos, también.',
    items: [
      {
        title: 'Tu ubicación exacta, nunca',
        body: 'Spotter usa dónde entrenas para presentarte gente cerca, pero tu posición exacta no se enseña a nadie.',
      },
      {
        title: 'Fotos sin rastro',
        body: 'Las fotos se suben sin la ubicación GPS que el móvil guarda dentro de cada imagen.',
      },
      {
        title: 'Reportar en un toque',
        body: 'Si un mensaje no está bien, lo reportas desde el propio chat.',
      },
      {
        title: 'Tu cuenta, tu decisión',
        body: 'Borras tu cuenta cuando quieras, desde la app y sin escribir a nadie.',
      },
    ],
    adults: 'Solo para mayores de 18 años.',
  },

  team: {
    eyebrow: 'Quiénes somos',
    title: 'Tres personas empeñadas en que nadie entrene solo.',
    lead: 'Spotter no sale de una gran empresa. Sale de un equipo pequeño con una idea muy concreta: que en tu gimnasio nadie tenga que entrenar solo.',
    members: {
      paula: {
        role: 'Fundadora · Negocio',
        bio: 'La culpable de que Spotter exista. Lleva el negocio, habla con gimnasios y marcas y decide hacia dónde va el producto. Si tienes una propuesta, acaba en su mesa.',
      },
      juan: {
        role: 'Desarrollo iOS',
        bio: 'Construye la app de iPhone pantalla a pantalla: las burbujas, el cristal y cada gesto. Y, ya puestos, esta web.',
      },
      pablo: {
        role: 'Android y backend',
        bio: 'Todo lo que no se ve y sin lo que nada funciona: cuentas, datos, el buscador de sitios y la lógica que arma tu serie cada día. También cuida la versión de Android.',
      },
    },
    collaborateTitle: '¿Tienes un gimnasio, un club o una marca?',
    collaborateBody:
      'Queremos que Spotter esté donde se entrena. Si quieres llevarlo a tu centro u organizar algo con la comunidad, escríbenos: te contesta una persona.',
    collaborateAction: 'Escríbenos',
  },

  faq: {
    eyebrow: 'Preguntas',
    title: 'Dudas rápidas.',
    items: [
      {
        question: '¿Cómo encuentro compañero para ir al gimnasio?',
        answer:
          'Eliges tu gimnasio, tus deportes y a qué hora sueles ir. Cada día, Spotter te presenta cinco personas que entrenan cerca, con tu nivel y tu horario. Si alguien te encaja, le das un Spot.',
      },
      {
        question: '¿Para quién es Spotter?',
        answer:
          'Para quien entrena en el gimnasio, sale a correr, monta en bici, hace Hyrox o calistenia y prefiere hacerlo con alguien. Solo para mayores de 18 años.',
      },
      {
        question: '¿Dónde funciona?',
        answer:
          'En España. Eliges tu gimnasio entre más de 10.000 sitios, y si el tuyo no está, lo añades tú.',
      },
      {
        question: '¿Cualquiera puede escribirme?',
        answer:
          'No. Quien te da un Spot no puede escribirte hasta que contestes. Si no contestas, no hay conversación.',
      },
      {
        question: '¿Qué se ve de mi ubicación?',
        answer:
          'Tu posición exacta, nada. Se usa para presentarte gente cerca, pero no se enseña a nadie, y las fotos se suben sin ubicación GPS.',
      },
      {
        question: '¿Está en Android?',
        answer: 'Sí. Spotter está en iPhone y en Android.',
      },
    ],
  },

  download: {
    eyebrow: 'Empieza hoy',
    title: 'Deja de entrenar solo.',
    body: 'Mañana tienes cinco personas nuevas cerca de ti. Solo falta que aparezcas.',
    appStoreAlt: 'Descárgalo en el App Store',
    googlePlayAlt: 'Disponible en Google Play',
  },

  floatingBar: {
    text: 'Encuentra con quién entrenar',
    action: 'Descargar',
  },

  footer: {
    tagline: 'Entrena acompañado.',
    privacy: 'Privacidad',
    terms: 'Términos',
    contact: 'Contacto',
    instagram: 'Instagram',
    rights: 'Todos los derechos reservados.',
    builtBy: 'Desarrollada por',
  },
};

/** Forma que debe cumplir cualquier idioma del sitio. */
export type Dictionary = typeof es;
