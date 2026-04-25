import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { clinics, distanceInKm } from "@/lib/clinics";

const ClinicFinder = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const userLat = Number.parseFloat(searchParams.get("lat") ?? "");
  const userLng = Number.parseFloat(searchParams.get("lng") ?? "");
  const typedLocation = (searchParams.get("location") ?? "").trim().toLowerCase();
  const cameFromChatbot = searchParams.get("fromChatbot") === "1";
  const hasUserCoordinates = Number.isFinite(userLat) && Number.isFinite(userLng);

  const nearestClinicId = useMemo(() => {
    if (!hasUserCoordinates) return null;
    let nearest: { id: string; distance: number } | null = null;
    for (const clinic of clinics) {
      const distance = distanceInKm(userLat, userLng, clinic.lat, clinic.lng);
      if (!nearest || distance < nearest.distance) {
        nearest = { id: clinic.id, distance };
      }
    }
    return nearest?.id ?? null;
  }, [hasUserCoordinates, userLat, userLng]);

  const clinicsForDisplay = useMemo(() => {
    if (!hasUserCoordinates && !typedLocation) return clinics;
    if (typedLocation) {
      return [...clinics].sort((a, b) => {
        const aMatch = `${a.name} ${a.address}`.toLowerCase().includes(typedLocation) ? 0 : 1;
        const bMatch = `${b.name} ${b.address}`.toLowerCase().includes(typedLocation) ? 0 : 1;
        return aMatch - bMatch;
      });
    }
    return [...clinics].sort((a, b) => {
      const d1 = distanceInKm(userLat, userLng, a.lat, a.lng);
      const d2 = distanceInKm(userLat, userLng, b.lat, b.lng);
      return d1 - d2;
    });
  }, [hasUserCoordinates, typedLocation, userLat, userLng]);

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

      {cameFromChatbot && (nearestClinicId || typedLocation) && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="py-4 text-sm">
            {nearestClinicId
              ? "Nearest clinic based on your location is highlighted below."
              : "Showing clinics that best match the location you typed in chat."}
          </CardContent>
        </Card>
      )}

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
        {clinicsForDisplay.map((clinic) => (
          <Card
            key={clinic.id}
            className={`hover:shadow-md transition-shadow ${nearestClinicId === clinic.id ? "border-primary ring-1 ring-primary/40" : ""}`}
          >
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
                {nearestClinicId === clinic.id && (
                  <Badge className="text-xs">Nearest</Badge>
                )}
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
