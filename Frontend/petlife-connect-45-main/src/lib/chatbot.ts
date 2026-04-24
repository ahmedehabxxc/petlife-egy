import { PET_KNOWLEDGE } from "@/lib/petKnowledge";

type AdviceTopic = "feeding" | "vaccines" | "grooming" | "training" | "adoption" | "sick" | "emergency" | "exercise" | "general";
export type ChatIntent = "health" | "food" | "behavior" | "training" | "general";

export type ChatContext = {
  petSpecies?: "dog" | "cat" | null;
  petAgeYears?: number | null;
  lastIntent?: ChatIntent | null;
  recentMessages?: string[];
};

const DEBUG_MODE = import.meta.env.VITE_CHATBOT_DEBUG === "true";

function normalizeSpaces(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function includesAny(text: string, words: string[]) {
  return words.some((w) => text.includes(w));
}
function humanOpeners() {
  return ["Got you.", "Okay, let's sort it out.", "Thanks for sharing that.", "I hear you."];
}
function askOne(...qs: string[]) {
  return pick(qs.filter(Boolean));
}

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j]! + 1, dp[j - 1]! + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n]!;
}

const SPELL_FIXES: Record<string, string> = {
  dgo: "dog",
  cta: "cat",
  vommit: "vomit",
  behavour: "behavior",
  bhaviour: "behaviour",
  helth: "health",
  foood: "food",
  vaccen: "vaccine",
  eatting: "eating",
  diarhea: "diarrhea",
  parvoo: "parvo",
  urgnt: "urgent",
  vett: "vet",
  doggo: "dog",
  kitty: "cat",
  kittie: "cat",
  akl: "eat",
  taam: "food",
};

const ARABIC_HINTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /(كلب|كلبي)/g, replacement: " dog " },
  { pattern: /(قط|قطة|قطتي)/g, replacement: " cat " },
  { pattern: /(ياكل|ما ياكل|مايأكل|مش بيأكل|مش ياكل|ما بياكل)/g, replacement: " not eating " },
  { pattern: /(ترجيع|استفراغ|قيء)/g, replacement: " vomiting " },
  { pattern: /(اسهال)/g, replacement: " diarrhea " },
  { pattern: /(تطعيم|لقاح)/g, replacement: " vaccine " },
  { pattern: /(دكتور|بيطري)/g, replacement: " vet " },
  { pattern: /(سلوك)/g, replacement: " behavior " },
  { pattern: /(اكل|طعام)/g, replacement: " food " },
  { pattern: /(مريض|مرض|تعبان)/g, replacement: " sick " },
];

export type NormalizedInput = {
  raw: string;
  normalized: string;
  corrected: string;
  tokens: string[];
  changed: boolean;
};

export function normalizeInput(raw: string): NormalizedInput {
  let lowered = raw.toLowerCase();
  for (const hint of ARABIC_HINTS) lowered = lowered.replace(hint.pattern, hint.replacement);
  const cleaned = normalizeSpaces(lowered.replace(/[^\p{L}\p{N}\s.-]/gu, " "));
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const correctedTokens = tokens.map((t) => SPELL_FIXES[t] ?? t);
  const corrected = normalizeSpaces(correctedTokens.join(" "));
  return { raw, normalized: cleaned, corrected, tokens: correctedTokens, changed: corrected !== cleaned };
}

function getDidYouMeanCandidate(text: string): string | null {
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
  const candidates = [
    "behavior",
    "behaviour",
    "breed",
    "breeds",
    "symptom",
    "symptoms",
    "treatment",
    "safe",
    "dangerous",
    "food",
    "foods",
    "health",
    "training",
    ...PET_KNOWLEDGE.breeds.map((b) => b.name.toLowerCase()),
    ...PET_KNOWLEDGE.health_issues.map((h) => h.name.toLowerCase()),
  ];
  let best: { cand: string; dist: number } | null = null;
  for (const tok of tokens) {
    if (tok.length < 4 || candidates.includes(tok)) continue;
    for (const cand of candidates) {
      const candKey = cand.includes(" ") ? cand.split(" ")[0]! : cand;
      const d = levenshtein(tok, candKey);
      if (d <= 2 && (!best || d < best.dist)) best = { cand, dist: d };
    }
  }
  return best?.cand ?? null;
}

