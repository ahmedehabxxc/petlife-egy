export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  specialties: string[];
}

export const clinics: Clinic[] = [
  {
    id: "cl1",
    name: "Cairo Pet Care",
    address: "15 Hassan Sabry St, Zamalek, Cairo",
    phone: "+20 100 123 4567",
    hours: "Sat-Thu 9AM-8PM",
    lat: 30.0561,
    lng: 31.2243,
    specialties: ["General", "Vaccination"],
  },
  {
    id: "cl2",
    name: "Giza Vet Clinic",
    address: "42 Tahrir St, Dokki, Giza",
    phone: "+20 100 234 5678",
    hours: "Daily 10AM-9PM",
    lat: 30.0384,
    lng: 31.212,
    specialties: ["Surgery", "Emergency"],
  },
  {
    id: "cl3",
    name: "Pet Skin Center",
    address: "8 Abbas El-Akkad St, Nasr City",
    phone: "+20 100 345 6789",
    hours: "Sat-Thu 10AM-6PM",
    lat: 30.0626,
    lng: 31.3376,
    specialties: ["Dermatology"],
  },
  {
    id: "cl4",
    name: "Smile Paws Clinic",
    address: "22 Cleopatra St, Heliopolis",
    phone: "+20 100 456 7890",
    hours: "Sat-Wed 9AM-7PM",
    lat: 30.087,
    lng: 31.323,
    specialties: ["Dentistry", "General"],
  },
  {
    id: "cl5",
    name: "PetVet Alexandria",
    address: "5 Victor Emmanuel St, Smouha",
    phone: "+20 100 567 8901",
    hours: "Daily 8AM-10PM",
    lat: 31.2156,
    lng: 29.9553,
    specialties: ["General", "Internal Medicine"],
  },
];

const toRadians = (deg: number) => (deg * Math.PI) / 180;

export function distanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

export function findNearestClinic(lat: number, lng: number): Clinic | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  let nearest: { clinic: Clinic; distance: number } | null = null;
  for (const clinic of clinics) {
    const distance = distanceInKm(lat, lng, clinic.lat, clinic.lng);
    if (!nearest || distance < nearest.distance) nearest = { clinic, distance };
  }
  return nearest?.clinic ?? null;
}
