import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ChatWindow from "@/components/ChatWindow";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import { Search, MessageCircle, Heart, CheckCircle2, XCircle, PawPrint } from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage } from "@/hooks/useSignalR";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

interface MatchContact {
  id: string;
  conversationId: string;
  otherUserId: number;
  userName: string;
  userAvatar?: string;
  petName: string;
  petPhoto?: string;
  lastMessage: string;
  date: string;
  initialMessages: ChatMessage[];
  kind: "match" | "adoption";
}

interface MatchRequest {
  id: string;
  senderUserId: number;
  receiverUserId: number;
  fromUser: string;
  petName: string;
  petPhoto?: string;
  status: "pending" | "accepted" | "declined";
  date: string;
  kind: "match" | "adoption";
}

const PetMatching = () => {
  const { user } = useAuthStore();
  const resolvedUserId = user?.userId ?? (Number.isFinite(Number(user?.id)) ? Number(user?.id) : null);
  const hasAuth = Boolean(user?.id || user?.userId);
  const [contacts, setContacts] = useState<MatchContact[]>([]);
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [activeChat, setActiveChat] = useState<MatchContact | null>(null);
  const [search, setSearch] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const location = useLocation();

  const queryConversationId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("conversationId");
  }, [location.search]);

  const queryTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "chats";
  }, [location.search]);

  const loadData = useCallback(async () => {
    if (!hasAuth) return;
      try {
        const [reqRes, chatRes, adoptionRes, adoptionChatsRes] = await Promise.all([
          api.get("/MatchRequests/received", {
            params: resolvedUserId ? { userId: resolvedUserId } : undefined,
          }),
          api.get("/MatchRequests/chats", {
            params: resolvedUserId ? { userId: resolvedUserId } : undefined,
          }),
          api.get("/AdoptionRequests/received", {
            params: resolvedUserId ? { userId: resolvedUserId } : undefined,
          }),
          api.get("/AdoptionRequests/chats", {
            params: resolvedUserId ? { userId: resolvedUserId } : undefined,
          }),
        ]);

      const reqRows = Array.isArray(reqRes.data) ? reqRes.data : [];
      const mappedRequests = reqRows.map((r: any) => ({
        id: String(r.id ?? r.Id ?? ""),
        senderUserId: Number(r.senderUserId ?? r.SenderUserId ?? 0),
          receiverUserId: Number(r.receiverUserId ?? r.ReceiverUserId ?? 0),
        fromUser: r.senderName ?? r.SenderName ?? "User",
        petName: r.petName ?? r.PetName ?? "Pet",
        petPhoto: r.petPhoto ?? r.PetPhoto ?? undefined,
        status: (r.status ?? r.Status ?? "pending") as MatchRequest["status"],
        date: r.createdAt ?? r.CreatedAt ?? new Date().toISOString(),
        kind: "match" as const,
      }));

      const adoptionRows = Array.isArray(adoptionRes.data) ? adoptionRes.data : [];
      const mappedAdoptions = adoptionRows.map((r: any) => ({
        id: String(r.id ?? r.Id ?? ""),
        senderUserId: Number(r.senderUserId ?? r.SenderUserId ?? 0),
        receiverUserId: Number(r.receiverUserId ?? r.ReceiverUserId ?? 0),
        fromUser: r.senderName ?? r.SenderName ?? "User",
        petName: r.petName ?? r.PetName ?? "Pet",
        petPhoto: r.petPhoto ?? r.PetPhoto ?? undefined,
        status: (r.status ?? r.Status ?? "pending") as MatchRequest["status"],
        date: r.createdAt ?? r.CreatedAt ?? new Date().toISOString(),
        kind: "adoption" as const,
      }));

      const combined = [...mappedRequests, ...mappedAdoptions].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setRequests(combined);

      const chatRows = Array.isArray(chatRes.data) ? chatRes.data : [];
      const mappedChats = chatRows.map((c: any) => ({
        id: String(c.conversationId ?? c.ConversationId ?? ""),
        conversationId: String(c.conversationId ?? c.ConversationId ?? ""),
        otherUserId: Number(c.otherUserId ?? c.OtherUserId ?? 0),
        userName: c.otherUserName ?? c.OtherUserName ?? "User",
        petName: c.petName ?? c.PetName ?? "Pet",
        petPhoto: c.petPhoto ?? c.PetPhoto ?? undefined,
        lastMessage: "",
        date: "",
        initialMessages: [],
        kind: "match" as const,
      }));
      const adoptionChatRows = Array.isArray(adoptionChatsRes.data) ? adoptionChatsRes.data : [];
      const mappedAdoptionChats = adoptionChatRows.map((c: any) => ({
        id: String(c.conversationId ?? c.ConversationId ?? ""),
        conversationId: String(c.conversationId ?? c.ConversationId ?? ""),
        otherUserId: Number(c.otherUserId ?? c.OtherUserId ?? 0),
        userName: c.otherUserName ?? c.OtherUserName ?? "User",
        petName: c.petName ?? c.PetName ?? "Pet",
        petPhoto: c.petPhoto ?? c.PetPhoto ?? undefined,
        lastMessage: "",
        date: "",
        initialMessages: [],
        kind: "adoption" as const,
      }));

      const combinedChats = [...mappedChats, ...mappedAdoptionChats];
      const existingIds = new Set(combinedChats.map((c) => c.conversationId));
      const fallbackFromRequests = combined
        .filter((r) => r.status === "accepted")
        .map((r) => ({
          id: r.id,
          conversationId: r.id,
          otherUserId: r.senderUserId,
          userName: r.fromUser,
          petName: r.petName,
          petPhoto: r.petPhoto,
          lastMessage: "",
          date: "",
          initialMessages: [],
          kind: r.kind,
        }))
        .filter((c) => !existingIds.has(c.conversationId) && c.otherUserId > 0);

      setContacts([...combinedChats, ...fallbackFromRequests]);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to load matching data";
      toast.error(message);
    }
  }, [hasAuth, resolvedUserId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const fetchConversation = useCallback(async (conversationId: string) => {
    if (!hasAuth) return;
    try {
      const response = await api.get(`/Notifications/conversation/${conversationId}`, {
        params: resolvedUserId ? { userId: resolvedUserId } : undefined,
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
      // keep last messages if fetch fails
    }
  }, [hasAuth, resolvedUserId]);

  useEffect(() => {
    const openChatFromQuery = async () => {
      if (!queryConversationId || !hasAuth) return;
      const contact = contacts.find((c) => c.conversationId === queryConversationId);
      if (!contact) {
        try {
          const adoptionRes = await api.get(`/AdoptionRequests/${queryConversationId}`, {
            params: resolvedUserId ? { userId: resolvedUserId } : undefined,
          });
          const data = adoptionRes.data || {};
          const fallbackContact: MatchContact = {
            id: String(data.conversationId ?? data.ConversationId ?? queryConversationId),
            conversationId: String(data.conversationId ?? data.ConversationId ?? queryConversationId),
            otherUserId: Number(data.otherUserId ?? data.OtherUserId ?? 0),
            userName: data.otherUserName ?? data.OtherUserName ?? "User",
            petName: data.petName ?? data.PetName ?? "Pet",
            petPhoto: data.petPhoto ?? data.PetPhoto ?? undefined,
            lastMessage: "",
            date: "",
            initialMessages: [],
            kind: "adoption",
          };
          if (fallbackContact.otherUserId > 0) {
            setContacts((prev) => {
              const exists = prev.some((c) => c.conversationId === fallbackContact.conversationId);
              return exists ? prev : [...prev, fallbackContact];
            });
            setActiveChat(fallbackContact);
            await fetchConversation(fallbackContact.conversationId);
            return;
          }
        } catch {
          return;
        }
        return;
      }
      setActiveChat(contact);
      await fetchConversation(contact.conversationId);
    };

    void openChatFromQuery();
  }, [contacts, fetchConversation, queryConversationId, hasAuth]);

  useEffect(() => {
    if (!activeChat) return;
    void fetchConversation(activeChat.conversationId);
    const interval = setInterval(() => {
      void fetchConversation(activeChat.conversationId);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChat, fetchConversation]);

  const handleAction = async (req: MatchRequest, action: "accepted" | "declined") => {
    try {
      const endpoint = action === "accepted" ? "accept" : "decline";
      const basePath = req.kind === "adoption" ? "/AdoptionRequests" : "/MatchRequests";
      await api.post(`${basePath}/${req.id}/${endpoint}`);
      setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: action } : r));
      await loadData();
      toast.success(`Request ${action}`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update request";
      toast.error(message);
    }
  };

  if (activeChat) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Chat about <span className="font-medium text-foreground">{activeChat.petName}</span>
          </p>
        </div>
        <ChatWindow
          conversationId={activeChat.conversationId}
          recipientName={activeChat.userName}
          recipientAvatar={activeChat.userAvatar}
          initialMessages={chatMessages}
          onSendMessage={async (content) => {
            if (!hasAuth) {
              throw new Error("No user");
            }
            const senderUserId = resolvedUserId ?? 0;
            const response = await api.post("/Notifications/message", {
              senderUserId,
              receiverUserId: activeChat.otherUserId,
              content,
              conversationId: activeChat.conversationId,
              relatedId: activeChat.conversationId,
            });
            await fetchConversation(activeChat.conversationId);
            return {
              id: String(response.data?.id ?? `msg-${Date.now()}`),
              senderId: String(senderUserId),
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

  const filteredContacts = contacts.filter((c) =>
    c.userName.toLowerCase().includes(search.toLowerCase()) || c.petName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Pet Matching</h1>

      <Tabs defaultValue={queryTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {requests.filter((r) => r.status === "pending").length > 0 && (
              <Badge className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                {requests.filter((r) => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search chats…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filteredContacts.length === 0 ? (
            <EmptyState title="No chats yet" description="Match with other pet owners to start chatting." icon={<MessageCircle className="h-8 w-8 text-muted-foreground" />} />
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((c) => (
                <Card
                  key={c.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={async () => {
                    setActiveChat(c);
                    if (!hasAuth) return;
                    await fetchConversation(c.conversationId);
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      {c.userAvatar ? (
                        <img src={c.userAvatar} alt={c.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-heading font-bold text-sm text-muted-foreground">{c.userName.charAt(0)}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{c.userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.petName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{c.date}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {requests.length === 0 ? (
            <EmptyState title="No requests" description="Browse pets to send match requests." icon={<Heart className="h-8 w-8 text-muted-foreground" />} />
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {req.petPhoto ? (
                        <img src={req.petPhoto} alt={req.petName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><PawPrint className="h-5 w-5 text-muted-foreground/40" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {req.kind === "adoption"
                          ? `${req.fromUser} wants to adopt ${req.petName}`
                          : `${req.fromUser} wants to match with ${req.petName}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{req.date}</p>
                    </div>
                    {req.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs bg-success/10 text-success border-success/20 hover:bg-success/20" onClick={() => handleAction(req, "accepted")}>
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleAction(req, "declined")}>
                          <XCircle className="mr-1 h-3 w-3" /> Decline
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={req.status === "accepted" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                          {req.status}
                        </Badge>
                        {req.status === "accepted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={async () => {
                              const contact = contacts.find((c) => c.conversationId === req.id);
                              if (contact) {
                                setActiveChat(contact);
                                return;
                              }
                              try {
                                const basePath = req.kind === "adoption" ? "/AdoptionRequests/chats" : "/MatchRequests/chats";
                                const chatRes = await api.get(basePath, {
                                  params: resolvedUserId ? { userId: resolvedUserId } : undefined,
                                });
                                const chatRows = Array.isArray(chatRes.data) ? chatRes.data : [];
                                const mappedChats = chatRows.map((c: any) => ({
                                  id: String(c.conversationId ?? c.ConversationId ?? ""),
                                  conversationId: String(c.conversationId ?? c.ConversationId ?? ""),
                                  otherUserId: Number(c.otherUserId ?? c.OtherUserId ?? 0),
                                  userName: c.otherUserName ?? c.OtherUserName ?? "User",
                                  petName: c.petName ?? c.PetName ?? "Pet",
                                  petPhoto: c.petPhoto ?? c.PetPhoto ?? undefined,
                                  lastMessage: "",
                                  date: "",
                                  initialMessages: [],
                                  kind: req.kind,
                                }));
                                setContacts((prev) => {
                                  const merged = [...prev.filter((c) => c.kind !== req.kind), ...mappedChats];
                                  return merged;
                                });
                                const refreshed = mappedChats.find((c) => c.conversationId === req.id);
                                if (refreshed) {
                                  setActiveChat(refreshed);
                                  return;
                                }
                                if (req.kind === "adoption") {
                                  const adoptionRes = await api.get(`/AdoptionRequests/${req.id}`, {
                                    params: resolvedUserId ? { userId: resolvedUserId } : undefined,
                                  });
                                  const data = adoptionRes.data || {};
                                  const fallbackContact: MatchContact = {
                                    id: String(data.conversationId ?? data.ConversationId ?? req.id),
                                    conversationId: String(data.conversationId ?? data.ConversationId ?? req.id),
                                    otherUserId: Number(data.otherUserId ?? data.OtherUserId ?? 0),
                                    userName: data.otherUserName ?? data.OtherUserName ?? "User",
                                    petName: data.petName ?? data.PetName ?? "Pet",
                                    petPhoto: data.petPhoto ?? data.PetPhoto ?? undefined,
                                    lastMessage: "",
                                    date: "",
                                    initialMessages: [],
                                    kind: "adoption",
                                  };
                                  if (fallbackContact.otherUserId > 0) {
                                    setContacts((prev) => {
                                      const exists = prev.some((c) => c.conversationId === fallbackContact.conversationId);
                                      return exists ? prev : [...prev, fallbackContact];
                                    });
                                    setActiveChat(fallbackContact);
                                  }
                                }
                              } catch {
                                toast.error("Failed to load chats");
                              }
                            }}
                          >
                            Open Chat
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PetMatching;
