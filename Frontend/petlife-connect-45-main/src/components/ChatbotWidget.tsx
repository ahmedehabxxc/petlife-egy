import * as React from "react";
import { MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getChatbotResult } from "@/lib/chatbot";
import { PET_KNOWLEDGE } from "@/lib/petKnowledge";
import { findNearestClinic } from "@/lib/clinics";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "bot";
type Intent = "health" | "food" | "behavior" | "grooming" | "vaccines" | "training" | "adoption" | "exercise";
type ChatMessage = { id: string; role: ChatRole; text: string; createdAt: number };
type ChatLanguage = "en" | "ar";
type LocationRequestResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: "unsupported" | "denied" | "timeout" | "unavailable" | "unknown" };

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function extractAgeYears(raw: string): number | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (/^\d+(\.\d+)?$/.test(t)) return Number.parseFloat(t);
  const m = t.match(/(?:age\s*(?:is|=|:)\s*)?(\d+(\.\d+)?)/);
  if (!m) return null;
  const val = Number.parseFloat(m[1]!);
  if (!Number.isFinite(val) || val <= 0 || val > 60) return null;
  return val;
}
function extractSpecies(raw: string): "dog" | "cat" | null {
  const t = raw.toLowerCase();
  if (/\b(dog|puppy|canine)\b/.test(t) || /(كلب|كلبي|جراء|جرو)/.test(raw)) return "dog";
  if (/\b(cat|kitten|feline)\b/.test(t) || /(قط|قطة|قطتي|هر|هرة|بسة|بسه)/.test(raw)) return "cat";

  const compact = t.replace(/[^\p{L}\p{N}\s]/gu, " ");
  for (const breed of PET_KNOWLEDGE.breeds) {
    if (compact.includes(breed.name.toLowerCase())) return breed.pet_type;
  }

  return null;
}
function extractIntent(raw: string): Intent | null {
  const t = raw.toLowerCase();
  if (/\bhealth\b|\bill(ness)?\b|\bdisease(s)?\b|\bsick\b/.test(t) || /(صحة|مريض|مرض|تعبان|اعراض|أعراض|قيء|ترجيع|اسهال|إسهال)/.test(raw)) return "health";
  if (/\bfood(s)?\b|\bfeed(ing)?\b|\bdiet\b|\bweight\b/.test(t) || /(اكل|أكل|طعام|غذا|غذاء|دايت|حمية|وزن|لا ياكل|ما ياكل|مش بياكل)/.test(raw)) return "food";
  if (/\bbehavior\b|\bbehaviour\b|\btrain(ing)?\b|\bbark(ing)?\b|\bscratch(ing)?\b/.test(t) || /(سلوك|نباح|خدش|عدوان|عصبي|توتر)/.test(raw)) return "behavior";
  if (/\bgroom(ing)?\b|\bbath\b|\bbrush\b|\bnail(s)?\b|\bdental\b|\bteeth\b/.test(t) || /(نظافة|استحمام|حمام|فرشة|فرش|اسنان|أسنان|اظافر|أظافر)/.test(raw)) return "grooming";
  if (/\bvaccin(e|es|ation)\b|\bshots?\b|\brabies\b/.test(t) || /(تطعيم|لقاح|لقاحات|سعار)/.test(raw)) return "vaccines";
  if (/\btraining\b|\btrain\b/.test(t) || /(تدريب|يدرّب|يدرب|طاعة)/.test(raw)) return "training";
  if (/\badopt(ion)?\b|\bshelter\b|\brescue\b/.test(t) || /(تبني|تبن[ىي]|ملجأ|انقاذ|إنقاذ)/.test(raw)) return "adoption";
  if (/\bexercise\b|\bwalk(s)?\b|\bplay\b|\bactivity\b/.test(t) || /(تمرين|رياضة|مشي|لعب|نشاط)/.test(raw)) return "exercise";
  return null;
}
function asksForNearestClinic(raw: string): boolean {
  const t = raw.toLowerCase();
  return /(nearest|closest|nearby|near me).*(clinic|vet)/.test(t)
    || /(clinic|vet).*(nearest|closest|nearby|near me)/.test(t)
    || /\b(clinic|clinics)\b/.test(t)
    || /(اقرب|أقرب|قريب).*(عيادة|دكتور|بيطري)/.test(raw)
    || /(عيادة|دكتور|بيطري).*(اقرب|أقرب|قريب)/.test(raw)
    || /(عيادة|عيادات)/.test(raw);
}
function asksAboutShop(raw: string): boolean {
  const t = raw.toLowerCase();
  return /\b(shop|store|products?|items?)\b/.test(t)
    || /(what\s+(is|are)\s+in\s+the\s+shop)/.test(t)
    || /(show|open|go to).*(shop|store)/.test(t)
    || /(المتجر|المنتجات|المنتج|المحل|الشوب|فيه ايه في المتجر|ايه في المتجر|موجود في المتجر)/.test(raw);
}
function asksAboutPetMatching(raw: string): boolean {
  const t = raw.toLowerCase();
  return /(pet\s*matching|matching|match\s*pet|adopt|adoption|find\s*pet)/.test(t)
    || /(التبني|تبني|مطابقة|matching|pet matching|تبنّي)/.test(raw);
}
function asksAboutVetServices(raw: string): boolean {
  const t = raw.toLowerCase();
  return /(vet|vets|veterinarian|veterinary|vet\s*services|doctor)/.test(t)
    || /(بيطري|بيطرى|دكتور بيطري|دكتور|خدمات بيطرية|عيادة بيطرية)/.test(raw);
}
function asksAboutLogin(raw: string): boolean {
  const t = raw.toLowerCase();
  return /(login|log in|sign in|access my account)/.test(t)
    || /(تسجيل الدخول|دخول|سجل دخول|سجّل دخول|ادخل حسابي|أدخل حسابي)/.test(raw);
}
function asksAboutSignup(raw: string): boolean {
  const t = raw.toLowerCase();
  return /(signup|sign up|register|create account|new account)/.test(t)
    || /(انشاء حساب|إنشاء حساب|تسجيل حساب|اعمل حساب|اعمل اكونت|سجل جديد|سجّل جديد)/.test(raw);
}
function agreesToShareLocation(raw: string): boolean {
  const t = raw.toLowerCase().trim();
  return ["yes", "y", "ok", "okay", "sure", "go ahead", "share", "use my location", "my location", "نعم", "ايوه", "أيوه", "اه", "تمام", "موافق"].includes(t);
}
function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}
function detectLanguageFromInput(raw: string): ChatLanguage {
  const trimmed = raw.trim();
  if (!trimmed) return "en";
  return hasArabic(trimmed) ? "ar" : "en";
}
function isAgeOnlyMessage(raw: string, detectedAge: number | null): boolean {
  if (detectedAge === null) return false;
  const compact = raw.toLowerCase().trim();
  if (!compact) return false;
  if (compact === String(detectedAge)) return true;
  return /^(age\s*(is|=|:)?\s*)?\d+(\.\d+)?(\s*(years?|yrs?))?$/i.test(compact);
}
function getCurrentPositionWithOptions(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}
async function requestUserLocation(): Promise<LocationRequestResult> {
  if (!navigator.geolocation) return { ok: false, reason: "unsupported" };

  try {
    if ("permissions" in navigator && navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state === "denied") return { ok: false, reason: "denied" };
    }
  } catch {
    // Ignore permissions API issues and try direct geolocation request.
  }

  try {
    const firstTry = await getCurrentPositionWithOptions({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
    return { ok: true, lat: firstTry.coords.latitude, lng: firstTry.coords.longitude };
  } catch (error) {
    const geoError = error as GeolocationPositionError;

    // Retry once with relaxed options in case GPS/high accuracy times out.
    if (geoError?.code === 3 || geoError?.code === 2) {
      try {
        const secondTry = await getCurrentPositionWithOptions({
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 60000,
        });
        return { ok: true, lat: secondTry.coords.latitude, lng: secondTry.coords.longitude };
      } catch (retryError) {
        const retryGeoError = retryError as GeolocationPositionError;
        if (retryGeoError?.code === 1) return { ok: false, reason: "denied" };
        if (retryGeoError?.code === 3) return { ok: false, reason: "timeout" };
        if (retryGeoError?.code === 2) return { ok: false, reason: "unavailable" };
        return { ok: false, reason: "unknown" };
      }
    }

    if (geoError?.code === 1) return { ok: false, reason: "denied" };
    if (geoError?.code === 3) return { ok: false, reason: "timeout" };
    if (geoError?.code === 2) return { ok: false, reason: "unavailable" };
    return { ok: false, reason: "unknown" };
  }
}
function toArabicReply(englishText: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/^Got you\./gm, "تمام."],
    [/^Okay, let's sort it out\./gm, "حسنًا، دعنا نحلها معًا."],
    [/^Thanks for sharing that\./gm, "شكرًا لمشاركتك هذا."],
    [/^I hear you\./gm, "أنا فاهمك."],
    [/Why:/g, "السبب:"],
    [/What to do now:/g, "ماذا تفعل الآن:"],
    [/Warning:/g, "تحذير:"],
    [/Do you want help with health, food, behavior, or training\?/g, "هل تريد مساعدة في الصحة أو الأكل أو السلوك أو التدريب؟"],
    [/Could you rephrase your question in one short sentence\?/g, "ممكن تعيد صياغة سؤالك في جملة قصيرة؟"],
    [/Which issue matches your case most\?/g, "ما المشكلة الأقرب لحالة حيوانك؟"],
    [/What exact symptoms are present now\?/g, "ما الأعراض الموجودة الآن بالضبط؟"],
    [/What exact symptoms are you seeing now, and for how long\?/g, "ما الأعراض التي تراها الآن ومنذ متى؟"],
    [/I want to make sure I understand you correctly\./g, "أريد التأكد أني فهمتك بشكل صحيح."],
    [/I can help with dog and cat health, food, behavior, and training\./g, "أستطيع مساعدتك في صحة وأكل وسلوك وتدريب القطط والكلاب."],
    [/- Tell me pet type \(dog\/cat\)\./g, "- أخبرني نوع الحيوان (قط/كلب)."],
    [/- Share age and key symptom or concern\./g, "- اذكر العمر وأهم عرض أو مشكلة."],
    [/- Add how long this has been happening\./g, "- اذكر منذ متى بدأت المشكلة."],
    [/Great, we're talking about a dog\./g, "ممتاز، نتحدث عن كلب."],
    [/Great, we're talking about a cat\./g, "ممتاز، نتحدث عن قط."],
    [/Typical lifespan is/g, "متوسط العمر المتوقع هو"],
    [/Watch for common issues:/g, "راقب المشاكل الشائعة:"],
    [/Keep feeding and daily routine consistent\./g, "حافظ على ثبات الأكل والروتين اليومي."],
    [/Tell me the exact concern so I can give focused advice\./g, "اذكر المشكلة بدقة لكي أعطيك نصيحة أدق."],
    [/Do you want a comparison with another breed\?/g, "هل تريد مقارنة مع سلالة أخرى؟"],
    [/Temperament:/g, "الطبع:"],
    [/Energy:/g, "النشاط:"],
    [/Lifespan:/g, "العمر المتوقع:"],
    [/Size expectation:/g, "الحجم المتوقع:"],
    [/Usually good for:/g, "عادة مناسب لـ:"],
    [/Grooming level:/g, "مستوى العناية:"],
    [/This can become serious quickly\. Contact a vet promptly\./g, "قد تصبح الحالة خطيرة بسرعة. تواصل مع طبيب بيطري فورًا."],
    [/If symptoms worsen or last more than 24-48 hours, see a vet\./g, "إذا ساءت الأعراض أو استمرت أكثر من 24-48 ساعة راجع الطبيب البيطري."],
    [/Common signs include:/g, "الأعراض الشائعة تشمل:"],
    [/Typical treatment path:/g, "مسار العلاج المعتاد:"],
    [/Keep your pet hydrated and avoid changing food suddenly\./g, "حافظ على ترطيب الحيوان وتجنب تغيير الأكل بشكل مفاجئ."],
    [/Track symptom timing and severity for your vet\./g, "سجل توقيت الأعراض وشدتها للطبيب."],
    [/I can help with dog health questions\./g, "أستطيع مساعدتك في أسئلة صحة الكلاب."],
    [/I can help with cat health questions\./g, "أستطيع مساعدتك في أسئلة صحة القطط."],
    [/Based on your pet type, common issues include:/g, "بناءً على نوع الحيوان، المشاكل الشائعة تشمل:"],
    [/Pick one issue name and I will break down symptoms and next steps\./g, "اختر مشكلة واحدة وسأشرح الأعراض والخطوات التالية."],
    [/Share your pet age and when symptoms started\./g, "اذكر عمر الحيوان ومتى بدأت الأعراض."],
    [/Mention appetite, water intake, and activity changes\./g, "اذكر الشهية وشرب الماء وتغيّر النشاط."],
    [/If there is breathing trouble, repeated vomiting, blood, collapse, or severe pain, seek urgent vet care now\./g, "إذا وُجدت صعوبة تنفس أو قيء متكرر أو دم أو انهيار أو ألم شديد، اطلب رعاية بيطرية عاجلة الآن."],
    [/Here is a quick dog food guide\./g, "إليك دليلًا سريعًا لأكل الكلاب."],
    [/Here is a quick cat food guide\./g, "إليك دليلًا سريعًا لأكل القطط."],
    [/Safe foods:/g, "الأطعمة الآمنة:"],
    [/Avoid:/g, "تجنب:"],
    [/Typical feeding frequency:/g, "معدل التغذية المعتاد:"],
    [/Introduce new food gradually over 7-10 days\./g, "أدخل الطعام الجديد تدريجيًا خلال 7-10 أيام."],
    [/Keep fresh water available all day\./g, "وفّر ماءً نظيفًا طوال اليوم."],
    [/If your pet ate a toxic food \(like chocolate, onion, grapes\), contact a vet immediately\./g, "إذا أكل حيوانك طعامًا سامًا (مثل الشوكولاتة أو البصل أو العنب) تواصل مع طبيب بيطري فورًا."],
    [/What exact food are you planning to give\?/g, "ما الطعام الذي تخطط لتقديمه بالضبط؟"],
    [/We can tune food for your goal\./g, "يمكننا ضبط الأكل حسب هدفك."],
    [/Weight changes should be gradual to stay safe\./g, "تغيير الوزن يجب أن يكون تدريجيًا للحفاظ على السلامة."],
    [/Measure meals, do not free-feed all day\./g, "قِس الوجبات ولا تترك الأكل طوال اليوم."],
    [/Adjust portions by about 10% and monitor for 2 weeks\./g, "عدّل الكمية بحوالي 10% وراقب لمدة أسبوعين."],
    [/Use activity \+ diet together for better results\./g, "اجمع بين النشاط والنظام الغذائي لنتائج أفضل."],
    [/Rapid weight loss, poor appetite, or vomiting needs a vet check\./g, "الفقدان السريع للوزن أو ضعف الشهية أو القيء يحتاج فحصًا بيطريًا."],
    [/Is your goal weight loss, weight gain, or maintenance\?/g, "هل هدفك خسارة وزن أم زيادة وزن أم الحفاظ على الوزن؟"],
    [/Barking is usually communication, not just a bad habit\./g, "النباح غالبًا وسيلة تواصل وليس مجرد عادة سيئة."],
    [/Most common meanings:/g, "أكثر المعاني شيوعًا:"],
    [/Start with:/g, "ابدأ بـ:"],
    [/Increase daily physical \+ mental activity\./g, "زِد النشاط البدني والذهني يوميًا."],
    [/Reward quiet behavior quickly and consistently\./g, "كافئ الهدوء بسرعة وباستمرار."],
    [/When does the barking happen most - night, visitors, or when alone\?/g, "متى يحدث النباح أكثر: ليلًا، مع الزوار، أم عند البقاء وحده؟"],
    [/Scratching is normal cat behavior\./g, "الخدش سلوك طبيعي عند القطط."],
    [/It can mean:/g, "قد يعني:"],
    [/Main fix:/g, "الحل الرئيسي:"],
    [/Place scratch posts near the furniture they target\./g, "ضع أعمدة خدش قرب الأثاث الذي يخدشه القط."],
    [/Reward post use with treats or play\./g, "كافئ استخدام عمود الخدش بالمكافآت أو اللعب."],
    [/Which furniture is your cat scratching most\?/g, "أي قطعة أثاث يخدشها قطك أكثر؟"],
    [/Training works best with short, consistent sessions\./g, "التدريب ينجح أكثر مع جلسات قصيرة ومنتظمة."],
    [/Pets learn faster with clear cues and immediate rewards\./g, "الحيوانات تتعلم أسرع مع إشارات واضحة ومكافأة فورية."],
    [/Keep sessions 5-10 minutes\./g, "اجعل الجلسة 5-10 دقائق."],
    [/Reward the exact behavior you want right away\./g, "كافئ السلوك المطلوب فورًا."],
    [/Use one command word consistently\./g, "استخدم كلمة أمر واحدة بشكل ثابت."],
    [/What specific training issue are you facing now\?/g, "ما مشكلة التدريب المحددة التي تواجهها الآن؟"],
    [/This may be urgent\./g, "قد تكون هذه حالة طارئة."],
    [/Symptoms like severe bleeding, choking, collapse, seizures, or poison exposure can be life-threatening\./g, "أعراض مثل نزيف شديد أو اختناق أو انهيار أو تشنجات أو التسمم قد تهدد الحياة."],
    [/Call an emergency vet clinic now\./g, "اتصل بعيادة بيطرية للطوارئ الآن."],
    [/Keep your pet warm and calm during transport\./g, "حافظ على دفء وهدوء الحيوان أثناء النقل."],
    [/Do not force food or medicine unless told by a vet\./g, "لا تُجبر الحيوان على الأكل أو الدواء إلا بتوجيه الطبيب."],
    [/Do not wait at home if severe symptoms are present\./g, "لا تنتظر في المنزل إذا كانت الأعراض شديدة."],
    [/Tell me what happened, your pet type, and age while you arrange care\./g, "أخبرني بما حدث ونوع الحيوان وعمره أثناء تجهيز الرعاية."],
    [/I understand, your pet may be unwell\./g, "أنا فاهم، يبدو أن حيوانك قد يكون مريضًا."],
    [/General symptoms can have multiple causes, so we should narrow it down safely\./g, "الأعراض العامة لها أسباب متعددة، لذلك نحتاج تضييق الاحتمالات بشكل آمن."],
    [/Keep water available and monitor appetite\./g, "وفّر الماء وراقب الشهية."],
    [/Track symptoms, timing, stool\/vomit, and activity level\./g, "سجل الأعراض وتوقيتها والبراز/القيء ومستوى النشاط."],
    [/Avoid sudden food changes until stable\./g, "تجنب التغيير المفاجئ للطعام حتى تستقر الحالة."],
    [/Do you meen/g, "هل تقصد"],
  ];
  return replacements.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), englishText);
}
function fallbackArabicReplyByIntent(
  intent: "health" | "food" | "behavior" | "training" | "general",
  hasSpecies: boolean
): string {
  if (intent === "health") {
    return [
      "أنا معك. خلينا نطمن على الحيوان خطوة بخطوة.",
      "",
      "ماذا تفعل الآن:",
      "- اذكر الأعراض الحالية بوضوح.",
      "- اذكر عمر الحيوان ومدة الأعراض.",
      "- إذا في قيء متكرر أو دم أو صعوبة تنفس، توجه لطبيب بيطري فورًا.",
    ].join("\n");
  }
  if (intent === "food") {
    return [
      "تمام. أقدر أساعدك في التغذية بشكل دقيق.",
      "",
      "ماذا تفعل الآن:",
      ...(hasSpecies ? [] : ["- اكتب نوع الحيوان (قط/كلب)."]),
      "- اكتب العمر والوزن التقريبي.",
      "- اكتب الطعام الذي تريد تقديمه وسأقول لك هل هو مناسب أم لا.",
    ].join("\n");
  }
  if (intent === "behavior") {
    return [
      "فاهمك. نقدر نحل المشكلة السلوكية معًا.",
      "",
      "ماذا تفعل الآن:",
      "- اذكر السلوك بالتحديد (نباح/خدش/عدوانية...).",
      "- اذكر متى يحدث السلوك.",
      "- اذكر إذا كان هناك أي تغيير مؤخرًا في البيت أو الروتين.",
    ].join("\n");
  }
  if (intent === "training") {
    return [
      "ممتاز. التدريب يحتاج خطة بسيطة وثابتة.",
      "",
      "ماذا تفعل الآن:",
      "- اجعل الجلسة قصيرة (5-10 دقائق).",
      "- كافئ السلوك الصحيح فورًا.",
      "- كرر نفس الأمر بنفس الكلمة كل مرة.",
    ].join("\n");
  }
  return [
    "أنا هنا لمساعدتك بخصوص القطط والكلاب.",
    "",
    "ماذا تفعل الآن:",
    ...(hasSpecies ? [] : ["- اكتب نوع الحيوان (قط/كلب)."]),
    "- اكتب العمر والمشكلة الأساسية.",
    "- اكتب مدة المشكلة والأعراض الموجودة الآن.",
  ].join("\n");
}
function localizeReplyForLanguage(
  reply: string,
  lang: ChatLanguage,
  intent: "health" | "food" | "behavior" | "training" | "general",
  hasSpecies: boolean
): string {
  if (lang === "en") return reply;
  const arabic = toArabicReply(reply);
  // Hard guard: Arabic mode must return Arabic-only text.
  if (/[A-Za-z]/.test(arabic)) return fallbackArabicReplyByIntent(intent, hasSpecies);
  return arabic;
}
function speciesPromptReply(lang: ChatLanguage, species: "dog" | "cat"): string {
  if (lang === "ar") {
    return species === "dog"
      ? "تمام، فهمت أن الحيوان كلب. ما الذي تحتاج مساعدة فيه الآن: الأكل، السلوك، أم مشكلة صحية؟"
      : "تمام، فهمت أن الحيوان قط. ما الذي تحتاج مساعدة فيه الآن: الأكل، السلوك، أم مشكلة صحية؟";
  }
  return species === "dog"
    ? "Got it, your pet is a dog. What do you need help with now: food, behavior, or a health issue?"
    : "Got it, your pet is a cat. What do you need help with now: food, behavior, or a health issue?";
}

