import { create } from "zustand";
import type { ConsultationRequest, ConsultationRequestStatus } from "@/types";

interface ConsultationState {
  requests: ConsultationRequest[];
  addRequest: (req: ConsultationRequest) => void;
  updateStatus: (id: string, status: ConsultationRequestStatus) => void;
  getRequestsByPetOwner: (ownerId: string) => ConsultationRequest[];
  getRequestsByVet: (vetId: string) => ConsultationRequest[];
}

const mockRequests: ConsultationRequest[] = [
  {
    id: "cr1",
    petOwnerId: "owner1",
    petOwnerName: "Mariam K.",
    petOwnerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    vetId: "v1",
    vetName: "Dr. Ahmed Hassan",
    vetAvatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop",
    petId: "p1",
    petName: "Luna",
    petSpecies: "Cat",
    fee: 150,
    status: "accepted",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "cr2",
    petOwnerId: "owner2",
    petOwnerName: "Youssef S.",
    vetId: "v1",
    vetName: "Dr. Ahmed Hassan",
    vetAvatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop",
    petId: "p2",
    petName: "Max",
    petSpecies: "Dog",
    fee: 150,
    status: "pending",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "cr3",
    petOwnerId: "owner3",
    petOwnerName: "Nadia R.",
    vetId: "v1",
    vetName: "Dr. Ahmed Hassan",
    vetAvatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop",
    petId: "p3",
    petName: "Cleo",
    petSpecies: "Cat",
    fee: 150,
    status: "pending",
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
];

export const useConsultationStore = create<ConsultationState>((set, get) => ({
  requests: mockRequests,

  addRequest: (req) => set((s) => ({ requests: [...s.requests, req] })),

  updateStatus: (id, status) =>
    set((s) => ({
      requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)),
    })),

  getRequestsByPetOwner: (ownerId) =>
    get().requests.filter((r) => r.petOwnerId === ownerId),

  getRequestsByVet: (vetId) =>
    get().requests.filter((r) => r.vetId === vetId),
}));