function findBreedMention(text: string) {
  return PET_KNOWLEDGE.breeds.find((b) => text.includes(normalizeSpaces(b.name.toLowerCase()))) ?? null;
}
function findHealthIssueMention(text: string) {
  return PET_KNOWLEDGE.health_issues.find((h) => text.includes(normalizeSpaces(h.name.toLowerCase()))) ?? null;
}
function detectTopic(t: string): AdviceTopic {
  if (/(poison|chok(e|ing)|seizure|fit|bleed|bleeding|collapse|unconscious|not breathing|hit by car|broken|fracture)/i.test(t)) return "emergency";
  if (/(vomit|vomiting|diarrhea|diarrhoea|fever|cough|sneeze|itch|itchy|fleas|ticks|worms|not eating|not eat|letharg|pain)/i.test(t)) return "sick";
  if (/(vaccine|vaccination|shots?|rabies|parvo|distemper)/i.test(t)) return "vaccines";
  if (/(food|feed|diet|kibble|raw|treats?|weight|obese|overweight)/i.test(t)) return "feeding";
  if (/(groom|bath|brush|fur|shedding|nails?|ears?|teeth|dental)/i.test(t)) return "grooming";
  if (/(train|training|behavior|behaviour|bite|barking|aggressive|litter|toilet|potty)/i.test(t)) return "training";
  if (/(adopt|adoption|shelter|rescue)/i.test(t)) return "adoption";
  if (/(walk|exercise|play|activity)/i.test(t)) return "exercise";
  return "general";
}

export function detectIntent(text: string): { intent: ChatIntent; confidence: number } {
  const s = text.toLowerCase();
  const score = {
    health: 0,
    food: 0,
    behavior: 0,
    training: 0,
    general: 0.1,
  };

  if (/(health|sick|vomit|vomiting|diarrhea|blood|pain|fever|vet|not eating|disease|illness|symptom)/i.test(s)) score.health += 0.8;
  if (/(food|feed|diet|safe foods|dangerous foods|eat|weight|obese|kibble|treat)/i.test(s)) score.food += 0.8;
  if (/(behavior|behaviour|bark|barking|scratch|scratching|aggressive|anxious)/i.test(s)) score.behavior += 0.8;
  if (/(train|training|toilet|potty|litter|obedience|command)/i.test(s)) score.training += 0.8;
  if (/(help|advice|pet|dog|cat)/i.test(s)) score.general += 0.15;

  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]) as Array<[ChatIntent, number]>;
  const [intent, top] = ranked[0];
  const second = ranked[1]?.[1] ?? 0;
  const confidence = Math.max(0.4, Math.min(0.98, top - second + 0.55));
  return { intent, confidence: Number(confidence.toFixed(2)) };
}

function buildStructuredReply(parts: {
  direct: string;
  explanation: string;
  steps: string[];
  warning?: string | null;
  followUp: string;
}) {
  const lines = [
    parts.direct,
    "",
    `Why: ${parts.explanation}`,
    "",
    "What to do now:",
    ...parts.steps.map((s) => `- ${s}`),
  ];
  if (parts.warning) {
    lines.push("", `Warning: ${parts.warning}`);
  }
  lines.push("", parts.followUp);
  return lines.join("\n");
}

export type ChatbotResult =
  | { reply: string; didYouMean: null; nextAction: null | { type: "weight_goal" }; detectedIntent: { intent: ChatIntent; confidence: number } }
  | { reply: string; didYouMean: { candidate: string }; nextAction: null; detectedIntent: { intent: ChatIntent; confidence: number } };

