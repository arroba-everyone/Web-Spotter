/**
 * Textos en inglés. Se tipa contra el español, así que falta una clave aquí es un
 * error de compilación, no una página a medio traducir que llega a publicarse.
 *
 * Mismo vocabulario que en español: a «Spot», a «confirmed Spot», «your set» and
 * «spotters». Never match, like, swipe, hearts or dating.
 */
import type { Dictionary } from './es';

export const en: Dictionary = {
  meta: {
    title: 'Spotter · App to find gym and training partners',
    description:
      'Find training partners for the gym, running, cycling, Hyrox or calisthenics near you. Every day, 5 people with your schedule and level. On iOS and Android.',
    localeName: 'English',
    htmlLang: 'en',
    ogLocale: 'en_GB',
    ogImageAlt: 'Spotter: find someone to train with. Five bubbles with people who train.',
  },

  downloadPage: {
    title: 'Download Spotter · iPhone and Android',
    description:
      'Download Spotter on the App Store or Google Play and meet five people who train near you every day, with your schedule and your level.',
  },

  notFound: {
    title: 'This page does not exist',
    body: 'The link may be old or mistyped. Whatever you are looking for is surely on the home page.',
    action: 'Go to the home page',
  },

  nav: {
    label: 'Sections',
    howItWorks: 'How it works',
    gym: 'Your gym',
    safety: 'Safety',
    team: 'Team',
    download: 'Download',
    skipToContent: 'Skip to content',
  },

  hero: {
    eyebrow: 'Train with company',
    titleLine1: 'Find',
    titleLine2: 'someone to',
    titleHighlight: 'train with.',
    subtitle:
      'Every day, five people who train near you, with your sports and your schedule. Give a Spot, they answer and you have a plan.',
    secondaryAction: 'How it works',
    seriesLabel: '5 people to train with today',
    changesIn: 'New ones in {hours} h',
    changesAtMidnight: 'New ones at midnight',
    shuffle: 'Shake them up',
    dragHint: 'Grab them and throw them',
    bubblesLabel:
      'Your set for today: five bubbles with photos of people who train, each in the colour of their sport. You can grab, throw and shuffle them.',
  },

  marquee: {
    label: 'Spotter sports and motto',
    motto: ['Spot', 'Body', 'Mind', 'Repeat'],
  },

  sports: {
    names: {
      gym: 'Gym',
      running: 'Running',
      cycling: 'Cycling',
      hyrox: 'Hyrox',
      calisthenics: 'Calisthenics',
      other: 'Other',
    },
  },

  howItWorks: {
    eyebrow: 'How it works',
    title: 'Three steps, then train.',
    steps: [
      {
        title: 'Tell us where and how you train',
        body: 'Your exact gym, your sports, your level and when you usually go. That is all Spotter needs to know who to introduce you to.',
        captureAlt: 'Spotter place search showing several gyms in Valencia and how far they are.',
      },
      {
        title: 'Every day, your set of five',
        body: 'Five people who train nearby and fit you. They float in bubbles: grab them, throw them, shake them up. Tomorrow, five new ones.',
        captureAlt: 'Discover screen with five bubbles: three with photos and two with initials.',
      },
      {
        title: 'Give a Spot and meet up',
        body: 'If someone fits, give them a Spot. If they answer, the chat opens and you plan a session. That simple.',
        captureAlt: 'Álvaro’s profile, 29, with his sports, his level and the Give a Spot button.',
        secondCaptureAlt: 'A chat between two spotters planning a morning session.',
      },
    ],
  },

  manifesto: {
    text: 'Fitness does not fail for lack of will. It fails for lack of company.',
  },

  gym: {
    eyebrow: 'Your gym, exactly',
    titleStart: 'Your',
    places: ['gym', 'park', 'running club', 'box', 'track'],
    titleEnd: 'exactly.',
    body: 'We do not introduce you to people from any gym in your city. We introduce you to people from yours: the same place, the same floor and, with some luck, the same time.',
    statValue: 10000,
    statPrefix: '+',
    statLabel: 'gyms, parks and tracks across Spain to pick yours from',
    addTitle: 'Your place is missing?',
    addBody: 'Add it to the map yourself and you are done. Your calisthenics park counts too.',
    captureAlt: 'Spotter gym search filtering by Valencia.',
  },

  spot: {
    eyebrow: 'Give a Spot',
    title: 'People come here to train.',
    body: 'A spotter is the person who guards your bar on the bench: they are there for you. So a Spot means one thing only, I want to train with you.',
    rules: [
      {
        title: 'Nobody writes to you uninvited',
        body: 'Whoever gives the Spot cannot message you until you answer. Zero messages from strangers.',
      },
      {
        title: 'You answer, you have a plan',
        body: 'If it fits, you answer, the chat opens and you meet up. If not, nothing happens.',
      },
    ],
    demo: {
      tryIt: 'Try it',
      name: 'Lucía',
      age: '27 years old',
      detail: 'Runs in the mornings',
      action: 'Give a Spot',
      sent: 'Spot sent',
      waiting: 'If she answers, you can talk. Until then, you cannot write to her.',
      replyTitle: 'Lucía gave you a Spot',
      replyBody: 'Answer and start talking.',
      replyAction: 'Go to chat',
      reset: 'Again',
      photoAlt: 'Profile photo of Lucía, running in a park.',
    },
    captureAlt: 'App notice: Marta gave you a Spot, with the Go to chat button.',
  },

  community: {
    eyebrow: 'Community',
    title: 'First a training partner. Then, your group.',
    body: 'Groups from your gym, your sport or your area: the people you run into every week, in one place. Because a plan where people are waiting for you is a plan you do not skip.',
    groupKinds: ['From your gym', 'From your sport', 'From your area'],
    quote: 'Community is the secret of consistency.',
    eventsTitle: 'And off the screen, too.',
    eventsBody:
      'We organise sporty afterworks with brands and venues so the community gets to meet in person. We announce them on Instagram.',
    eventsAction: 'Follow us at',
    captureAlt: 'Messages screen with the To reply, Conversations and Groups sections.',
  },

  privacy: {
    eyebrow: 'Safety',
    title: 'Your location is yours. So is your data.',
    items: [
      {
        title: 'Your exact location, never',
        body: 'Spotter uses where you train to introduce you to people nearby, but your exact position is shown to no one.',
      },
      {
        title: 'Photos without a trace',
        body: 'Photos are uploaded without the GPS location your phone stores inside every picture.',
      },
      {
        title: 'Report in one tap',
        body: 'If a message is not right, report it from the chat itself.',
      },
      {
        title: 'Your account, your call',
        body: 'Delete your account whenever you want, from the app, without writing to anyone.',
      },
    ],
    adults: 'Adults only, 18 and over.',
  },

  team: {
    eyebrow: 'Who we are',
    title: 'Three people set on nobody training alone.',
    lead: 'Spotter does not come from a big company. It comes from a small team with a very specific idea: that nobody at your gym has to train alone.',
    members: {
      paula: {
        role: 'Founder · Business',
        bio: 'The reason Spotter exists. She runs the business, talks to gyms and brands and decides where the product goes. If you have a proposal, it ends up on her desk.',
      },
      juan: {
        role: 'iOS development',
        bio: 'Builds the iPhone app screen by screen: the bubbles, the glass and every gesture. And, while at it, this website.',
      },
      pablo: {
        role: 'Android and backend',
        bio: 'Everything you do not see and nothing works without: accounts, data, the place search and the logic that puts your set together every day. He also looks after the Android version.',
      },
    },
    collaborateTitle: 'Run a gym, a club or a brand?',
    collaborateBody:
      'We want Spotter to be where people train. If you want to bring it to your venue or organise something with the community, write to us: a person will answer.',
    collaborateAction: 'Write to us',
  },

  faq: {
    eyebrow: 'Questions',
    title: 'Quick answers.',
    items: [
      {
        question: 'How do I find a gym partner?',
        answer:
          'Pick your gym, your sports and when you usually train. Every day, Spotter introduces you to five people who train nearby, with your level and your schedule. If someone fits, give them a Spot.',
      },
      {
        question: 'Who is Spotter for?',
        answer:
          'For anyone who trains at the gym, runs, cycles, does Hyrox or calisthenics and would rather do it with someone. Adults only, 18 and over.',
      },
      {
        question: 'Where does it work?',
        answer:
          'In Spain. Pick your gym from more than 10,000 places, and if yours is missing, add it yourself.',
      },
      {
        question: 'Can anyone write to me?',
        answer:
          'No. Whoever gives you a Spot cannot write to you until you answer. If you do not answer, there is no conversation.',
      },
      {
        question: 'What can people see of my location?',
        answer:
          'Your exact position, nothing. It is used to introduce you to people nearby but shown to no one, and photos are uploaded without GPS location.',
      },
      {
        question: 'Is it on Android?',
        answer: 'Yes. Spotter is on iPhone and Android.',
      },
    ],
  },

  download: {
    eyebrow: 'Start today',
    title: 'Stop training alone.',
    body: 'Tomorrow there are five new people near you. All that is missing is you showing up.',
    appStoreAlt: 'Download on the App Store',
    googlePlayAlt: 'Get it on Google Play',
  },

  floatingBar: {
    text: 'Find someone to train with',
    action: 'Download',
  },

  footer: {
    tagline: 'Train with company.',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    instagram: 'Instagram',
    rights: 'All rights reserved.',
  },
};
