// ===== User & Auth =====
export type UserRole = "pet_owner" | "veterinarian" | "shop_owner" | "admin";

export type AccountStatus = "active" | "pending_approval" | "rejected";

export interface User {
  id: string;
  authId?: string;
  userId?: number;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
}

export interface VetRegistrationData {
  licenseNumber: string;
  specialty: string;
  clinicName: string;
  yearsOfExperience: number;
  documents: string[]; // file names
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
}

// ===== Pets =====
export type PetSpecies = "dog" | "cat" | "bird" | "rabbit" | "fish" | "other";

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age: number;
  gender: "male" | "female" | "unknown";
  photo?: string;
  description?: string;
  isAdoption: boolean;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  vetId: string;
  vetName: string;
  date: string;
  recordType?: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescription?: string;
  consultationId?: string;
  vaccineName?: string;
  nextDueDate?: string;
}

export interface VaccinationLog {
  id: string;
  petId: string;
  vaccineName: string;
  date: string;
  nextDueDate?: string;
  notes?: string;
}

// ===== Veterinarian =====
export interface Veterinarian {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  specialty: string;
  clinicName: string;
  clinicAddress: string;
  phone: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isOnline?: boolean;
  consultationFee: number;
  availableHours?: string;
  lat?: number;
  lng?: number;
}

// ===== Consultation Requests =====
export type ConsultationRequestStatus = "pending" | "accepted" | "in_progress" | "declined" | "completed";

export interface ConsultationRequest {
  id: string;
  petOwnerId: string;
  petOwnerName: string;
  petOwnerAvatar?: string;
  vetId: string;
  vetUserId?: number;
  vetName: string;
  vetAvatar?: string;
  petId: string;
  petName: string;
  petSpecies: string;
  fee: number;
  status: ConsultationRequestStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

// ===== Products & Cart =====
export interface Product {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// ===== Orders =====
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
}

// ===== Notifications =====
export interface Notification {
  id: string;
  userId?: string;
  senderId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: string;
  actionUrl?: string;
  conversationId?: string;
  relatedId?: string;
}

// ===== Match =====
export type MatchStatus = "pending" | "accepted" | "declined";

export interface MatchRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  petId: string;
  petName: string;
  petPhoto?: string;
  status: MatchStatus;
  createdAt: string;
}
