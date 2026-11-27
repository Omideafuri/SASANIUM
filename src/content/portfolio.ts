export interface StopContent {
  id: string;
  number: string;
  landmark: string;
  discipline: string;
  intro: string;
  steps: [string, string, string];
  inPractice: string;
}

export interface SheetProjectCard {
  id: string;
  number: string;
  name: string;
  monogram: string;
  category: string;
  role: string;
  tone: 'ink' | 'accent' | 'sand';
  year: string;
  description: string;
  /** Optional fields — remain unrendered when empty */
  video?: string;
  image?: string;
  link?: string;
  logo?: string;
}

export const PORTFOLIO_CONTENT = {
  seo: {
    title: 'SASANIUM | Art Director & Creative Technologist',
    description:
      'Art director and creative technologist in İzmir creating commercial video campaigns, AI media pipelines, automation systems and mobile prototypes for clients worldwide.',
  },

  ui: {
    brandMark: 'SASANIUM',
    brandTagline: 'Art Director & Creative Technologist',
    loadingLabel: 'PREPARING SEQUENCE',
    scrollHint: 'Scroll to explore',
    howIWorkLabel: 'How I work',
    inPracticeLabel: 'In practice',
    canvasAriaLabel:
      'Interactive scroll-driven portfolio of SASANIUM, Art Director and Creative Technologist',
    fallbackTitle: 'Sequence Unavailable',
    fallbackBody:
      'The visual sequence could not be loaded. Please check your connection and refresh.',
  },

  hero: {
    name: 'SASANIUM',
    title: 'Art Director & Creative Technologist',
    subtitle: 'Design Manager · AI Media · Automation',
    statement:
      'I direct **cinematic commercial visuals**, build **AI-powered media pipelines**, and engineer practical **automation and mobile tools**, bridging high-contrast art direction with systems-level execution.',
    location: 'İzmir, Turkey. Working worldwide.',
    /** Optional URLs — CTAs only render when data exists */
    showreelUrl: '' as string,
    email: '' as string,
    handle: '@flyartg',
    handleUrl: 'https://instagram.com/flyartg',
  },

  stops: [
    {
      id: 'persepolis',
      number: '01',
      landmark: 'Persepolis',
      discipline: 'Art Direction',
      intro:
        'I shape the look and story of commercial campaigns, turning a brief into a clear visual direction before the first frame is made.',
      steps: [
        'Define the idea, tone and audience.',
        'Build the visual language: palette, framing, pacing.',
        'Direct every format, from 16:9 films to 9:16 social cuts.',
      ],
      inPractice: 'León Y Sol · Certified Habanero · SASANIUM',
    },
    {
      id: 'pasargadae',
      number: '02',
      landmark: 'Pasargadae',
      discipline: 'Motion Design',
      intro:
        'I bring identities and campaigns to life with motion graphics, from cinematic logo reveals to full video sequences.',
      steps: [
        'Storyboard the rhythm and key moments.',
        'Design and animate type, shapes and transitions.',
        'Refine the timing until every cut feels deliberate.',
      ],
      inPractice: 'León Y Sol · SASANIUM',
    },
    {
      id: 'isfahan',
      number: '03',
      landmark: 'Naqsh-e Jahan',
      discipline: 'Sound & Voice',
      intro:
        'Sound carries half the story. I produce voiceover, sound design and original music so every film feels finished.',
      steps: [
        'Shape the script and voice, including multilingual versions.',
        'Layer custom sound design and effects.',
        'Create an original score and mix it to the picture.',
      ],
      inPractice: 'León Y Sol',
    },
    {
      id: 'hafez',
      number: '04',
      landmark: 'Hafez Tomb',
      discipline: 'AI Media Production',
      intro:
        'I build AI-assisted production pipelines that take an idea to finished video, voice and music at commercial quality.',
      steps: [
        'Plan shot by shot, with clear references and intent.',
        'Generate with tools such as Kling, Runway, Luma and Midjourney.',
        'Direct, edit and grade so the result reads as one piece.',
      ],
      inPractice: 'Certified Habanero · León Y Sol',
    },
    {
      id: 'abyaneh',
      number: '05',
      landmark: 'Abyaneh',
      discipline: 'Automation & AI Engineering',
      intro:
        'I design autonomous workflows and AI agents that handle repetitive work, so teams can focus on creative decisions.',
      steps: [
        'Map the process and find what can run on its own.',
        'Connect the APIs and triggers in n8n.',
        'Test and refine until it runs reliably.',
      ],
      inPractice: 'Autonomous Lead-Gen & Outreach Engine',
    },
    {
      id: 'azadi',
      number: '06',
      landmark: 'Azadi Tower',
      discipline: 'Mobile Product Design',
      intro:
        'I design and build mobile products, from the first architecture sketch to a working Android or React Native prototype.',
      steps: [
        'Define the problem and its constraints, such as no internet.',
        'Design clear, editorial interfaces made for fast use.',
        'Build and test a working prototype.',
      ],
      inPractice: 'Sayeh · Tahlilium',
    },
  ] satisfies StopContent[],

  sheet: {
    topBar: {
      pill: 'SASANIUM',
      centerWordmark: 'Selected Works · 2026',
      location: 'İzmir · Worldwide',
      cta: "Let's talk",
    },
    headlineLine1: "PROJECTS I'M",
    headlineLine2: 'PROUD OF',
    pill1: 'Six of them',
    pill2: 'All 2026',
    intro:
      'A selection of campaigns, identities, automations and apps built across art direction, AI and engineering. Different briefs, one standard: make it sharp.',
    cards: [
      {
        id: 'leon-y-sol',
        number: '01',
        name: 'León Y Sol',
        monogram: 'LS',
        category: 'COMMERCIAL VIDEO',
        role: 'Art Director, Motion Designer & Audio Producer',
        tone: 'ink',
        year: '2026',
        description:
          'An end-to-end promotional video suite in 16:9 and 9:16, with motion graphics, multilingual voiceover, custom sound design and an original AI-assisted score.',
      },
      {
        id: 'certified-habanero',
        number: '02',
        name: 'Certified Habanero',
        monogram: 'CH',
        category: 'LAUNCH VIDEO',
        role: 'Video Producer & Visual Director',
        tone: 'accent',
        year: '2026',
        description:
          'Shot-by-shot commercial launch assets and high-impact visual sequences for digital brand positioning and audience engagement.',
      },
      {
        id: 'sasanium',
        number: '03',
        name: 'SASANIUM',
        monogram: 'SA',
        category: 'BRAND & MOTION',
        role: 'Founder & Designer',
        tone: 'sand',
        year: '2026',
        description:
          'A dark, high-contrast identity system with a custom emblem and cinematic logo reveal animations.',
      },
      {
        id: 'autonomous-lead-gen',
        number: '04',
        name: 'Autonomous Lead-Gen & Outreach Engine',
        monogram: 'AL',
        category: 'AI AUTOMATION',
        role: 'Automation Engineer',
        tone: 'accent',
        year: '2026',
        description:
          'An end-to-end AI workflow connecting Telegram bot triggers, SerpAPI, Hunter, Google Drive and automated SMTP outreach.',
      },
      {
        id: 'sayeh',
        number: '05',
        name: 'Sayeh',
        monogram: 'SY',
        category: 'ANDROID APP',
        role: 'Product Architect & Android Developer',
        tone: 'sand',
        year: '2026',
        description:
          'Offline messaging routed through Wi-Fi, Bluetooth mesh hopping, optical scanning, ultrasound and SMS.',
      },
      {
        id: 'tahlilium',
        number: '06',
        name: 'Tahlilium',
        monogram: 'TH',
        category: 'MOBILE PROTOTYPE',
        role: 'UI/UX & Mobile Developer',
        tone: 'ink',
        year: '2026',
        description:
          'An editorial mobile interface prototype for fast reading and analytical content discovery.',
      },
    ] satisfies SheetProjectCard[],
    toolsTicker: [
      'KLING AI',
      'RUNWAY',
      'LUMA',
      'MIDJOURNEY',
      'ELEVENLABS',
      'SUNO AI',
      'N8N',
      'CAPCUT',
      'REACT NATIVE',
      'EXPO',
      'ANDROID',
    ],
  },

  contact: {
    headline: "LET'S BUILD SOMETHING SHARP.",
    text: 'Available for commercial direction, AI production pipelines and select creative-tech collaborations.',
    handle: '@flyartg',
    handleUrl: 'https://instagram.com/flyartg',
    email: '' as string,
    linkedin: '' as string,
    x: '' as string,
    behance: '' as string,
    copyright: '© 2026 SASANIUM',
  },
} as const;
