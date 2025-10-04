
'use server';

/**
 * @fileOverview Prédit le prochain point de crash dans les jeux de crash en utilisant l'analyse par IA.
 *
 * - predictCrashPoint - Prédit le point de crash en fonction des données historiques et de l'état actuel du jeu.
 * - PredictCrashPointInput - Type d'entrée pour la fonction predictCrashPoint.
 * - PredictCrashPointOutput - Type de sortie pour la fonction predictCrashPoint.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { doc, setDoc, collection, serverTimestamp, getDoc, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { SuggestBettingStrategyOutputSchema } from '@/types';


const PredictCrashPointInputSchema = z.object({
  userId: z.string().describe("L'ID de l'utilisateur qui demande la prédiction."),
  gameName: z.string().describe("Le nom du jeu de crash (par exemple, Aviator, Lucky Jet, Rocket Queen, Astronaut, RocketX, Crash)."),
  gameData: z.array(z.number()).describe('Données historiques du jeu.'),
  riskLevel: z.string().describe("Niveau de risque défini par l'utilisateur (Faible, Modéré, Élevé, Très élevé)."),
  gameState: z.string().describe("L'état actuel du jeu (par exemple, multiplicateur actuel)."),
  userTime: z.string().describe("L'heure actuelle de l'utilisateur au format HH:MM."),
});
export type PredictCrashPointInput = z.infer<typeof PredictCrashPointInputSchema>;

const SinglePredictionSchema = z.object({
  time: z.string().describe("L'heure de la prédiction au format HH:MM."),
  predictedCrashPoint: z.number().describe('La cote (point de crash) prédite.'),
});

const SavedStrategySchema = SuggestBettingStrategyOutputSchema.extend({
    time: z.string(),
});

const PredictCrashPointOutputSchema = z.object({
  predictions: z.array(SinglePredictionSchema).describe('Une liste de prédictions de crash à venir.'),
  predictionId: z.string().optional().describe("L'ID du document de prédiction dans Firestore."),
  savedStrategies: z.array(SavedStrategySchema).optional().describe("Stratégies déjà sauvegardées pour cette prédiction."),
});
export type PredictCrashPointOutput = z.infer<typeof PredictCrashPointOutputSchema>;

export async function predictCrashPoint(input: PredictCrashPointInput): Promise<PredictCrashPointOutput> {
  return predictCrashPointFlow(input);
}

const predictCrashPointPrompt = ai.definePrompt({
  name: 'predictCrashPointPrompt',
  input: {schema: PredictCrashPointInputSchema},
  output: {schema: z.object({
      predictions: z.array(SinglePredictionSchema).describe('Une liste de prédictions de crash à venir.'),
  })},
  prompt: `Vous êtes une IA qui prédit les prochains points de crash pour le jeu de type "Crash" en se basant sur les données historiques et le facteur de risque.
  
Générez une liste de prédictions de crash à partir de l'heure actuelle de l'utilisateur ({{{userTime}}}) jusqu'à minuit (00:00). Chaque prédiction doit inclure une heure future (HH:MM) et une cote (point de crash) prédite.

Analysez les données suivantes pour prédire les prochains points de crash :

Données historiques du jeu : {{{gameData}}}
Niveau de risque : {{{riskLevel}}}
État actuel du jeu : {{{gameState}}}

Voici les règles strictes pour les cotes et les intervalles de temps en fonction du niveau de risque :

- "Faible": Prédire des cotes exclusivement entre 1.01x et 2.00x. L'intervalle de temps entre chaque prédiction doit être d'environ 3 minutes (avec une légère variation de 2 à 4 minutes).
- "Modéré": Prédire des cotes exclusivement entre 1.01x et 5.00x. L'intervalle de temps entre chaque prédiction doit être d'environ 7 minutes (avec une légère variation de 6 à 8 minutes).
- "Élevé": Prédire des cotes exclusivement entre 1.01x et 15.00x. L'intervalle de temps entre chaque prédiction doit être d'environ 20 minutes (avec une légère variation de 19 à 21 minutes).
- "Très élevé": Prédire des cotes audacieuses exclusivement entre 10.00x et 50.00x. L'intervalle de temps entre chaque prédiction doit être d'environ 1 heure (avec une légère variation de 58 à 62 minutes).

Assurez-vous que chaque prédiction dans la liste contient une heure valide et un point de crash numérique respectant scrupuleusement ces contraintes.`,
});

const predictCrashPointFlow = ai.defineFlow(
  {
    name: 'predictCrashPointFlow',
    inputSchema: PredictCrashPointInputSchema,
    outputSchema: PredictCrashPointOutputSchema,
  },
  async input => {
    // Créer un hash simple pour l'historique afin de vérifier les caches
    const historyHash = input.gameData.join('-');

    // Vérifier s'il existe une prédiction récente avec le même hash et niveau de risque
    const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
    const predictionsRef = collection(db, "predictions");
    const q = query(
        predictionsRef,
        where("historyHash", "==", historyHash),
        where("inputData.riskLevel", "==", input.riskLevel),
        where("createdAt", ">=", fiveMinutesAgo),
        orderBy("createdAt", "desc"),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const cachedPredictionDoc = querySnapshot.docs[0];
      const cachedData = cachedPredictionDoc.data();
      const now = new Date();
      
      const futurePredictions = cachedData.predictions.filter((p: { time: string }) => {
        const [hours, minutes] = p.time.split(':').map(Number);
        const predictionTime = new Date(now);
        predictionTime.setHours(hours, minutes, 0, 0);
        return predictionTime.getTime() > now.getTime();
      });

      if (futurePredictions.length > 0) {
        // Si on trouve des prédictions futures, on les réutilise
        const predictionRef = doc(collection(db, "predictions"));
        await setDoc(predictionRef, {
          predictions: futurePredictions,
          userId: input.userId,
          createdAt: serverTimestamp(),
          historyHash: historyHash, // On sauvegarde aussi le hash
          inputData: {
            gameName: input.gameName,
            riskLevel: input.riskLevel,
          },
          savedStrategies: [],
        });

        const docSnap = await getDoc(predictionRef);
        const data = docSnap.data();

        return { 
          predictions: futurePredictions,
          predictionId: predictionRef.id,
          savedStrategies: data?.savedStrategies || [],
        };
      }
    }
    
    let retries = 3;
    while (retries > 0) {
      try {
        const {output} = await predictCrashPointPrompt(input);
        if (output) {
          const predictionRef = doc(collection(db, "predictions"));
          await setDoc(predictionRef, {
            predictions: output.predictions,
            userId: input.userId,
            createdAt: serverTimestamp(),
            historyHash: historyHash, // Sauvegarde le hash pour la mise en cache
            inputData: {
              gameName: input.gameName,
              riskLevel: input.riskLevel,
            },
            savedStrategies: [], // Initialiser avec un tableau vide
          });
          
          const docSnap = await getDoc(predictionRef);
          const data = docSnap.data();

          return { 
            ...output, 
            predictionId: predictionRef.id,
            savedStrategies: data?.savedStrategies || [],
          };
        }
      } catch (error: any) {
        if (error.message.includes('503') && retries > 1) {
          console.log(`[predictCrashPointFlow] Model overloaded, retrying... (${3 - retries + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000));
        } else {
          throw error;
        }
      }
      retries--;
    }
    return { predictions: [] };
  }
);