export default function ChatbotWidget() {
  const debugMode = import.meta.env.VITE_CHATBOT_DEBUG === "true";
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [pendingDidYouMean, setPendingDidYouMean] = React.useState<string | null>(null);
  const [awaitingRephrase, setAwaitingRephrase] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<
    null
    | "weight_goal"
    | "ask_clinic_location"
    | "await_manual_location"
    | "ask_go_to_shop"
    | "ask_go_to_matching"
    | "ask_go_to_vets"
    | "ask_go_to_login"
    | "ask_go_to_signup"
  >(null);
  const [petSpecies, setPetSpecies] = React.useState<"dog" | "cat" | null>(null);
  const [, setPetAgeYears] = React.useState<number | null>(null);
  const [language, setLanguage] = React.useState<ChatLanguage>("en");
  const t = React.useCallback((en: string, ar: string) => (language === "ar" ? ar : en), [language]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { id: newId(), role: "bot", text: "Hi! I'm PetLife Assistant. Tell me: cat or dog + age + what you need help with.", createdAt: Date.now() },
  ]);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    return () => window.clearTimeout(t);
  }, [open, messages.length]);

  const send = React.useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: newId(), role: "user", text, createdAt: Date.now() };
    const normalized = text.toLowerCase().trim();
    const currentLanguage = detectLanguageFromInput(text);
    if (currentLanguage !== language) setLanguage(currentLanguage);
    const detectedAge = extractAgeYears(text);
    const detectedSpecies = extractSpecies(text);
    const detectedIntent = extractIntent(text);
    const hasFreshNavigationIntent =
      asksForNearestClinic(text)
      || asksAboutShop(text)
      || asksAboutPetMatching(text)
      || asksAboutVetServices(text)
      || asksAboutLogin(text)
      || asksAboutSignup(text);

    if (pendingAction === "await_manual_location" && !hasFreshNavigationIntent) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: newId(),
          role: "bot",
          text: t(
            "Got it. Opening clinic finder with your typed location.",
            "تمام. سأفتح صفحة العيادات باستخدام الموقع الذي كتبته."
          ),
          createdAt: Date.now(),
        },
      ]);
      setPendingAction(null);
      setInput("");
      navigate(`/clinics?location=${encodeURIComponent(text)}&fromChatbot=1`);
      setOpen(false);
      return;
    }

    if (pendingAction === "ask_go_to_shop" && !hasFreshNavigationIntent) {
      if (agreesToShareLocation(text)) {
        setMessages((prev) => [
          ...prev,
          userMsg,
          {
            id: newId(),
            role: "bot",
            text: t("Great, taking you to the shop now.", "ممتاز، سأحولك إلى المتجر الآن."),
            createdAt: Date.now(),
          },
        ]);
        setPendingAction(null);
        setInput("");
        navigate("/shop");
        setOpen(false);
        return;
      }

      if (["no", "n", "nope", "later", "لا", "مش", "لاحقًا", "لاحقا"].includes(normalized)) {
        setPendingAction(null);
        setMessages((prev) => [
          ...prev,
          userMsg,
          {
            id: newId(),
            role: "bot",
            text: t("No problem. Ask me about the shop anytime and I can open it for you.", "لا مشكلة. في أي وقت اسألني عن المتجر وسأفتحه لك."),
            createdAt: Date.now(),
          },
        ]);
        setInput("");
        return;
      }

      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: newId(),
          role: "bot",
          text: t("Do you want me to open the shop page now? Reply yes or no.", "هل تريد أن أفتح صفحة المتجر الآن؟ اكتب نعم أو لا."),
          createdAt: Date.now(),
        },
      ]);
      setInput("");
      return;
    }

    if (pendingAction === "ask_go_to_matching" && !hasFreshNavigationIntent) {
      if (agreesToShareLocation(text)) {
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Great, taking you to Pet Matching now.", "ممتاز، سأحولك الآن إلى مطابقة الحيوانات."), createdAt: Date.now() }]);
        setPendingAction(null);
        setInput("");
        navigate("/matching");
        setOpen(false);
        return;
      }
      if (["no", "n", "nope", "later", "لا", "مش", "لاحقًا", "لاحقا"].includes(normalized)) {
        setPendingAction(null);
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("No problem. Ask me anytime and I can open Pet Matching for you.", "لا مشكلة. في أي وقت اطلب مني وسأفتح لك صفحة المطابقة."), createdAt: Date.now() }]);
        setInput("");
        return;
      }
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Do you want me to open Pet Matching now? Reply yes or no.", "هل تريد أن أفتح صفحة مطابقة الحيوانات الآن؟ اكتب نعم أو لا."), createdAt: Date.now() }]);
      setInput("");
      return;
    }

    if (pendingAction === "ask_go_to_vets" && !hasFreshNavigationIntent) {
      if (agreesToShareLocation(text)) {
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Great, taking you to Vet Services now.", "ممتاز، سأحولك الآن إلى خدمات الأطباء البيطريين."), createdAt: Date.now() }]);
        setPendingAction(null);
        setInput("");
        navigate("/vets");
        setOpen(false);
        return;
      }
      if (["no", "n", "nope", "later", "لا", "مش", "لاحقًا", "لاحقا"].includes(normalized)) {
        setPendingAction(null);
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("No problem. Ask me anytime and I can open Vet Services for you.", "لا مشكلة. في أي وقت اطلب مني وسأفتح لك صفحة الخدمات البيطرية."), createdAt: Date.now() }]);
        setInput("");
        return;
      }
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Do you want me to open Vet Services now? Reply yes or no.", "هل تريد أن أفتح صفحة الخدمات البيطرية الآن؟ اكتب نعم أو لا."), createdAt: Date.now() }]);
      setInput("");
      return;
    }

    if (pendingAction === "ask_go_to_login" && !hasFreshNavigationIntent) {
      if (agreesToShareLocation(text)) {
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Great, taking you to Login now.", "ممتاز، سأحولك الآن إلى تسجيل الدخول."), createdAt: Date.now() }]);
        setPendingAction(null);
        setInput("");
        navigate("/login");
        setOpen(false);
        return;
      }
      if (["no", "n", "nope", "later", "لا", "مش", "لاحقًا", "لاحقا"].includes(normalized)) {
        setPendingAction(null);
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("No problem. Ask me anytime and I can open Login for you.", "لا مشكلة. في أي وقت اطلب مني وسأفتح لك صفحة تسجيل الدخول."), createdAt: Date.now() }]);
        setInput("");
        return;
      }
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Do you want me to open Login now? Reply yes or no.", "هل تريد أن أفتح صفحة تسجيل الدخول الآن؟ اكتب نعم أو لا."), createdAt: Date.now() }]);
      setInput("");
      return;
    }

    if (pendingAction === "ask_go_to_signup" && !hasFreshNavigationIntent) {
      if (agreesToShareLocation(text)) {
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Great, taking you to Sign Up now.", "ممتاز، سأحولك الآن إلى إنشاء حساب."), createdAt: Date.now() }]);
        setPendingAction(null);
        setInput("");
        navigate("/register");
        setOpen(false);
        return;
      }
      if (["no", "n", "nope", "later", "لا", "مش", "لاحقًا", "لاحقا"].includes(normalized)) {
        setPendingAction(null);
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("No problem. Ask me anytime and I can open Sign Up for you.", "لا مشكلة. في أي وقت اطلب مني وسأفتح لك صفحة إنشاء الحساب."), createdAt: Date.now() }]);
        setInput("");
        return;
      }
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Do you want me to open Sign Up now? Reply yes or no.", "هل تريد أن أفتح صفحة إنشاء الحساب الآن؟ اكتب نعم أو لا."), createdAt: Date.now() }]);
      setInput("");
      return;
    }

    if (asksAboutShop(text)) {
      setPendingAction(null);
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setPendingAction("ask_go_to_shop");
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: newId(),
          role: "bot",
          text: t("I can take you to the shop to browse available products. Do you want to go now?", "أقدر أحولك للمتجر لتصفح المنتجات المتاحة. هل تريد الذهاب الآن؟"),
          createdAt: Date.now(),
        },
      ]);
      setInput("");
      return;
    }
    if (asksAboutPetMatching(text)) {
      setPendingAction(null);
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setPendingAction("ask_go_to_matching");
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("I can take you to Pet Matching. Do you want to go now?", "أقدر أحولك إلى صفحة مطابقة الحيوانات. هل تريد الذهاب الآن؟"), createdAt: Date.now() }]);
      setInput("");
      return;
    }
    if (asksAboutVetServices(text)) {
      setPendingAction(null);
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setPendingAction("ask_go_to_vets");
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("I can take you to Vet Services. Do you want to go now?", "أقدر أحولك إلى صفحة الخدمات البيطرية. هل تريد الذهاب الآن؟"), createdAt: Date.now() }]);
      setInput("");
      return;
    }
    if (asksAboutLogin(text)) {
      setPendingAction(null);
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setPendingAction("ask_go_to_login");
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("I can take you to Login. Do you want to go now?", "أقدر أحولك إلى صفحة تسجيل الدخول. هل تريد الذهاب الآن؟"), createdAt: Date.now() }]);
      setInput("");
      return;
    }
    if (asksAboutSignup(text)) {
      setPendingAction(null);
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setPendingAction("ask_go_to_signup");
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("I can take you to Sign Up. Do you want to go now?", "أقدر أحولك إلى صفحة إنشاء الحساب. هل تريد الذهاب الآن؟"), createdAt: Date.now() }]);
      setInput("");
      return;
    }

    if (pendingAction === "ask_clinic_location" && !hasFreshNavigationIntent) {
      if (agreesToShareLocation(text)) {
        setMessages((prev) => [
          ...prev,
          userMsg,
          {
            id: newId(),
            role: "bot",
            text: t(
              "Please allow location access in your browser popup so I can find your nearest clinic.",
              "من فضلك وافق على إذن الموقع من نافذة المتصفح حتى أستطيع تحديد أقرب عيادة."
            ),
            createdAt: Date.now(),
          },
        ]);
        setInput("");

        const locationResult = await requestUserLocation();

        if (!locationResult.ok && locationResult.reason === "unsupported") {
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: "bot",
              text: t(
                "This device/browser does not support location. Please type your area (example: Zamalek) and I will find the nearest clinic.",
                "هذا الجهاز/المتصفح لا يدعم تحديد الموقع. اكتب منطقتك (مثال: الزمالك) وسأجد أقرب عيادة."
              ),
              createdAt: Date.now(),
            },
          ]);
          setPendingAction("await_manual_location");
          return;
        }

        if (!locationResult.ok) {
          const reasonText = locationResult.reason === "denied"
            ? t(
              "Location permission is blocked. Enable it in browser site settings, then type yes again, or type your area now.",
              "إذن الموقع مرفوض. فعّله من إعدادات الموقع في المتصفح ثم اكتب نعم مرة أخرى، أو اكتب منطقتك الآن."
            )
            : locationResult.reason === "unavailable"
              ? t(
                "Your device location seems turned off. Please turn on Location Services on your device first, then type yes again so I can find the nearest clinic.",
                "يبدو أن خدمة الموقع في جهازك مغلقة. من فضلك شغّل خدمة الموقع أولًا من إعدادات الجهاز، ثم اكتب نعم مرة أخرى لأحدد أقرب عيادة."
              )
              : locationResult.reason === "timeout"
                ? t(
                  "Location request timed out. Make sure location is on and signal is good, then type yes again. You can also type your area now.",
                  "انتهت مهلة طلب الموقع. تأكد أن الموقع يعمل والإشارة جيدة، ثم اكتب نعم مرة أخرى. ويمكنك أيضًا كتابة منطقتك الآن."
                )
                : t(
                  "I couldn't get your location right now. Please type your area (example: Dokki) and I will find the nearest clinic.",
                  "لم أتمكن من تحديد موقعك الآن. اكتب منطقتك (مثال: الدقي) وسأجد أقرب عيادة."
                );

          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: "bot",
              text: reasonText,
              createdAt: Date.now(),
            },
          ]);
          setPendingAction("await_manual_location");
          return;
        }

        const lat = locationResult.lat;
        const lng = locationResult.lng;
        const nearestClinic = findNearestClinic(lat, lng);
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "bot",
            text: nearestClinic
              ? t(
                `Nearest clinic for you is ${nearestClinic.name} (${nearestClinic.address}). Taking you there now.`,
                `أقرب عيادة لك هي ${nearestClinic.name} (${nearestClinic.address}). سأحولك إليها الآن.`
              )
              : t("Perfect. Taking you to the nearest clinic now.", "ممتاز. سأحولك الآن إلى أقرب عيادة."),
            createdAt: Date.now(),
          },
        ]);
        setPendingAction(null);
        navigate(`/clinics?lat=${lat}&lng=${lng}&fromChatbot=1`);
        setOpen(false);
        return;
      }

      if (["no", "n", "nope", "later", "لا", "مش", "لاحقًا", "لاحقا"].includes(normalized)) {
        setPendingAction(null);
        setMessages((prev) => [
          ...prev,
          userMsg,
          {
            id: newId(),
            role: "bot",
            text: t(
              "No problem. When you are ready, ask me for the nearest clinic and I will guide you.",
              "لا مشكلة. عندما تكون جاهزًا اطلب مني أقرب عيادة وسأرشدك."
            ),
            createdAt: Date.now(),
          },
        ]);
        setInput("");
        return;
      }

      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: newId(),
          role: "bot",
          text: t(
            "To find your nearest clinic, please reply with yes so I can use your current location.",
            "للعثور على أقرب عيادة، من فضلك اكتب نعم حتى أستخدم موقعك الحالي."
          ),
          createdAt: Date.now(),
        },
      ]);
      setInput("");
      return;
    }

    if (asksForNearestClinic(text)) {
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setPendingAction("ask_clinic_location");
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: newId(),
          role: "bot",
          text: t(
            "Sure. To find the nearest clinic, can I use your current location?",
            "أكيد. للعثور على أقرب عيادة، هل يمكنني استخدام موقعك الحالي؟"
          ),
          createdAt: Date.now(),
        },
      ]);
      setInput("");
      return;
    }

    if (detectedSpecies) setPetSpecies(detectedSpecies);
    if (detectedAge !== null) setPetAgeYears(detectedAge);

    const shortMessage = normalized.split(/\s+/).filter(Boolean).length <= 3;
    if (detectedSpecies && !detectedIntent && shortMessage) {
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: newId(),
          role: "bot",
          text: speciesPromptReply(currentLanguage, detectedSpecies),
          createdAt: Date.now(),
        },
      ]);
      setInput("");
      return;
    }

    if (pendingDidYouMean && ["yes", "y", "yeah", "yep", "sure", "ok", "okay"].includes(normalized)) {
      const result = getChatbotResult(pendingDidYouMean, {
        bypassDidYouMean: true,
        context: {
          petSpecies,
          petAgeYears: detectedAge,
          recentMessages: messages.slice(-6).map((m) => m.text),
        },
      });
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setPendingAction(result.nextAction?.type ?? null);
      const debugLine = debugMode ? `\n\n[debug] intent=${result.detectedIntent.intent} confidence=${result.detectedIntent.confidence}` : "";
      const localizedReply = localizeReplyForLanguage(result.reply, currentLanguage, result.detectedIntent.intent, Boolean(petSpecies || detectedSpecies));
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: `${localizedReply}${debugLine}`, createdAt: Date.now() }]);
      setInput("");
      return;
    }
    if (pendingDidYouMean && ["no", "n", "nope"].includes(normalized)) {
      setPendingDidYouMean(null);
      setAwaitingRephrase(true);
      setPendingAction(null);
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Okay-what did you mean? (Example: behavior, foods, Parvovirus, Labrador Retriever)", "حسنًا، ماذا تقصد؟ (مثال: سلوك، أطعمة، بارفو، لابرادور)") , createdAt: Date.now() }]);
      setInput("");
      return;
    }

    if (isAgeOnlyMessage(text, detectedAge) && !detectedIntent && !detectedSpecies) {
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t(`Got it-${detectedAge} years old. What do you need help with (food, behavior, or a health issue)?`, `تمام - العمر ${detectedAge} سنة. تحتاج مساعدة في ماذا (الأكل، السلوك، أو مشكلة صحية)؟`), createdAt: Date.now() }]);
      setInput("");
      return;
    }

    if (detectedIntent) {
      if (!petSpecies && !detectedSpecies) {
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Got it. Is your pet a cat or a dog?", "تمام. حيوانك الأليف قط أم كلب؟"), createdAt: Date.now() }]);
        setInput("");
        return;
      }
      const species = detectedSpecies ?? petSpecies ?? "dog";
      const mappedQuery =
        detectedIntent === "health" ? `health issues ${species}` :
        detectedIntent === "food" ? `${species} safe foods` :
        detectedIntent === "behavior" ? (species === "dog" ? "dog barking" : "cat scratching furniture") :
        detectedIntent === "grooming" ? "grooming" :
        detectedIntent === "vaccines" ? "vaccines" :
        detectedIntent === "training" ? "training" :
        detectedIntent === "adoption" ? "adoption" : "exercise";
      const result = getChatbotResult(mappedQuery, { bypassDidYouMean: true });
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setPendingAction(result.nextAction?.type ?? null);
      const debugLine = debugMode ? `\n\n[debug] intent=${result.detectedIntent.intent} confidence=${result.detectedIntent.confidence}` : "";
      const localizedReply = localizeReplyForLanguage(result.reply, currentLanguage, result.detectedIntent.intent, Boolean(petSpecies || detectedSpecies));
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: `${localizedReply}${debugLine}`, createdAt: Date.now() }]);
      setInput("");
      return;
    }

    if (pendingAction === "weight_goal") {
      const goal = normalized.includes("gain") ? "weight gain" : normalized.includes("loss") || normalized.includes("lose") ? "weight loss" : normalized.includes("maint") || normalized.includes("keep") ? "maintenance" : null;
      if (goal) {
        const result = getChatbotResult(goal, { bypassDidYouMean: true });
        setPendingAction(null);
        setPendingDidYouMean(null);
        setAwaitingRephrase(false);
        const debugLine = debugMode ? `\n\n[debug] intent=${result.detectedIntent.intent} confidence=${result.detectedIntent.confidence}` : "";
        const localizedReply = localizeReplyForLanguage(result.reply, currentLanguage, result.detectedIntent.intent, Boolean(petSpecies || detectedSpecies));
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: `${localizedReply}${debugLine}`, createdAt: Date.now() }]);
        setInput("");
        return;
      }
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: t("Quick one-do you mean weight loss, weight gain, or maintenance?", "سؤال سريع: هل تقصد خسارة وزن، زيادة وزن، أم المحافظة على الوزن؟"), createdAt: Date.now() }]);
      setInput("");
      return;
    }

    if (awaitingRephrase) setAwaitingRephrase(false);
    const result = getChatbotResult(text, {
      context: {
        petSpecies,
        petAgeYears: detectedAge ?? undefined,
        recentMessages: messages.slice(-6).map((m) => m.text),
      },
    });
    setPendingDidYouMean(result.didYouMean?.candidate ?? null);
    setPendingAction(result.nextAction?.type ?? null);
    const debugLine = debugMode ? `\n\n[debug] intent=${result.detectedIntent.intent} confidence=${result.detectedIntent.confidence}` : "";
    const localizedReply = localizeReplyForLanguage(result.reply, currentLanguage, result.detectedIntent.intent, Boolean(petSpecies || detectedSpecies));
    setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: `${localizedReply}${debugLine}`, createdAt: Date.now() }]);
    setInput("");
  }, [awaitingRephrase, debugMode, input, language, messages, navigate, pendingAction, pendingDidYouMean, petSpecies, t]);

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="rounded-full shadow-lg" size="icon" aria-label="Open chat">
            <MessageCircle className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[92vw] sm:w-[420px] p-0">
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <SheetHeader className="space-y-1">
                <SheetTitle>PetLife Assistant</SheetTitle>
                <SheetDescription>{t("Chat with PetLife Assistant.", "تحدث مع مساعد بيت لايف.")}</SheetDescription>
              </SheetHeader>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <div className="border-t p-3">
              <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Type a message...", "اكتب رسالة...")} autoComplete="off" />
                <Button type="submit" size="icon" aria-label="Send message" disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">{t("For urgent symptoms, contact a vet/emergency clinic.", "في الحالات الطارئة تواصل مع طبيب بيطري أو عيادة طوارئ.")}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

