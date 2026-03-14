import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { PawPrint, Search, Stethoscope, ShoppingBag, ArrowRight } from "lucide-react";

const features = [
  {
    icon: PawPrint,
    title: "Pet Management",
    desc: "Register & manage your pets, track medical history, and list for adoption.",
    link: "/pets",
  },
  {
    icon: Search,
    title: "Pet Matching",
    desc: "Browse pets, find matches nearby, and connect with other pet owners.",
    link: "/browse",
  },
  {
    icon: Stethoscope,
    title: "Vet Services",
    desc: "Find veterinarians, start consultations, and get medical advice.",
    link: "/vets",
  },
  {
    icon: ShoppingBag,
    title: "Pet Shop",
    desc: "Browse products, order supplies, and track deliveries.",
    link: "/shop",
  },
];

const Index = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16 md:py-24 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <PawPrint className="h-4 w-4" />
            Egypt's #1 Pet Platform
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Everything Your Pet Needs,{" "}
            <span className="text-primary">In One Place</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Manage your pets, find vets, shop supplies, and connect with other pet lovers across Egypt.
          </p>
          <div className="flex justify-center gap-3">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => navigate("/pets")}>
                Go to My Pets <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate("/register")}>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-16 px-4">
        <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(f.link)}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