export function getChatbotResult(
  rawUserText: string,
  opts?: { bypassDidYouMean?: boolean; context?: ChatContext },
): ChatbotResult {
  const norm = normalizeInput(rawUserText);
  const text = norm.corrected;
  const detectedIntent = detectIntent(text);

  if (DEBUG_MODE) {
    console.debug("[chatbot]", {
      raw: rawUserText,
      normalized: norm.normalized,
      corrected: norm.corrected,
      intent: detectedIntent,
      context: opts?.context,
    });
  }

  if (!text) {
    return {
      reply: "I can help. Could you share a bit more detail about your dog or cat?",
      didYouMean: null,
      nextAction: null,
      detectedIntent,
    };
  }

  if (!opts?.bypassDidYouMean) {
    const candidate = getDidYouMeanCandidate(text);
    if (candidate) {
      return { reply: `you meen ${candidate}?`, didYouMean: { candidate }, nextAction: null, detectedIntent };
    }
  }

  if (text === "cat" || text === "dog") {
    const species = PET_KNOWLEDGE.species.find((s) => s.name.toLowerCase() === text);
    if (species) {
      return {
        reply: buildStructuredReply({
          direct: `${pick(humanOpeners())} Great, we're talking about a ${text}.`,
          explanation: `${species.description} Typical lifespan is ${species.lifespan}.`,
          steps: [
            `Watch for common issues: ${species.common_issues.join(", ")}.`,
            "Keep feeding and daily routine consistent.",
            "Tell me the exact concern so I can give focused advice.",
          ],
          followUp: "Do you want help with health, food, behavior, or training?",
        }),
        didYouMean: null,
        nextAction: null,
        detectedIntent,
      };
    }
  }

  const breed = findBreedMention(text);
  if (breed && includesAny(text, ["breed", "about", "info", "temperament", "energy", "size", "lifespan", "good for", "groom"])) {
    return {
      reply: buildStructuredReply({
        direct: `${pick(humanOpeners())} ${breed.name} is a good option for many pet owners.`,
        explanation: `Temperament: ${breed.temperament}. Energy: ${breed.energy_level}. Lifespan: ${breed.lifespan}.`,
        steps: [
          breed.size ? `Size expectation: ${breed.size}.` : "Check expected adult size before choosing.",
          breed.good_for ? `Usually good for: ${breed.good_for}.` : "Match this breed with your daily time and activity.",
          breed.grooming ? `Grooming level: ${breed.grooming}.` : "Plan regular grooming and vet checkups.",
        ],
        followUp: "Do you want a comparison with another breed?",
      }),
      didYouMean: null,
      nextAction: null,
      detectedIntent,
    };
  }

  const issue = findHealthIssueMention(text);
  if (issue || detectedIntent.intent === "health") {
    if (issue) {
      const warning =
        issue.severity === "high"
          ? "This can become serious quickly. Contact a vet promptly."
          : "If symptoms worsen or last more than 24-48 hours, see a vet.";
      return {
        reply: buildStructuredReply({
          direct: `${pick(humanOpeners())} ${issue.name} can happen in ${issue.species}s.`,
          explanation: `Common signs include: ${issue.symptoms.join(", ")}.`,
          steps: [
            `Typical treatment path: ${issue.treatment}.`,
            "Keep your pet hydrated and avoid changing food suddenly.",
            "Track symptom timing and severity for your vet.",
          ],
          warning,
          followUp: "What exact symptoms are you seeing now, and for how long?",
        }),
        didYouMean: null,
        nextAction: null,
        detectedIntent,
      };
    }

    const species = text.includes("cat") ? "cat" : text.includes("dog") ? "dog" : opts?.context?.petSpecies ?? null;
    if (species) {
      const names = PET_KNOWLEDGE.health_issues.filter((h) => h.species === species).map((h) => h.name);
      return {
        reply: buildStructuredReply({
          direct: `${pick(humanOpeners())} I can help with ${species} health questions.`,
          explanation: `Based on your pet type, common issues include: ${names.join(", ")}.`,
          steps: [
            "Pick one issue name and I will break down symptoms and next steps.",
            "Share your pet age and when symptoms started.",
            "Mention appetite, water intake, and activity changes.",
          ],
          warning: "If there is breathing trouble, repeated vomiting, blood, collapse, or severe pain, seek urgent vet care now.",
          followUp: "Which issue matches your case most?",
        }),
        didYouMean: null,
        nextAction: null,
        detectedIntent,
      };
    }
  }

  if (detectedIntent.intent === "food" || includesAny(text, ["safe food", "foods", "eat", "feed", "diet"])) {
    const pet: "dog" | "cat" | null =
      text.includes("cat") ? "cat" : text.includes("dog") ? "dog" : opts?.context?.petSpecies ?? null;
    if (pet) {
      const f = PET_KNOWLEDGE.food[pet];
      const weightMention = /(weight gain|gain weight|weight loss|lose weight|maintenance|maintain)/i.test(text);
      if (weightMention) {
        return {
          reply: buildStructuredReply({
            direct: `${pick(humanOpeners())} We can tune food for your goal.`,
            explanation: "Weight changes should be gradual to stay safe.",
            steps: [
              "Measure meals, do not free-feed all day.",
              "Adjust portions by about 10% and monitor for 2 weeks.",
              "Use activity + diet together for better results.",
            ],
            warning: "Rapid weight loss, poor appetite, or vomiting needs a vet check.",
            followUp: "Is your goal weight loss, weight gain, or maintenance?",
          }),
          didYouMean: null,
          nextAction: { type: "weight_goal" },
          detectedIntent,
        };
      }
      return {
        reply: buildStructuredReply({
          direct: `${pick(humanOpeners())} Here is a quick ${pet} food guide.`,
          explanation: `Safe foods: ${f.safe_foods.join(", ")}. Avoid: ${f.dangerous_foods.join(", ")}.`,
          steps: [
            `Typical feeding frequency: ${f.feeding_times}.`,
            "Introduce new food gradually over 7-10 days.",
            "Keep fresh water available all day.",
          ],
          warning: "If your pet ate a toxic food (like chocolate, onion, grapes), contact a vet immediately.",
          followUp: "What exact food are you planning to give?",
        }),
        didYouMean: null,
        nextAction: null,
        detectedIntent,
      };
    }
  }

  if (detectedIntent.intent === "behavior" || includesAny(text, ["bark", "barking", "scratch", "scratching", "behavior", "behaviour"])) {
    const dogBark = PET_KNOWLEDGE.behaviors.find((b) => b.pet_type === "dog" && b.behavior.toLowerCase() === "barking");
    const catScratch = PET_KNOWLEDGE.behaviors.find((b) => b.pet_type === "cat" && b.behavior.toLowerCase() === "scratching furniture");
    if (text.includes("bark") && dogBark) {
      return {
        reply: buildStructuredReply({
          direct: `${pick(humanOpeners())} Barking is usually communication, not just a bad habit.`,
          explanation: `Most common meanings: ${dogBark.meaning}.`,
          steps: [
            `Start with: ${dogBark.solution}.`,
            "Increase daily physical + mental activity.",
            "Reward quiet behavior quickly and consistently.",
          ],
          followUp: "When does the barking happen most - night, visitors, or when alone?",
        }),
        didYouMean: null,
        nextAction: null,
        detectedIntent,
      };
    }
    if ((text.includes("scratch") || text.includes("scratching")) && catScratch) {
      return {
        reply: buildStructuredReply({
          direct: `${pick(humanOpeners())} Scratching is normal cat behavior.`,
          explanation: `It can mean: ${catScratch.meaning}.`,
          steps: [
            `Main fix: ${catScratch.solution}.`,
            "Place scratch posts near the furniture they target.",
            "Reward post use with treats or play.",
          ],
          followUp: "Which furniture is your cat scratching most?",
        }),
        didYouMean: null,
        nextAction: null,
        detectedIntent,
      };
    }
  }

  if (detectedIntent.intent === "training" || includesAny(text, ["train", "training", "potty", "litter", "toilet"])) {
    return {
      reply: buildStructuredReply({
        direct: `${pick(humanOpeners())} Training works best with short, consistent sessions.`,
        explanation: "Pets learn faster with clear cues and immediate rewards.",
        steps: [
          "Keep sessions 5-10 minutes.",
          "Reward the exact behavior you want right away.",
          "Use one command word consistently.",
        ],
        followUp: "What specific training issue are you facing now?",
      }),
      didYouMean: null,
      nextAction: null,
      detectedIntent,
    };
  }

  const topic = detectTopic(text);
  if (topic === "emergency") {
    return {
      reply: buildStructuredReply({
        direct: "This may be urgent.",
        explanation: "Symptoms like severe bleeding, choking, collapse, seizures, or poison exposure can be life-threatening.",
        steps: [
          "Call an emergency vet clinic now.",
          "Keep your pet warm and calm during transport.",
          "Do not force food or medicine unless told by a vet.",
        ],
        warning: "Do not wait at home if severe symptoms are present.",
        followUp: "Tell me what happened, your pet type, and age while you arrange care.",
      }),
      didYouMean: null,
      nextAction: null,
      detectedIntent,
    };
  }

  if (topic === "sick") {
    return {
      reply: buildStructuredReply({
        direct: `${pick(humanOpeners())} I understand, your pet may be unwell.`,
        explanation: "General symptoms can have multiple causes, so we should narrow it down safely.",
        steps: [
          "Keep water available and monitor appetite.",
          "Track symptoms, timing, stool/vomit, and activity level.",
          "Avoid sudden food changes until stable.",
        ],
        warning: "If there is breathing trouble, repeated vomiting, blood, severe pain, or extreme weakness, seek urgent vet care.",
        followUp: "What exact symptoms are present now?",
      }),
      didYouMean: null,
      nextAction: null,
      detectedIntent,
    };
  }

  return {
    reply: buildStructuredReply({
      direct: `${pick(humanOpeners())} I want to make sure I understand you correctly.`,
      explanation: "I can help with dog and cat health, food, behavior, and training.",
      steps: [
        "Tell me pet type (dog/cat).",
        "Share age and key symptom or concern.",
        "Add how long this has been happening.",
      ],
      followUp: "Could you rephrase your question in one short sentence?",
    }),
    didYouMean: null,
    nextAction: null,
    detectedIntent,
  };
}

