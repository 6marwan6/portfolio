import { L, type Site } from "./types";

export const site: Site = {
  owner: {
    name: L("Marwan El Nabawy", "مروان النبوي"),
    headline: L("Full Stack Engineer · AI Systems · Web Security", "مهندس Full Stack · أنظمة الذكاء الاصطناعي · أمن الويب"),
    positioning: L(
      "Backend-focused full-stack engineer who builds secure production systems and directs AI deliberately inside an architecture instead of being led by it.",
      "مهندس Full Stack يركّز على الـ Backend، يبني أنظمة إنتاجية آمنة، ويوجّه الذكاء الاصطناعي بوعي داخل المعمارية بدل أن يقوده هو.",
    ),
    location: L("Cairo, Egypt", "القاهرة، مصر"),
    languages: L("Arabic (native), English (fluent)", "العربية (لغة أم)، الإنجليزية (بطلاقة)"),
    education: L(
      "B.Sc. Computer Engineering, Ain Shams University. Graduated 2026, ranked 2nd of 187, CGPA 3.78/4.0.",
      "بكالوريوس هندسة الحاسبات، جامعة عين شمس. تخرّج 2026، الثاني على دفعته من 187 طالبًا، معدل تراكمي 3.78 من 4.0.",
    ),
    training: L(
      "National Telecommunication Institute (NTI), computer vision track, 97%.",
      "المعهد القومي للاتصالات (NTI)، مسار الرؤية الحاسوبية، بنسبة 97%.",
    ),
  },
  contact: {
    email: "marwanstar2003@hotmail.com",
    github: "https://github.com/6marwan6",
    linkedin: "https://www.linkedin.com/in/marwan-el-nabawy-42b477289/",
  },
  skills: [
    { group: "Full Stack & Backend", name: "Python", years: 3 },
    { group: "Full Stack & Backend", name: "JavaScript", years: 2 },
    { group: "Full Stack & Backend", name: "React", years: 2 },
    { group: "Full Stack & Backend", name: "Node.js", years: 2 },
    { group: "Full Stack & Backend", name: "Express.js" },
    { group: "Full Stack & Backend", name: "TypeScript" },
    { group: "Full Stack & Backend", name: "Vite" },
    { group: "Full Stack & Backend", name: "C++" },
    { group: "Full Stack & Backend", name: "REST APIs" },
    { group: "Full Stack & Backend", name: "BullMQ" },
    { group: "Full Stack & Backend", name: "Redis" },
    { group: "Full Stack & Backend", name: "Linux", level: L("Very strong", "مستوى قوي جدًا") },
    { group: "Security", name: "Authentication and authorization" },
    { group: "Security", name: "RBAC" },
    { group: "Security", name: "JWT (RS256)" },
    { group: "Security", name: "OAuth (Google, Discord)" },
    { group: "Security", name: "CSRF and session hardening" },
    { group: "Security", name: "Cloudflare Turnstile" },
    { group: "Security", name: "Secure API design" },
    { group: "Security", name: "Access control testing" },
    { group: "Security", name: "Recon automation" },
    { group: "Security", name: "Burp Suite" },
    { group: "Databases & Cloud", name: "Databases (MySQL, MongoDB, SQL)", years: 3 },
    { group: "Databases & Cloud", name: "Supabase" },
    { group: "Databases & Cloud", name: "Cloudflare R2" },
    { group: "Databases & Cloud", name: "Cloudinary" },
    { group: "Databases & Cloud", name: "Vercel" },
    { group: "Databases & Cloud", name: "Railway" },
    { group: "AI / ML", name: "Computer vision (NTI)" },
    { group: "AI / ML", name: "PyTorch" },
    { group: "AI / ML", name: "TensorFlow" },
    { group: "AI / ML", name: "OpenCV" },
    { group: "AI / ML", name: "Prompt engineering" },
    { group: "AI / ML", name: "RAG and LangChain (Kaggle projects)" },
    { group: "AI / ML", name: "NLP and model fine-tuning (text classification)" },
  ],
  achievements: [
    {
      id: "asu",
      source: "marwan",
      text: L(
        "Ranked 2nd of 187 in Computer Engineering at Ain Shams University, CGPA 3.78/4.0, graduated 2026.",
        "الثاني على دفعته من 187 طالبًا في هندسة الحاسبات بجامعة عين شمس، معدل تراكمي 3.78 من 4.0، تخرّج 2026.",
      ),
    },
    {
      id: "nti",
      source: "marwan",
      text: L(
        "Scored 97% in the National Telecommunication Institute's computer vision track.",
        "حصل على 97% في مسار الرؤية الحاسوبية بالمعهد القومي للاتصالات.",
      ),
    },
    {
      id: "rootx-lead",
      source: "cv",
      text: L(
        "Technical Lead at RootX Security: architecture for four products, and preparing to lead an incoming team of two to three engineers.",
        "قائد تقني في RootX Security: معمارية أربعة منتجات، والاستعداد لقيادة فريق قادم من مهندسين أو ثلاثة.",
      ),
    },
    {
      id: "academy",
      source: "marwan",
      text: L(
        "RootX Academy serves more than 80 students and instructors and streamed more than 300 GB in the last 3 months.",
        "أكاديمية RootX يستخدمها أكثر من 80 طالبًا ومحاضرًا، وبثّت أكثر من 300 جيجابايت خلال آخر 3 أشهر.",
      ),
    },
  ],
  disclaimers: [],
};
