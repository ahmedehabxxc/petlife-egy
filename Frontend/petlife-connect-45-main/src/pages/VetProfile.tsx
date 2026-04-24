import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChatWindow from "@/components/ChatWindow";
import RequestConsultationDialog from "@/components/RequestConsultationDialog";
import VetAvailabilityCalendar from "@/components/VetAvailabilityCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle, Star, MapPin, Phone, ShieldCheck, Clock,
  ArrowLeft, Building2, Calendar, CreditCard, CalendarDays,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import type { Veterinarian } from "@/types";
import type { ChatMessage } from "@/hooks/useSignalR";
import api from "@/services/api";
import { toast } from "sonner";

const reviews = [
  { id: "1", author: "Mariam K.", avatar: "M", rating: 5, text: "Dr. Ahmed is amazing with my cat. Very gentle and thorough.", date: "Dec 20, 2024" },
  { id: "2", author: "Youssef S.", avatar: "Y", rating: 4, text: "Great vet, but the clinic can get crowded on weekends.", date: "Nov 15, 2024" },
  { id: "3", author: "Nadia R.", avatar: "N", rating: 5, text: "Diagnosed my dog's issue quickly. Highly recommended!", date: "Oct 8, 2024" },
];

const VetProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const resolvedUserId = user?.userId ?? (Number.isFinite(Number(user?.id)) ? Number(user?.id) : null);
  const [vet, setVet] = useState<Veterinarian | null>(null);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const loadVet = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await api.get(`/Veterinarians/${id}`);
        const data = response.data || {};
        const mapped: Veterinarian = {
          id: String(data.id ?? data.Id ?? id),
          userId: String(data.userId ?? data.UserId ?? ""),
          name: data.name ?? data.Name ?? "Veterinarian",
          avatar: data.avatar ?? data.Avatar ?? undefined,
          specialty: data.specialty ?? data.Specialty ?? "General Practice",
          clinicName: data.clinicName ?? data.ClinicName ?? "Clinic",
          clinicAddress: data.clinicAddress ?? data.ClinicAddress ?? "",
          phone: data.phone ?? data.Phone ?? "",
          rating: Number(data.rating ?? data.Rating ?? 0),
          reviewCount: Number(data.reviewCount ?? data.ReviewCount ?? 0),
          isVerified: Boolean(data.isVerified ?? data.IsVerified ?? false),
          isOnline: Boolean(data.isOnline ?? data.IsOnline ?? false),
          consultationFee: Number(data.consultationFee ?? data.ConsultationFee ?? 150),
          lat: data.lat ?? data.Lat ?? undefined,
          lng: data.lng ?? data.Lng ?? undefined,
        };
        setVet(mapped);
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to load vet";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadVet();
  }, [id]);

  useEffect(() => {
    const loadConsultations = async () => {
      if (!resolvedUserId) return;
      try {
        const response = await api.get("/Consultations/for-owner", {
          params: { userId: resolvedUserId },
        });
        setConsultations(Array.isArray(response.data) ? response.data : []);
      } catch {
        // ignore
      }
    };
    void loadConsultations();
  }, [resolvedUserId]);

  const acceptedRequest = useMemo(() => {
    if (!vet) return null;
    return consultations.find(
      (r) => String(r.vetId ?? r.VetId ?? "") === String(vet.id) && (r.status ?? r.Status) === "accepted"
    );
  }, [consultations, vet]);

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
    if (!showChat || !acceptedRequest) return;
    const conversationId = String(acceptedRequest.id ?? acceptedRequest.Id);
    void fetchConversation(conversationId);
    const interval = setInterval(() => {
      void fetchConversation(conversationId);
    }, 3000);
    return () => clearInterval(interval);
  }, [acceptedRequest, showChat]);

  if (showChat && acceptedRequest && vet) {
    const conversationId = String(acceptedRequest.id ?? acceptedRequest.Id);
    const vetUserId = Number(acceptedRequest.vetUserId ?? acceptedRequest.VetUserId ?? 0);
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Consultation with <span className="font-medium text-foreground">{vet.name}</span> — {vet.specialty}
          </p>
        </div>
        <ChatWindow
          conversationId={conversationId}
          recipientName={vet.name}
          recipientAvatar={vet.avatar}
          initialMessages={chatMessages}
          onSendMessage={async (content) => {
            if (!resolvedUserId || !vetUserId) {
              throw new Error("Missing user");
            }
            const response = await api.post("/Notifications/message", {
              senderUserId: resolvedUserId,
              receiverUserId: vetUserId,
              content,
              conversationId,
              relatedId: conversationId,
            });
            await fetchConversation(conversationId);
            return {
              id: String(response.data?.id ?? `msg-${Date.now()}`),
              senderId: String(resolvedUserId),
              senderName: "You",
              content,
              timestamp: new Date().toISOString(),
              type: "text",
            };
          }}
          onBack={() => setShowChat(false)}
        />
      </div>
    );
  }

  if (loading || !vet) {
    return <div className="text-center py-12 text-muted-foreground">Loading vet…</div>;
  }

  const avgRating = vet.rating;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        onClick={() => navigate("/vets")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Button>

      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-0">
          <div className="h-24 bg-gradient-to-r from-primary/15 via-primary/8 to-secondary/10 relative" />

          <div className="px-6 pb-6 -mt-12">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative flex-shrink-0">
                <div className="h-24 w-24 rounded-2xl bg-card overflow-hidden ring-4 ring-card shadow-lg">
                  {vet.avatar ? (
                    <img src={vet.avatar} alt={vet.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <span className="font-heading font-bold text-3xl text-primary/60">{vet.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                {vet.isVerified && (
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-secondary flex items-center justify-center ring-3 ring-card">
                    <ShieldCheck className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 sm:pt-14">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="font-heading text-2xl font-bold leading-tight">{vet.name}</h1>
                    <p className="text-muted-foreground mt-0.5">{vet.specialty}</p>
                  </div>
                  {vet.isVerified && (
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 gap-1 flex-shrink-0">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className={vet.isOnline ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                    {vet.isOnline ? "Online now" : "Offline"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-accent fill-accent" />
                    <span className="font-bold text-foreground">{avgRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({vet.reviewCount} reviews)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    {vet.clinicAddress}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    {vet.phone}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-primary">{vet.consultationFee}</span>
                <span className="text-sm text-muted-foreground font-medium">EGP / consultation</span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                {acceptedRequest ? (
                  <Button className="rounded-full gap-2 flex-1 sm:flex-initial" onClick={() => setShowChat(true)}>
                    <MessageCircle className="h-4 w-4" /> Open Chat
                  </Button>
                ) : (
                  <RequestConsultationDialog
                    vet={vet}
                    trigger={
                      <Button className="rounded-full gap-2 flex-1 sm:flex-initial shadow-sm">
                        <MessageCircle className="h-4 w-4" /> Request Consultation
                      </Button>
                    }
                  />
                )}
                <Button variant="outline" className="rounded-full gap-2" onClick={() => navigate("/clinics")}>
                  <MapPin className="h-4 w-4" /> Map
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="font-heading font-bold text-lg">Clinic Details</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: Building2, label: "Clinic Name", value: vet.clinicName },
              { icon: MapPin, label: "Address", value: vet.clinicAddress },
              { icon: Clock, label: "Working Hours", value: "Sat–Thu: 9:00 AM – 8:00 PM" },
              { icon: CreditCard, label: "Consultation Fee", value: `${vet.consultationFee} EGP`, highlight: true },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted/70 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                  <p className={`text-sm ${item.highlight ? "font-bold text-primary" : "font-medium text-foreground"}`}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-9 w-9 rounded-xl bg-secondary/10 flex items-center justify-center">
              <CalendarDays className="h-4.5 w-4.5 text-secondary" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg">Availability</h2>
              <p className="text-xs text-muted-foreground">Select a date & time to book</p>
            </div>
          </div>
          <VetAvailabilityCalendar vetName={vet.name} consultationFee={vet.consultationFee} />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-accent/20 flex items-center justify-center">
                <Star className="h-4.5 w-4.5 text-accent fill-accent" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg">Patient Reviews</h2>
                <p className="text-xs text-muted-foreground">{vet.reviewCount} reviews</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(avgRating) ? "text-accent fill-accent" : "text-muted"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{avgRating.toFixed(1)} average</p>
            </div>
          </div>

          <div className="space-y-1">
            {reviews.map((review, i) => (
              <div key={review.id}>
                {i > 0 && <Separator className="my-4" />}
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="font-heading font-bold text-sm text-muted-foreground">
                      {review.avatar}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-sm">{review.author}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {review.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-3 w-3 ${j < review.rating ? "text-accent fill-accent" : "text-muted"}`} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VetProfile;
