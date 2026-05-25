import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  specialties: string[];
}

const clinics: Clinic[] = [
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

const ClinicFinder = () => {
  const openNearbySearch = () => {
    const fallback = () => {
      window.open("https://www.google.com/maps/search/?api=1&query=veterinary+clinic", "_blank");
    };

    if (!navigator.geolocation) {
      fallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center = `${pos.coords.latitude},${pos.coords.longitude}`;
        window.open(
          `https://www.google.com/maps/search/?api=1&query=veterinary+clinic&center=${center}`,
          "_blank"
        );
      },
      fallback
    );
  };

  const openDirections = (lat: number, lng: number) => {
    if (!navigator.geolocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}`,
          "_blank"
        );
      },
      () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
      }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Find a Clinic</h1>

      <Card>
        <CardHeader>
          <CardTitle>Use GPS to find clinics nearby</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Open your maps app with your current location and search for nearby vet clinics.
          </p>
          <Button onClick={openNearbySearch}>
            <Navigation className="mr-2 h-4 w-4" /> Open GPS
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clinics.map((clinic) => (
          <Card key={clinic.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <h3 className="font-heading font-bold text-base mb-2">{clinic.name}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" /> {clinic.address}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" /> {clinic.phone}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" /> {clinic.hours}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {clinic.specialties.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => openDirections(clinic.lat, clinic.lng)}
              >
                <Navigation className="mr-2 h-3 w-3" /> Get Directions
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClinicFinder;
