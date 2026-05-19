import { create } from "zustand";
import type { VetRegistrationData } from "@/types";

export type RegistrationStatus = "pending" | "approved" | "rejected";

export interface VetRegistration {
  id: string;
  userId: string;
  name: string;
  email: string;
  licenseNumber: string;
  specialty: string;
  clinicName: string;
  yearsOfExperience: number;
  documents: string[];
  status: RegistrationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

interface VetRegistrationState {
  registrations: VetRegistration[];
  addRegistration: (reg: VetRegistration) => void;
  updateStatus: (id: string, status: RegistrationStatus, note?: string) => void;
  getByUserId: (userId: string) => VetRegistration | undefined;
  getByEmail: (email: string) => VetRegistration | undefined;
}

const mockRegistrations: VetRegistration[] = [
  {
    id: "vr1", userId: "vet-pending-1", name: "Dr. Layla Nour", email: "layla@example.com",
    licenseNumber: "VET-EG-2024-5678", specialty: "Dentistry", clinicName: "Smile Paws Clinic",
    yearsOfExperience: 5, documents: ["vet_license.pdf", "university_degree.pdf"],
    status: "pending", submittedAt: "2025-01-04T10:00:00Z",
  },
  {
    id: "vr2", userId: "vet-pending-2", name: "Dr. Khaled Ibrahim", email: "khaled@example.com",
    licenseNumber: "VET-EG-2024-9012", specialty: "Surgery", clinicName: "Pet Surgery Center",
    yearsOfExperience: 8, documents: ["license.pdf"],
    status: "pending", submittedAt: "2025-01-03T10:00:00Z",
  },
  {
    id: "vr3", userId: "vet-1", name: "Dr. Ahmed Hassan", email: "vet@test.com",
    licenseNumber: "VET-EG-2023-1234", specialty: "General Practice", clinicName: "Cairo Pet Care",
    yearsOfExperience: 10, documents: ["license.pdf", "degree.pdf"],
    status: "approved", submittedAt: "2024-12-15T10:00:00Z", reviewedAt: "2024-12-16T10:00:00Z",
  },
];

export const useVetRegistrationStore = create<VetRegistrationState>((set, get) => ({
  registrations: mockRegistrations,

  addRegistration: (reg) =>
    set((s) => ({ registrations: [...s.registrations, reg] })),

  updateStatus: (id, status, note) =>
    set((s) => ({
      registrations: s.registrations.map((r) =>
        r.id === id ? { ...r, status, reviewedAt: new Date().toISOString(), reviewNote: note } : r
      ),
    })),

  getByUserId: (userId) => get().registrations.find((r) => r.userId === userId),

  getByEmail: (email) => get().registrations.find((r) => r.email === email),
}));
