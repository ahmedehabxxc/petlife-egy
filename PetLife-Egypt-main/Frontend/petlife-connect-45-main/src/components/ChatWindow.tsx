import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Wifi, WifiOff, ArrowLeft } from "lucide-react";
import { useSignalR, type ChatMessage } from "@/hooks/useSignalR";
import { useAuthStore } from "@/stores/authStore";

interface ChatWindowProps {
  conversationId: string;
  recipientName: string;
  recipientAvatar?: string;
  /** Optional initial messages for demo/mock */
  initialMessages?: ChatMessage[];
  /** Optional override to send a message (e.g., via API) */
  onSendMessage?: (content: string) => Promise<ChatMessage>;
  onBack?: () => void;
}

const ChatWindow = ({
  conversationId,
  recipientName,
  recipientAvatar,
  initialMessages = [],
  onSendMessage,
  onBack,
}: ChatWindowProps) => {
  const { user } = useAuthStore();
  const userId = user?.id || "anonymous";
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMessageReceived = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleTypingChanged = useCallback((typingUserId: string, isTyping: boolean) => {
    if (typingUserId !== userId) setOtherTyping(isTyping);
  }, [userId]);

  const useRealtime = !onSendMessage;
  const { isConnected, connectionError, sendMessage, sendTypingIndicator } = useSignalR({
    conversationId,
    userId,
    onMessageReceived: handleMessageReceived,
    onTypingChanged: handleTypingChanged,
    autoConnect: useRealtime,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, otherTyping]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const msg = onSendMessage ? await onSendMessage(trimmed) : await sendMessage(trimmed);
    setMessages((prev) => [...prev, msg]);
    setInput("");
    sendTypingIndicator(false);

    // Simulate a reply in demo mode
    if (!isConnected && !onSendMessage) {
      setTimeout(() => {
        const reply: ChatMessage = {
          id: `msg-reply-${Date.now()}`,
          senderId: "other",
          senderName: recipientName,
          content: getAutoReply(trimmed),
          timestamp: new Date().toISOString(),
          type: "text",
        };
        setMessages((prev) => [...prev, reply]);
      }, 1200 + Math.random() * 800);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    sendTypingIndicator(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingIndicator(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {recipientAvatar ? (
            <img src={recipientAvatar} alt={recipientName} className="w-full h-full object-cover" />
          ) : (
            <span className="font-heading font-bold text-sm text-primary">{recipientName.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm truncate">{recipientName}</p>
          {otherTyping && <p className="text-xs text-primary animate-pulse">typing…</p>}
        </div>
        {useRealtime ? (
          <Badge variant="outline" className={`text-xs gap-1 ${isConnected ? "text-success border-success/20" : "text-muted-foreground"}`}>
            {isConnected ? <><Wifi className="h-3 w-3" /> Live</> : <><WifiOff className="h-3 w-3" /> Demo</>}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs gap-1 text-success border-success/20">
            <Wifi className="h-3 w-3" /> Saved
          </Badge>
        )}
      </div>

      {/* Connection notice */}
      {useRealtime && connectionError && (
        <div className="px-4 py-1.5 bg-warning/10 text-warning text-xs text-center">{connectionError}</div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello! 👋</p>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === userId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMe ? "order-2" : ""}`}>
                  {msg.type === "system" ? (
                    <p className="text-xs text-muted-foreground text-center italic">{msg.content}</p>
                  ) : (
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      {!isMe && <p className="text-xs font-medium mb-0.5 opacity-70">{msg.senderName}</p>}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {otherTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message…"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="rounded-full"
          />
          <Button size="icon" className="rounded-full flex-shrink-0" onClick={handleSend} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Simple auto-replies for demo mode
function getAutoReply(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) return "Hello! How can I help you today? 😊";
  if (lower.includes("appointment") || lower.includes("book")) return "Sure! I have availability this week. What day works best for you?";
  if (lower.includes("sick") || lower.includes("not eating") || lower.includes("vomit")) return "I'm sorry to hear that. How long has this been going on? Any other symptoms?";
  if (lower.includes("thank")) return "You're welcome! Don't hesitate to reach out if you need anything else. 🐾";
  if (lower.includes("order") || lower.includes("delivery")) return "Let me check on that for you. One moment please…";
  if (lower.includes("price") || lower.includes("cost")) return "I'll send you the pricing details shortly.";
  return "Got it! Let me get back to you on that shortly.";
}

export default ChatWindow;
