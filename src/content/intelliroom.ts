import { L, type Project } from "./types";

export const intelliroom: Project = {
  id: "intelliroom",
  order: 3,
  status: "shipped",
  confidentiality: "public",
  title: L("IntelliRoom", "IntelliRoom"),
  role: L(
    "Planner environment, backend, frontend and storage, plus the fair GPU job queue (team of 7)",
    "بيئة المخطِّط، والـ Backend والـ Frontend والتخزين، إضافةً إلى طابور مهام الـ GPU العادل (فريق من 7)",
  ),
  teamSize: 7,
  teammates: [
    { name: "Youssef Ossama Sayed", linkedin: "https://www.linkedin.com/in/youssef-ossama-32272823a/" },
    { name: "Badr Sayed AbdelAziz", linkedin: "https://www.linkedin.com/in/badr-sayed-b11425218/" },
    { name: "Ahmed Karam Abdel Hamid", linkedin: "https://www.linkedin.com/in/ahmed-karam-68a8a3189/" },
    { name: "Mohamed Hani Mohamed", linkedin: "https://www.linkedin.com/in/mohamedhanihamdi/" },
    { name: "Alharith Mujeeb Hasan", linkedin: "https://www.linkedin.com/in/alharith-mujeeb-b44515231/" },
    { name: "Mohamed Sameh Abdelrahman", linkedin: "https://www.linkedin.com/in/mohamed-sameh77" },
  ],
  contribution: {
    mine: [
      L("The planner environment: 2D editor, orbit 3D view, first-person view, snapping, wall visibility.", "بيئة المخطِّط: المحرر ثنائي الأبعاد، والعرض ثلاثي الأبعاد، والمشي بمنظور الشخص الأول، والالتصاق، وإظهار الجدران."),
      L("Doors and windows, floor and wall textures, 2D object view and thumbnails, project saving.", "الأبواب والنوافذ، وخامات الأرضيات والجدران، وعرض الأشياء ثنائي الأبعاد والصور المصغّرة، وحفظ المشاريع."),
      L("The UI, security and authentication.", "الواجهة، والأمان والمصادقة."),
      L("Storage and delivery with Cloudflare R2, Cloudinary and Supabase.", "التخزين والتوصيل عبر Cloudflare R2 وCloudinary وSupabase."),
      L("The fair GPU job queue on Redis and BullMQ.", "طابور مهام الـ GPU العادل على Redis وBullMQ."),
    ],
    team: [L("The AI itself.", "الذكاء الاصطناعي نفسه."), L("The rest of the website.", "بقية الموقع.")],
  },
  oneLiner: L(
    "A web 2D/3D room planner with AI rendering. In a team of 7, I built the planner environment end to end, backend, frontend and storage, on top of the open-source react-planner.",
    "مخطِّط غرف ثنائي وثلاثي الأبعاد على الويب مع تصيير بالذكاء الاصطناعي. ضمن فريق من 7، بنيتُ بيئة المخطِّط من البداية للنهاية: الـ Backend والـ Frontend والتخزين، فوق المشروع مفتوح المصدر react-planner.",
  ),
  story: [
    L(
      "react-planner gave us a basic component for drawing buildings from a catalog. I turned it into a product: a new UI, object storage and upload, first-person view, doors and windows, floor and wall textures, security, project saving, and more.",
      "قدّم لنا react-planner مكوّنًا بسيطًا لرسم المباني من كتالوج. حوّلته إلى منتج: واجهة جديدة، وتخزين ورفع للأشياء، ومنظور الشخص الأول، وأبواب ونوافذ، وخامات للأرضيات والجدران، وأمان، وحفظ للمشاريع، وغير ذلك.",
    ),
    L(
      "Switching from 2D to 3D flashed white. The cause was shared renderer state plus an environment-texture cache that was never checked against the GL context. The fix was to reset renderer state on every unmount.",
      "الانتقال من ثنائي إلى ثلاثي الأبعاد كان يُظهر وميضًا أبيض. السبب حالة المُصيِّر المشتركة مع ذاكرة مؤقتة لخامة البيئة لا يُتحقق من ارتباطها بسياق GL. الحل كان إعادة ضبط حالة المُصيِّر عند كل إزالة للمكوّن.",
    ),
    L(
      "Placing items had to feel instant, so expensive overlap work moved off the mouse-move path, and wall snapping projects items back onto the wall's line so they slide flush.",
      "وضع العناصر لازم يكون لحظيًا، فنقلتُ حسابات التداخل الثقيلة بعيدًا عن مسار حركة الماوس، والتصاق الجدران يُسقط العنصر على خط الجدار فينزلق ملاصقًا له.",
    ),
    L(
      "Many users share one ComfyUI GPU, so I built a fair job queue on Redis and BullMQ that keeps generation jobs from competing for it.",
      "مستخدمون كثر يتشاركون GPU واحدًا لـ ComfyUI، لذلك بنيتُ طابور مهام عادلًا على Redis وBullMQ يمنع مهام التوليد من التنافس عليه.",
    ),
    L(
      "Storage grew past 3,500 3D models, so models moved from Supabase to Cloudflare R2, while Cloudinary serves render images, thumbnails and texture maps.",
      "تجاوز التخزين 3,500 نموذج ثلاثي الأبعاد، فانتقلت النماذج من Supabase إلى Cloudflare R2، بينما تخدم Cloudinary صور التصيير والصور المصغّرة وخرائط الخامات.",
    ),
  ],
  stack: ["React", "Redux", "Three.js", "Node.js", "Redis", "BullMQ", "Cloudflare R2", "Cloudinary", "Supabase", "RS256 JWT"],
  links: [
    { label: L("IntelliRoom", "IntelliRoom"), url: "https://intelliroom.net/", verified: true },
    { label: L("Open the live planner", "افتح المخطِّط المباشر"), url: "https://intelliroom.net/planner", verified: true },
  ],
  metrics: [
    { label: L("3D models hosted", "نماذج ثلاثية الأبعاد مستضافة"), value: "3,500+", source: "marwan" },
    { label: L("Texture and thumbnail assets", "أصول الخامات والصور المصغّرة"), value: "7,000+", source: "cv" },
  ],
  credits: [
    // Verify the repository URL and its license text before launch.
    { name: "react-planner", url: "https://github.com/cvdlab/react-planner", license: "verify", verified: false },
  ],
  disclaimers: [
    L("Built on the open-source react-planner.", "مبني فوق المشروع مفتوح المصدر react-planner."),
    L("A team project of 7 people.", "مشروع فريق من 7 أشخاص."),
  ],
  views: [
    {
      id: "planner-engine",
      title: L("Planner engine", "محرك المخطِّط"),
      credit: "me",
      illustrative: false,
      nodes: [
        { id: "editor2d", label: L("2D editor", "المحرر ثنائي الأبعاد") },
        { id: "orbit3d", label: L("Orbit 3D view", "العرض ثلاثي الأبعاد") },
        { id: "fps", label: L("First-person view", "منظور الشخص الأول") },
        { id: "renderer", label: L("Shared WebGL renderer", "المُصيِّر المشترك WebGL") },
        { id: "snap", label: L("Snap system", "نظام الالتصاق") },
        { id: "walls", label: L("Wall visibility manager", "مدير إظهار الجدران") },
        { id: "save", label: L("Project saving", "حفظ المشاريع") },
      ],
      edges: [
        { from: "editor2d", to: "renderer" },
        { from: "orbit3d", to: "renderer" },
        { from: "fps", to: "renderer" },
        { from: "snap", to: "editor2d" },
        { from: "snap", to: "orbit3d" },
        { from: "walls", to: "orbit3d" },
        { from: "editor2d", to: "save" },
      ],
      callouts: [{ nodeId: "renderer", text: L("The white-flash bug lived here: shared state that was never reset between viewers.", "وميض الشاشة البيضاء كان هنا: حالة مشتركة لا يُعاد ضبطها بين العارضات.") }],
    },
    {
      id: "storage",
      title: L("Storage and delivery", "التخزين والتوصيل"),
      credit: "me",
      illustrative: false,
      nodes: [
        { id: "planner", label: L("Planner", "المخطِّط") },
        { id: "supabase", label: L("Supabase (initial model storage)", "Supabase (التخزين الأولي للنماذج)") },
        { id: "r2", label: L("Cloudflare R2 (3,500+ models)", "Cloudflare R2 (أكثر من 3,500 نموذج)") },
        { id: "cloudinary", label: L("Cloudinary (renders, thumbnails, texture maps)", "Cloudinary (صور التصيير والمصغّرات وخرائط الخامات)") },
      ],
      edges: [
        { from: "supabase", to: "r2", label: L("models moved", "انتقال النماذج") },
        { from: "planner", to: "r2" },
        { from: "planner", to: "cloudinary" },
      ],
    },
    {
      id: "ai-render",
      title: L("AI render pipeline", "مسار التصيير بالذكاء الاصطناعي"),
      credit: "shared",
      illustrative: false,
      nodes: [
        { id: "capture", label: L("Scene capture", "التقاط المشهد"), credit: "me" },
        { id: "api", label: L("API", "واجهة البرمجة"), credit: "me" },
        { id: "queue", label: L("Fair queue (Redis and BullMQ)", "الطابور العادل (Redis وBullMQ)"), credit: "me", detail: L("Jobs wait in a fair Redis and BullMQ queue so many users can share one GPU without competing for it.", "تنتظر المهام في طابور عادل على Redis وBullMQ ليتشارك مستخدمون كثر GPU واحدًا دون تنافس عليه.") },
        { id: "gpu", label: L("Shared ComfyUI GPU running the generation", "GPU مشترك لـ ComfyUI ينفّذ التوليد"), credit: "team", detail: L("The shared ComfyUI GPU runs the generation. This step is the teammates' work.", "يشغّل GPU المشترك لـ ComfyUI عملية التوليد. هذه الخطوة من عمل زملاء الفريق.") },
        { id: "store", label: L("Result stored in Cloudinary", "حفظ النتيجة في Cloudinary"), credit: "me" },
        { id: "sync", label: L("Synced live into the scene", "مزامنة مباشرة داخل المشهد"), credit: "me" },
      ],
      edges: [
        { from: "capture", to: "api" },
        { from: "api", to: "queue" },
        { from: "queue", to: "gpu" },
        { from: "gpu", to: "store" },
        { from: "store", to: "sync" },
      ],
      flows: [{ id: "render-flow", label: L("One render job", "مهمة تصيير واحدة"), path: ["capture", "api", "queue", "gpu", "store", "sync"] }],
    },
  ],
  tags: ["planner", "react", "threejs", "backend", "frontend", "storage", "job-queue", "redis", "bullmq", "authentication", "rbac", "cloud-storage"],
  agentNotes:
    "Team project of 7. Marwan built the planner environment, UI, security and auth, storage, and the fair GPU job queue. Teammates built the AI itself and the rest of the website. Never claim Marwan built the AI generation, the computer-vision inference pipeline, or the embedding model (unresolved C1). Never claim a low-power mode shipped. Built on react-planner (open source).",
};
