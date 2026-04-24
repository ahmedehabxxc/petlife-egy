import * as React from "react";
import { MessageCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getChatbotResult } from "@/lib/chatbot";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "bot";
type Intent = "health" | "food" | "behavior" | "grooming" | "vaccines" | "training" | "adoption" | "exercise";
type ChatMessage = { id: string; role: ChatRole; text: string; createdAt: number };

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
  if (/\bdog\b/.test(t)) return "dog";
  if (/\bcat\b/.test(t)) return "cat";
  return null;
}
function extractIntent(raw: string): Intent | null {
  const t = raw.toLowerCase();
  if (/\bhealth\b|\bill(ness)?\b|\bdisease(s)?\b|\bsick\b/.test(t)) return "health";
  if (/\bfood(s)?\b|\bfeed(ing)?\b|\bdiet\b|\bweight\b/.test(t)) return "food";
  if (/\bbehavior\b|\bbehaviour\b|\btrain(ing)?\b|\bbark(ing)?\b|\bscratch(ing)?\b/.test(t)) return "behavior";
  if (/\bgroom(ing)?\b|\bbath\b|\bbrush\b|\bnail(s)?\b|\bdental\b|\bteeth\b/.test(t)) return "grooming";
  if (/\bvaccin(e|es|ation)\b|\bshots?\b|\brabies\b/.test(t)) return "vaccines";
  if (/\btraining\b|\btrain\b/.test(t)) return "training";
  if (/\badopt(ion)?\b|\bshelter\b|\brescue\b/.test(t)) return "adoption";
  if (/\bexercise\b|\bwalk(s)?\b|\bplay\b|\bactivity\b/.test(t)) return "exercise";
  return null;
}

export default function ChatbotWidget() {
  const debugMode = import.meta.env.VITE_CHATBOT_DEBUG === "true";
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [pendingDidYouMean, setPendingDidYouMean] = React.useState<string | null>(null);
  const [awaitingRephrase, setAwaitingRephrase] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<null | "weight_goal">(null);
  const [petSpecies, setPetSpecies] = React.useState<"dog" | "cat" | null>(null);
  const [, setPetAgeYears] = React.useState<number | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { id: newId(), role: "bot", text: "Hi! I'm PetLife Assistant. Tell me: cat or dog + age + what you need help with.", createdAt: Date.now() },
  ]);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    return () => window.clearTimeout(t);
  }, [open, messages.length]);

  const send = React.useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: newId(), role: "user", text, createdAt: Date.now() };
    const normalized = text.toLowerCase().trim();
    const detectedAge = extractAgeYears(text);
    const detectedSpecies = extractSpecies(text);
    const detectedIntent = extractIntent(text);
    if (detectedSpecies) setPetSpecies(detectedSpecies);
    if (detectedAge !== null) setPetAgeYears(detectedAge);

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
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: `${result.reply}${debugLine}`, createdAt: Date.now() }]);
      setInput("");
      return;
    }
    if (pendingDidYouMean && ["no", "n", "nope"].includes(normalized)) {
      setPendingDidYouMean(null);
      setAwaitingRephrase(true);
      setPendingAction(null);
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: "Okay-what did you mean? (Example: behavior, foods, Parvovirus, Labrador Retriever)", createdAt: Date.now() }]);
      setInput("");
      return;
    }

    if (detectedAge !== null && (normalized === String(detectedAge) || normalized.includes("age") || normalized.split(/\s+/).length <= 3)) {
      setPendingDidYouMean(null);
      setAwaitingRephrase(false);
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: `Got it-${detectedAge} years old. What do you need help with (food, behavior, or a health issue)?`, createdAt: Date.now() }]);
      setInput("");
      return;
    }

    const shortMessage = normalized.split(/\s+/).filter(Boolean).length <= 3;
    if (detectedIntent && shortMessage) {
      if (!petSpecies && !detectedSpecies) {
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: "Got it. Is your pet a cat or a dog?", createdAt: Date.now() }]);
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
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: `${result.reply}${debugLine}`, createdAt: Date.now() }]);
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
        setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: `${result.reply}${debugLine}`, createdAt: Date.now() }]);
        setInput("");
        return;
      }
      setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: "Quick one-do you mean weight loss, weight gain, or maintenance?", createdAt: Date.now() }]);
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
    setMessages((prev) => [...prev, userMsg, { id: newId(), role: "bot", text: `${result.reply}${debugLine}`, createdAt: Date.now() }]);
    setInput("");
  }, [awaitingRephrase, debugMode, input, messages, pendingAction, pendingDidYouMean, petSpecies]);

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
                <SheetDescription>Chat with PetLife Assistant.</SheetDescription>
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
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." autoComplete="off" />
                <Button type="submit" size="icon" aria-label="Send message" disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">For urgent symptoms, contact a vet/emergency clinic.</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

