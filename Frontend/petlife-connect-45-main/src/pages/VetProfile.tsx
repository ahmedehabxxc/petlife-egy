import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { useConsultationStore } from "@/stores/consultationStore";
import type { Veterinarian } from "@/types";
import type { ChatMessage } from "@/hooks/useSignalR";

const mockVet: Veterinarian = {
  id: "v1", userId: "u1", name: "Dr. Ahmed Hassan",
  avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop",
  specialty: "General Practice", clinicName: "Cairo Pet Care", clinicAddress: "15 Hassan Sabry St, Zamalek, Cairo",
  phone: "+20 100 123 4567", rating: 4.8, reviewCount: 124, isVerified: true, consultationFee: 150, lat: 30.0561, lng: 31.2243,
};

const reviews = [
  { id: "1", author: "Mariam K.", avatar: "M", rating: 5, text: "Dr. Ahmed is amazing with my cat. Very gentle and thorough.", date: "Dec 20, 2024" },
  { id: "2", author: "Youssef S.", avatar: "Y", rating: 4, text: "Great vet, but the clinic can get crowded on weekends.", date: "Nov 15, 2024" },
  { id: "3", author: "Nadia R.", avatar: "N", rating: 5, text: "Diagnosed my dog's issue quickly. Highly recommended!", date: "Oct 8, 2024" },
];

const VetProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { requests } = useConsultationStore();
  const [vet] = useState<Veterinarian>(mockVet);
  const [showChat, setShowChat] = useState(false);

  const acceptedRequest = requests.find(
    (r) => r.vetId === vet.id && r.petOwnerId === (user?.id || "demo-owner") && r.status === "accepted"
  );

  const initialMessages: ChatMessage[] = [
    { id: "sys1", senderId: "system", senderName: "System", content: `Consultation started with ${vet.name}`, timestamp: new Date().toISOString(), type: "system" },
  ];

  if (showChat && acceptedRequest) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Consultation with <span className="font-medium text-foreground">{vet.name}</span> — {vet.specialty}
          </p>
        </div>
        <ChatWindow
          conversationId={`consultation-${acceptedRequest.id}`}
          recipientName={vet.name}
          recipientAvatar={vet.avatar}
          initialMessages={initialMessages}
          onBack={() => setShowChat(false)}
        />
      </div>
    );
  }

  const avgRating = vet.rating;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        onClick={() => navigate("/vets")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Button>

      {/* Hero Card */}
      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-0">
          {/* Top gradient banner */}
          <div className="h-24 bg-gradient-to-r from-primary/15 via-primary/8 to-secondary/10 relative" />

          <div className="px-6 pb-6 -mt-12">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Avatar */}
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

              {/* Info */}
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
                </div>

                {/* Stats row */}
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

            {/* Action bar */}
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

      {/* Clinic Details */}
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

      {/* Availability Calendar */}
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

      {/* Reviews */}
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
            {/* Rating summary */}
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
