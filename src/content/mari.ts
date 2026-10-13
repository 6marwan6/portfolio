import { L, type Project } from "./types";

export const mari: Project = {
  id: "mari",
  order: 4,
  status: "shipped",
  statusNote: L(
    "In use by a real team for more than 2 weeks, with all features tested. Public release planned, subject to Riot Games' approval.",
    "يستخدمه فريق حقيقي منذ أكثر من أسبوعين، وجميع المزايا مُختبَرة. الإطلاق العام مخطَّط له، بشرط موافقة Riot Games.",
  ),
  confidentiality: "public",
  title: L("Mari", "Mari"),
  role: L("Designed and built solo", "صمّمته ونفّذته بمفردي"),
  oneLiner: L(
    "A personalized AI teammate for a Valorant Premier team. It schedules matches, tracks attendance, and talks to each player in their own tone, and it costs nothing to run.",
    "زميل فريق بالذكاء الاصطناعي مخصّص لفريق Valorant Premier. ينظّم المباريات ويتتبّع الحضور ويكلّم كل لاعب بأسلوبه، ولا يكلّف شيئًا للتشغيل.",
  ),
  story: [
    L(
      "Valorant and Riot Games are the example. The point is that an AI can be personalized, and that skill generalizes as far as it needs to.",
      "Valorant وRiot Games مجرد مثال. الفكرة أن الذكاء الاصطناعي يمكن تخصيصه، وأن هذه المهارة تتعمّم إلى أي مدى نحتاجه.",
    ),
    L(
      "Attendance keeps working even when the AI is down, because the database is the source of truth and the model only writes the personality.",
      "الحضور يظل يعمل حتى لو توقف الذكاء الاصطناعي، لأن قاعدة البيانات هي مصدر الحقيقة والنموذج يكتب الشخصية فقط.",
    ),
    L(
      "Privacy comes first: protected topics never reach the model, and private memories never leak between players.",
      "الخصوصية أولًا: المواضيع المحمية لا تصل إلى النموذج أبدًا، والذكريات الخاصة لا تتسرّب بين اللاعبين.",
    ),
    L(
      "Mari can also join a voice channel and answer out loud, in English and Arabic. Nothing is recorded or stored.",
      "يستطيع Mari أيضًا دخول قناة صوتية والرد بصوت مسموع، بالإنجليزية والعربية. لا شيء يُسجَّل أو يُخزَّن.",
    ),
    L(
      "It runs on serverless infrastructure and costs nothing to run.",
      "يعمل على بنية serverless ولا يكلّف شيئًا للتشغيل.",
    ),
  ],
  stack: ["Node.js", "Discord API", "Vercel serverless", "Neon Postgres", "Speech-to-text and text-to-speech APIs"],
  links: [],
  metrics: [],
  cost: { label: L("Monthly cost", "التكلفة الشهرية"), value: L("Zero", "صفر"), confirmed: true },
  disclaimers: [
    L("Mari is an independent project. It is not affiliated with or endorsed by Riot Games.", "Mari مشروع مستقل. وهو غير تابع لشركة Riot Games ولا برعايتها أو اعتمادها."),
    L("Valorant and Riot Games are trademarks of Riot Games.", "Valorant وRiot Games علامتان تجاريتان مملوكتان لشركة Riot Games."),
  ],
  views: [
    {
      id: "attendance-flow",
      title: L("Attendance and private AI reply", "الحضور والرد الخاص بالذكاء الاصطناعي"),
      credit: "me",
      illustrative: true,
      nodes: [
        { id: "tap", label: L("Player taps a button", "اللاعب يضغط زرًا") },
        { id: "api", label: L("Serverless API", "واجهة serverless") },
        { id: "db", label: L("Database (source of truth)", "قاعدة البيانات (مصدر الحقيقة)"), detail: L("The database is the source of truth. Attendance is recorded here before any AI is involved.", "قاعدة البيانات هي مصدر الحقيقة. يُسجَّل الحضور هنا قبل أن يتدخل أي ذكاء اصطناعي.") },
        { id: "filter", label: L("Privacy filter", "مرشّح الخصوصية"), detail: L("Protected topics and other players' private memories are removed here, before anything reaches the model.", "تُزال هنا المواضيع المحمية والذكريات الخاصة بلاعبين آخرين، قبل أن يصل أي شيء إلى النموذج.") },
        { id: "context", label: L("Context builder", "مُنشئ السياق") },
        { id: "model", label: L("Model writes the personality only", "النموذج يكتب الشخصية فقط") },
        { id: "dm", label: L("Validated private reply", "رد خاص بعد التحقق") },
      ],
      edges: [
        { from: "tap", to: "api" },
        { from: "api", to: "db" },
        { from: "db", to: "filter" },
        { from: "filter", to: "context" },
        { from: "context", to: "model" },
        { from: "model", to: "dm" },
      ],
      flows: [
        { id: "full", label: L("Full path with the AI reply", "المسار الكامل مع رد الذكاء الاصطناعي"), path: ["tap", "api", "db", "filter", "context", "model", "dm"] },
        { id: "fallback", label: L("Attendance still works if the AI fails", "الحضور يعمل حتى لو فشل الذكاء الاصطناعي"), path: ["tap", "api", "db"] },
      ],
    },
    {
      id: "voice-loop",
      title: L("Voice loop", "الحلقة الصوتية"),
      credit: "me",
      illustrative: true,
      nodes: [
        { id: "voice", label: L("Voice channel", "القناة الصوتية") },
        { id: "stt", label: L("Speech to text", "تحويل الكلام إلى نص") },
        { id: "ctx", label: L("Context", "السياق") },
        { id: "llm", label: L("Model", "النموذج") },
        { id: "tts", label: L("Text to speech", "تحويل النص إلى كلام") },
        { id: "reply", label: L("Spoken reply (nothing recorded or stored)", "رد مسموع (لا شيء يُسجَّل أو يُخزَّن)") },
      ],
      edges: [
        { from: "voice", to: "stt" },
        { from: "stt", to: "ctx" },
        { from: "ctx", to: "llm" },
        { from: "llm", to: "tts" },
        { from: "tts", to: "reply" },
      ],
    },
  ],
  tags: ["discord", "ai-personalization", "serverless", "privacy", "voice", "node", "llm", "bilingual"],
  agentNotes:
    "Present as a personalized chatbot that shows Marwan can personalize AI, using Valorant and Riot Games as the example. Persona wording: a playful gamer persona with per-player tone settings. Always say it is independent and not affiliated with Riot Games; the public release is planned subject to Riot's approval, never say approved or official. Do not give traffic numbers (unresolved C5). Demos use fictional data only.",
};
