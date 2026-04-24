export type SpeciesInfo = {
  name: "Dog" | "Cat";
  description: string;
  lifespan: string;
  care_level: "low" | "medium" | "high";
  common_issues: string[];
};

export type BreedInfo = {
  pet_type: "dog" | "cat";
  name: string;
  size?: "small" | "medium" | "large";
  temperament: string;
  energy_level: "low" | "medium" | "high";
  good_for?: string;
  grooming?: "low" | "medium" | "high";
  lifespan: string;
};

export type HealthIssueInfo = {
  species: "dog" | "cat";
  name: string;
  symptoms: string[];
  treatment: string;
  severity: "low" | "medium" | "high";
};

export type FoodInfo = {
  safe_foods: string[];
  dangerous_foods: string[];
  feeding_times: string;
};

export type BehaviorInfo = {
  pet_type: "dog" | "cat";
  behavior: string;
  meaning: string;
  solution: string;
};

export const PET_KNOWLEDGE = {
  species: [
    {
      name: "Dog",
      description: "Dogs are loyal, social animals that require attention, exercise, and training.",
      lifespan: "10-15 years",
      care_level: "medium",
      common_issues: ["obesity", "fleas", "hip dysplasia"],
    },
    {
      name: "Cat",
      description: "Cats are independent but affectionate pets that prefer clean environments and routine feeding.",
      lifespan: "12-18 years",
      care_level: "low",
      common_issues: ["urinary infections", "hairballs", "obesity"],
    },
  ] satisfies SpeciesInfo[],
  breeds: [
    {
      pet_type: "dog",
      name: "Labrador Retriever",
      size: "large",
      temperament: "friendly, intelligent, active",
      energy_level: "high",
      good_for: "families",
      lifespan: "10-12 years",
    },
    {
      pet_type: "dog",
      name: "German Shepherd",
      size: "large",
      temperament: "loyal, protective, intelligent",
      energy_level: "high",
      good_for: "security, training",
      lifespan: "9-13 years",
    },
    {
      pet_type: "cat",
      name: "Persian",
      size: "medium",
      temperament: "calm, affectionate",
      energy_level: "low",
      grooming: "high",
      lifespan: "12-17 years",
    },
    {
      pet_type: "cat",
      name: "Siamese",
      size: "medium",
      temperament: "social, vocal, intelligent",
      energy_level: "high",
      lifespan: "12-20 years",
    },
  ] satisfies BreedInfo[],
  health_issues: [
    {
      species: "dog",
      name: "Parvovirus",
      symptoms: ["vomiting", "diarrhea", "loss of appetite"],
      treatment: "Immediate vet care, fluids, vaccination prevention",
      severity: "high",
    },
    {
      species: "dog",
      name: "Fleas",
      symptoms: ["itching", "hair loss", "skin redness"],
      treatment: "anti-flea shampoo, medication",
      severity: "medium",
    },
    {
      species: "cat",
      name: "Urinary Tract Infection",
      symptoms: ["frequent urination", "pain", "blood in urine"],
      treatment: "antibiotics from vet",
      severity: "high",
    },
  ] satisfies HealthIssueInfo[],
  food: {
    dog: {
      safe_foods: ["chicken", "rice", "carrots", "pumpkin"],
      dangerous_foods: ["chocolate", "onion", "garlic", "grapes"],
      feeding_times: "2 times per day",
    },
    cat: {
      safe_foods: ["chicken", "fish", "turkey"],
      dangerous_foods: ["chocolate", "onion", "raw dough"],
      feeding_times: "2-3 times per day",
    },
  } satisfies Record<"dog" | "cat", FoodInfo>,
  behaviors: [
    {
      pet_type: "dog",
      behavior: "barking",
      meaning: "attention, alert, boredom",
      solution: "training, exercise, ignore excessive barking",
    },
    {
      pet_type: "cat",
      behavior: "scratching furniture",
      meaning: "territory marking or nail care",
      solution: "provide scratching post",
    },
  ] satisfies BehaviorInfo[],
} as const;

