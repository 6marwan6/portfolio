import { L, type Project } from "./types";

export const rootx: Project = {
  id: "rootx",
  order: 2,
  status: "shipped",
  statusNote: L(
    "The platform and the Pentest Portal are finished and ready for use.",
    "المنصة وبوابة الاختبار الأمني جاهزتان للاستخدام.",
  ),
  confidentiality: "redacted",
  title: L("RootX", "RootX"),
  role: L("Full-Stack Developer and Technical Lead", "مطوّر Full Stack وقائد تقني"),
  oneLiner: L(
    "I lead the engineering for a security company's platform: a consulting website, an Arabic and English academy, a bug bounty ranking system, and a private pentest reporting portal.",
    "أقود الهندسة لمنصة شركة أمن معلومات: موقع استشارات، وأكاديمية بالعربية والإنجليزية، ونظام تصنيف لبرامج مكافآت الثغرات، وبوابة خاصة لتقارير اختبار الاختراق.",
  ),
  story: [
    L(
      "Rankings have to be explainable, so the Ranking System scores deterministically and auditably. A language model may extract data, but it never scores. Any change that affects public scores needs two admins and leaves a full diff trail.",
      "التصنيفات لازم تكون قابلة للتفسير، لذلك يحسب نظام التصنيف الدرجات بطريقة حتمية وقابلة للتدقيق. النموذج اللغوي قد يستخرج البيانات لكنه لا يحسب الدرجات أبدًا. وأي تغيير يؤثر على الدرجات العامة يحتاج موافقة مديرَين ويترك سجلًا كاملًا بالفروقات.",
    ),
    L(
      "One identity across several apps: sessions are shared across subdomains and separate frontends without weakening cookie security.",
      "هوية واحدة عبر عدة تطبيقات: الجلسات مشتركة بين النطاقات الفرعية وواجهات منفصلة دون إضعاف أمان ملفات تعريف الارتباط.",
    ),
    L(
      "RootX Academy serves more than 80 students and instructors and streamed more than 300 GB in the last 3 months, in Arabic (right to left) and English.",
      "أكاديمية RootX يستخدمها أكثر من 80 طالبًا ومحاضرًا، وبثّت أكثر من 300 جيجابايت خلال آخر 3 أشهر، بالعربية (من اليمين لليسار) والإنجليزية.",
    ),
    L(
      "The Pentest Portal is private: only the client or a super admin sets a finding's status. It is backed by 679 tests, including an authorization matrix that calls every endpoint as each role, and by deliberately breaking 21 rules to prove the tests catch them.",
      "بوابة الاختبار الأمني خاصة: العميل أو المدير العام فقط هو من يحدد حالة أي ثغرة. وتدعمها 679 اختبارًا، منها مصفوفة صلاحيات تستدعي كل نقطة نهاية بكل دور، وكسرتُ 21 قاعدة عمدًا لأتأكد أن الاختبارات تكتشف كل واحدة.",
    ),
  ],
  stack: ["React", "Vite", "Node.js", "Express", "MySQL", "Redis", "Vercel", "Railway", "Cloudflare Turnstile", "Google and Discord OAuth", "JWT sessions"],
  links: [
    { label: L("RootX website", "موقع RootX"), url: "https://rootx.solutions/", verified: true },
    { label: L("RootX Academy", "أكاديمية RootX"), url: "https://academy.rootx.solutions/", verified: true },
    { label: L("Ranking System", "نظام التصنيف"), url: "https://trust.rootx.solutions/", verified: true },
    // C9: the supplied URL looked like a typo; do not render until confirmed.
    { label: L("Pentest Portal", "بوابة الاختبار الأمني"), url: "https://portal.rootx.solutions/", verified: false },
  ],
  metrics: [
    { label: L("Academy students and instructors", "طلاب ومحاضرو الأكاديمية"), value: "80+", source: "marwan" },
    { label: L("Academy streaming, last 3 months", "بث الأكاديمية، آخر 3 أشهر"), value: "300+ GB", source: "marwan" },
    { label: L("Portal tests", "اختبارات البوابة"), value: "679", source: "plan" },
  ],
  // C14: currency not confirmed, so this stays hidden.
  cost: { label: L("Academy monthly cost", "التكلفة الشهرية للأكاديمية"), value: L("About 30 per month", "نحو 30 شهريًا"), confirmed: false },
  disclaimers: [],
  views: [
    {
      id: "ranking-pipeline",
      title: L("Ranking System pipeline", "مسار نظام التصنيف"),
      credit: "me",
      illustrative: false,
      nodes: [
        { id: "intake", label: L("Data intake", "استقبال البيانات") },
        { id: "extract", label: L("Language-model extraction (structured data only)", "الاستخراج بالنموذج اللغوي (بيانات منظمة فقط)"), detail: L("A language model turns messy submissions into structured fields. It is not allowed to score anything.", "نموذج لغوي يحوّل المدخلات غير المنظمة إلى حقول منظمة. ولا يُسمح له بحساب أي درجة.") },
        { id: "score", label: L("Deterministic scoring engine", "محرك التقييم الحتمي"), detail: L("Fixed, versioned formulas compute the score from the structured fields, so the same input always gives the same ranking and every number can be traced.", "معادلات ثابتة ذات إصدارات تحسب الدرجة من الحقول المنظمة، فيعطي المُدخل نفسه الترتيب نفسه ويمكن تتبّع كل رقم.") },
        { id: "approve", label: L("Two-admin approval", "موافقة مديرَين"), detail: L("Changes that affect public scores need a second admin. Nobody can approve their own change, and every change keeps a diff and an audit entry.", "التغييرات التي تؤثر على الدرجات العامة تحتاج مديرًا ثانيًا. لا أحد يوافق على تغييره بنفسه، وكل تغيير يترك سجلًا بالفروقات وإدخالًا في التدقيق.") },
        { id: "publish", label: L("Public ranking", "التصنيف العام") },
      ],
      edges: [
        { from: "intake", to: "extract" },
        { from: "extract", to: "score" },
        { from: "score", to: "approve" },
        { from: "approve", to: "publish" },
      ],
      flows: [{ id: "ranking-flow", label: L("From submission to public ranking", "من الإدخال إلى التصنيف العام"), path: ["intake", "extract", "score", "approve", "publish"] }],
      callouts: [
        { nodeId: "extract", text: L("The model never scores. Extraction and scoring are separated by design.", "النموذج لا يحسب الدرجات أبدًا. الاستخراج والتقييم منفصلان بالتصميم.") },
        { nodeId: "approve", text: L("Self-approval is blocked and every change leaves a diff and audit trail.", "الموافقة الذاتية ممنوعة وكل تغيير يترك سجلًا بالفروقات والتدقيق.") },
      ],
    },
    {
      id: "portal-flow",
      title: L("Pentest Portal roles and report flow", "أدوار بوابة الاختبار الأمني ومسار التقرير"),
      credit: "me",
      illustrative: false,
      nodes: [
        { id: "tester", label: L("Tester files a report (can only propose a status)", "المختبِر يرفع تقريرًا (يقترح الحالة فقط)") },
        { id: "decide", label: L("Client or super admin sets the status", "العميل أو المدير العام يحدد الحالة"), detail: L("Testers can propose a status, but only the client or a super admin sets it. That keeps the final call with the people who own the risk.", "يستطيع المختبِرون اقتراح حالة، لكن العميل أو المدير العام فقط هو من يحددها. فيبقى القرار النهائي لمن يتحمّل المخاطر.") },
        { id: "retest", label: L("Retest", "إعادة الاختبار") },
        { id: "closed", label: L("Closed (read-only)", "مغلق (للقراءة فقط)") },
        { id: "upload", label: L("Evidence uploaded straight to storage by signed link", "رفع الأدلة مباشرة إلى التخزين برابط موقّع"), detail: L("Evidence goes straight from the browser to storage through a signed link, so large videos never pass through the API server.", "تذهب الأدلة مباشرة من المتصفح إلى التخزين عبر رابط موقّع، فلا تمر الفيديوهات الكبيرة عبر خادم الواجهة البرمجية.") },
        { id: "playback", label: L("Playback by short-lived signed link", "التشغيل برابط موقّع قصير العمر") },
      ],
      edges: [
        { from: "tester", to: "decide" },
        { from: "decide", to: "retest" },
        { from: "retest", to: "closed" },
        { from: "tester", to: "upload" },
        { from: "upload", to: "playback" },
      ],
      flows: [{ id: "report-flow", label: L("A finding from report to closure", "مسار ثغرة من التقرير إلى الإغلاق"), path: ["tester", "decide", "retest", "closed"] }],
      callouts: [{ nodeId: "decide", text: L("679 tests, including an authorization matrix on every endpoint.", "679 اختبارًا، منها مصفوفة صلاحيات على كل نقطة نهاية.") }],
    },
  ],
  tags: ["security", "backend", "authentication", "node", "react", "architecture", "technical-lead", "scoring", "rbac", "testing", "arabic-rtl"],
  agentNotes:
    "Concept level only. Never discuss cookie names, rate-limit numbers, lockout thresholds, token lifetimes, IP handling, internal configuration, any weakness, client names, engagement details, or real findings. Do not claim any accreditation. Do not claim payment-gateway features for the Academy (unresolved C3).",
};
