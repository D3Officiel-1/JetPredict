'use server';

/**
 * @fileOverview Ce fichier définit une fonction pour sauvegarder les stratégies de pari dans un document de prédiction existant sur Firestore.
 */

import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { z } from 'zod';
import { SuggestBettingStrategyOutputSchema } from '@/types';

const SaveStrategiesInputSchema = z.object({
  predictionId: z.string().describe("L'ID du document de prédiction dans Firestore."),
  predictionTime: z.string().describe("L'heure de la prédiction spécifique."),
  strategies: SuggestBettingStrategyOutputSchema,
});

export type SaveStrategiesInput = z.infer<typeof SaveStrategiesInputSchema>;

export async function saveStrategiesToPrediction(input: SaveStrategiesInput): Promise<void> {
  const { predictionId, strategies, predictionTime } = input;

  if (!predictionId) {
    console.error("Aucun ID de prédiction fourni. Impossible de sauvegarder les stratégies.");
    return;
  }

  try {
    const predictionRef = doc(db, "predictions", predictionId);
    
    // Ajoute les stratégies comme un nouvel objet dans un tableau 'savedStrategies'
    await updateDoc(predictionRef, {
      savedStrategies: arrayUnion({
        time: predictionTime,
        ...strategies,
        savedAt: new Date(),
      })
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des stratégies dans Firestore:", error);
    // Gérer l'erreur comme il se doit, peut-être en la renvoyant ou en la journalisant.
    throw new Error("Impossible de sauvegarder les stratégies dans la base de données.");
  }
}