
import { z } from 'zod';

export type PlanId = "hourly" | "daily" | "weekly" | "monthly";

export type PricingConfig = {
  isPromoActive: boolean;
  prices: {
    [key in PlanId]: {
      base: number;
      promo: number;
    };
  };
};

export type PromoCode = {
    id: string;
    titre: string;
    code: string;
    plan: PlanId | "tous";
    pourcentage: number;
    debutdate: unknown; // Firebase Timestamp
    findate: unknown; // Firebase Timestamp
    tous: boolean;
    max: number; // Maximum number of users
    people: string[]; // Array of user UIDs who have used the code
};

export const SuggestBettingStrategyOutputSchema = z.object({
  conservativeStrategy: z.string().describe('Une stratégie de pari conservatrice.'),
  aggressiveStrategy: z.string().describe('Une stratégie de pari agressive.'),
});

export type SinglePrediction = {
  time: string;
  predictedCrashPoint: number;
};
