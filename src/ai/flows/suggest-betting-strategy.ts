'use server';

/**
 * @fileOverview Ce fichier définit un flux Genkit pour suggérer des stratégies de pari basées sur la tolérance au risque de l'utilisateur et le point de crash prédit.
 *
 * - suggestBettingStrategy - Une fonction qui prend la tolérance au risque et le point de crash prédit comme entrées et renvoie des stratégies de pari suggérées.
 * - SuggestBettingStrategyInput - Le type d'entrée pour la fonction suggestBettingStrategy.
 * - SuggestBettingStrategyOutput - Le type de retour pour la fonction suggestBettingStrategy.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SuggestBettingStrategyOutputSchema } from '@/types';

const SuggestBettingStrategyInputSchema = z.object({
  riskTolerance: z
    .string()
    .describe(
      "La tolérance au risque de l'utilisateur, peut être Faible, Modéré, Élevé, ou Très élevé."
    ),
  predictedCrashPoint: z
    .number()
    .describe('Le point de crash prédit pour le jeu.'),
});

export type SuggestBettingStrategyInput = z.infer<
  typeof SuggestBettingStrategyInputSchema
>;

export type SuggestBettingStrategyOutput = z.infer<
  typeof SuggestBettingStrategyOutputSchema
>;

export async function suggestBettingStrategy(
  input: SuggestBettingStrategyInput
): Promise<SuggestBettingStrategyOutput> {
  return suggestBettingStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBettingStrategyPrompt',
  input: {schema: SuggestBettingStrategyInputSchema},
  output: {schema: SuggestBettingStrategyOutputSchema},
  prompt: `Vous êtes un expert en conseil de stratégies de pari pour les jeux de crash comme Aviator et Lucky Jet.

  En fonction de la tolérance au risque de l'utilisateur (qui est la même que le niveau de risque sélectionné pour la prédiction) et du point de crash prédit, suggérez une stratégie de pari conservatrice et une stratégie agressive.

  Tolérance au risque : {{{riskTolerance}}}
  Point de crash prédit : {{{predictedCrashPoint}}}x

  Considérez ces facteurs lors de la création des stratégies :
    - Les stratégies conservatrices devraient viser des gains faibles mais constants avec un risque minimal. Un retrait automatique juste avant le crash prédit est une bonne base.
    - Les stratégies agressives devraient viser des gains plus importants mais avec un risque plus élevé, par exemple en visant légèrement au-delà du crash prédit ou en utilisant une partie de la mise pour un objectif plus élevé.
    - Adaptez l'agressivité des conseils à la tolérance au risque de l'utilisateur. Pour un risque "Faible", même la stratégie "agressive" doit rester prudente. Pour un risque "Très élevé", la stratégie "conservatrice" peut être plus audacieuse que la normale.
    - Soyez concis et donnez des conseils pratiques et actionnables.

  La tolérance au risque sera l'une des suivantes : Faible, Modéré, Élevé, Très élevé.
  Le point de crash prédit sera un nombre supérieur à 1.

  Ne mentionnez pas "Stratégie Conservatrice :" ou "Stratégie Agressive :" dans votre réponse, fournissez directement l'explication.
  `,
});

const suggestBettingStrategyFlow = ai.defineFlow(
  {
    name: 'suggestBettingStrategyFlow',
    inputSchema: SuggestBettingStrategyInputSchema,
    outputSchema: SuggestBettingStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);