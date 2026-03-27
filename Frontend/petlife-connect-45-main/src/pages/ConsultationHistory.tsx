import { useEffect, useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import { MessageCircle, Calendar, Clock, DollarSign } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import type { ConsultationRequest } from "@/types";
import type { ChatMessage } from "@/hooks/useSignalR";
import api from "@/services/api";

const statusColors: Record<string, string> = {
  accepted: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  declined: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-muted text-muted-foreground",
};

const ConsultationHistory = () => {
  const { user } = useAuthStore();
  const resolvedUserId = user?.userId ?? (Number.isFinite(Number(user?.id)) ? Number(user?.id) : null);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [activeChat, setActiveChat] = useState<ConsultationRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!resolvedUserId) return;
      try {
        const response = await api.get("/Consultations/for-owner", {
          params: { userId: resolvedUserId },
        });
        const rows = Array.isArray(response.data) ? response.data : [];
        const mapped = rows.map((r: any) => ({
          id: String(r.id ?? r.Id ?? ""),
          petOwnerId: String(r.petOwnerId ?? r.PetOwnerId ?? ""),
          petOwnerName: r.petOwnerName ?? r.PetOwnerName ?? "You",
          petOwnerAvatar: r.petOwnerAvatar ?? r.PetOwnerAvatar ?? undefined,
          vetId: String(r.vetId ?? r.VetId ?? ""),
          vetUserId: Number(r.vetUserId ?? r.VetUserId ?? 0),
          vetName: r.vetName ?? r.VetName ?? "Vet",
          vetAvatar: r.vetAvatar ?? r.VetAvatar ?? undefined,
          petId: String(r.petId ?? r.PetId ?? ""),
          petName: r.petName ?? r.PetName ?? "Pet",
          petSpecies: r.petSpecies ?? r.PetSpecies ?? "Unknown",
          fee: Number(r.fee ?? r.Fee ?? 0),
          status: (r.status ?? r.Status ?? "pending") as ConsultationRequest["status"],
          createdAt: r.createdAt ?? r.CreatedAt ?? new Date().toISOString(),
        }));
        setRequests(mapped);
      } catch {
        // ignore
      }
    };

    void load();
  }, [resolvedUserId]);

  const fetchConversation = async (conversationId: string) => {
    if (!resolvedUserId) return;
    try {
      const response = await api.get(`/Notifications/conversation/${conversationId}`, {
        params: { userId: resolvedUserId },
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      const mapped = rows.map((m: any) => ({
        id: String(m.id ?? m.Id ?? ""),
        senderId: String(m.senderId ?? m.SenderId ?? ""),
        senderName: m.senderName ?? m.SenderName ?? "User",
        content: m.content ?? m.Content ?? "",
        timestamp: m.timestamp ?? m.Timestamp ?? new Date().toISOString(),
        type: "text" as const,
      }));
      setChatMessages(mapped);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!activeChat) return;
    const conversationId = activeChat.id;
    void fetchConversation(conversationId);
    const interval = setInterval(() => {
      void fetchConversation(conversationId);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChat]);

  if (activeChat) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Chat with <span className="font-medium text-foreground">{activeChat.vetName}</span> about{" "}
            <span className="font-medium text-foreground">{activeChat.petName}</span>
          </p>
        </div>
        <ChatWindow
          conversationId={activeChat.id}
          recipientName={activeChat.vetName}
          recipientAvatar={activeChat.vetAvatar}
          initialMessages={chatMessages}
          onSendMessage={async (content) => {
            if (!resolvedUserId || !activeChat.vetUserId) {
              throw new Error("Missing user");
            }
            const response = await api.post("/Notifications/message", {
              senderUserId: resolvedUserId,
              receiverUserId: activeChat.vetUserId,
              content,
              conversationId: activeChat.id,
              relatedId: activeChat.id,
            });
            await fetchConversation(activeChat.id);
            return {
              id: String(response.data?.id ?? `msg-${Date.now()}`),
              senderId: String(resolvedUserId),
              senderName: "You",
              content,
              timestamp: new Date().toISOString(),
              type: "text",
            };
          }}
          onBack={() => setActiveChat(null)}
        />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const accepted = requests.filter((r) => r.status === "accepted");
  const past = requests.filter((r) => r.status === "completed" || r.status === "declined");

  const renderRequestCard = (req: ConsultationRequest, showChatButton = false) => (
    <Card key={req.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
          {req.vetAvatar ? (
            <img src={req.vetAvatar} alt={req.vetName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-heading font-bold text-sm text-muted-foreground">
              {req.vetName.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{req.vetName}</p>
          <p className="text-xs text-muted-foreground">Pet: {req.petName} ({req.petSpecies})</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
              <DollarSign className="h-3 w-3 mr-0.5" />
              {req.fee} EGP
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(req.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={statusColors[req.status]}>{req.status}</Badge>
          {showChatButton && req.status === "accepted" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setActiveChat(req)}>
              <MessageCircle className="mr-1 h-3 w-3" /> Chat
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">My Consultations</h1>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Active
            {accepted.length > 0 && (
              <Badge className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                {accepted.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pending.length > 0 && (
              <Badge className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]" variant="secondary">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {accepted.length === 0 ? (
            <EmptyState
              title="No active consultations"
              description="Your accepted consultation requests will appear here."
              icon={<MessageCircle className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            <div className="space-y-3">{accepted.map((r) => renderRequestCard(r, true))}</div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pending.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="Send a consultation request to a vet to get started."
              icon={<Clock className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            <div className="space-y-3">{pending.map((r) => renderRequestCard(r))}</div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {past.length === 0 ? (
            <EmptyState
              title="No past consultations"
              description="Your completed and declined consultations will appear here."
              icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            <div className="space-y-3">{past.map((r) => renderRequestCard(r))}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultationHistory;
