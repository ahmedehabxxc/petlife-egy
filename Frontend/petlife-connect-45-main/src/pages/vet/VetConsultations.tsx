import { useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useConsultationStore } from "@/stores/consultationStore";
import type { ChatMessage } from "@/hooks/useSignalR";
import type { ConsultationRequest } from "@/types";

const statusColors: Record<string, string> = {
  accepted: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  declined: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-muted text-muted-foreground",
};

const VetConsultations = () => {
  const { requests, updateStatus } = useConsultationStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [activeChat, setActiveChat] = useState<ConsultationRequest | null>(null);

  // Filter requests for this vet (using v1 as demo)
  const vetRequests = requests.filter((r) => r.vetId === "v1");

  const filtered = vetRequests.filter((r) => {
    const matchesSearch =
      r.petName.toLowerCase().includes(search.toLowerCase()) ||
      r.petOwnerName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleAccept = (id: string) => {
    updateStatus(id, "accepted");
    toast.success("Consultation accepted! You can now chat with the pet owner.");
  };

  const handleDecline = (id: string) => {
    updateStatus(id, "declined");
    toast.info("Consultation request declined.");
  };

  if (activeChat) {
    const initialMessages: ChatMessage[] = [
      {
        id: "sys1",
        senderId: "system",
        senderName: "System",
        content: `Consultation started for ${activeChat.petName} (${activeChat.petSpecies})`,
        timestamp: new Date().toISOString(),
        type: "system",
      },
    ];

    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Consultation with{" "}
            <span className="font-medium text-foreground">{activeChat.petOwnerName}</span> about{" "}
            <span className="font-medium text-foreground">{activeChat.petName}</span> ({activeChat.petSpecies})
          </p>
        </div>
        <ChatWindow
          conversationId={`consultation-${activeChat.id}`}
          recipientName={activeChat.petOwnerName}
          recipientAvatar={activeChat.petOwnerAvatar}
          initialMessages={initialMessages}
          onBack={() => setActiveChat(null)}
        />
      </div>
    );
  }

  const pendingCount = vetRequests.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Consultations</h1>
        {pendingCount > 0 && (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by pet or owner…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "accepted", "completed"].map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No consultations found.</div>
        ) : (
          filtered.map((req) => (
            <Card key={req.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {req.petOwnerAvatar ? (
                    <img src={req.petOwnerAvatar} alt={req.petOwnerName} className="w-full h-full object-cover" />
                  ) : (
                    <MessageCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{req.petName}</span>
                    <span className="text-xs text-muted-foreground">({req.petSpecies})</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Owner: {req.petOwnerName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                      <DollarSign className="h-3 w-3 mr-0.5" />
                      {req.fee} EGP
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={statusColors[req.status]}>{req.status}</Badge>
                  {req.status === "pending" && (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs bg-success/10 text-success border-success/20 hover:bg-success/20"
                        onClick={() => handleAccept(req.id)}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => handleDecline(req.id)}
                      >
                        <XCircle className="mr-1 h-3 w-3" /> Decline
                      </Button>
                    </div>
                  )}
                  {req.status === "accepted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setActiveChat(req)}
                    >
                      <MessageCircle className="mr-1 h-3 w-3" /> Chat
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VetConsultations;
