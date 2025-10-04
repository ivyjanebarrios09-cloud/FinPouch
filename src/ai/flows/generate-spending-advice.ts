'use server';

/**
 * @fileOverview A flow to generate personalized spending advice based on user wallet activity.
 *
 * - generateSpendingAdvice - A function that generates spending advice.
 * - GenerateSpendingAdviceInput - The input type for the generateSpendingAdvice function.
 * - GenerateSpendingAdviceOutput - The return type for the generateSpendingAdvice function.
 */

import {ai} from '@/ai/genkit';
import { sleep } from '@/lib/utils';
import {z} from 'genkit';

const GenerateSpendingAdviceInputSchema = z.object({
  walletOpens: z
    .number()
    .describe('The number of times the user opened their wallet.'),
});
export type GenerateSpendingAdviceInput = z.infer<
  typeof GenerateSpendingAdviceInputSchema
>;

const GenerateSpendingAdviceOutputSchema = z.object({
  advice: z.string().describe('Personalized spending advice for the user.'),
});
export type GenerateSpendingAdviceOutput = z.infer<
  typeof GenerateSpendingAdviceOutputSchema
>;

export async function generateSpendingAdvice(
  input: GenerateSpendingAdviceInput
): Promise<GenerateSpendingAdviceOutput> {
  return generateSpendingAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSpendingAdvicePrompt',
  input: {schema: GenerateSpendingAdviceInputSchema},
  output: {schema: GenerateSpendingAdviceOutputSchema},
  prompt: `Based on your recent wallet activity, here is some personalized spending advice:

You opened your wallet {{walletOpens}} times.

Here's a tip to build spending awareness:
`,
});

const generateSpendingAdviceFlow = ai.defineFlow(
  {
    name: 'generateSpendingAdviceFlow',
    inputSchema: GenerateSpendingAdviceInputSchema,
    outputSchema: GenerateSpendingAdviceOutputSchema,
  },
  async (input, streamingCallback) => {
    const maxRetries = 3;
    let attempt = 0;
    let delay = 1000; // start with 1 second

    while (attempt < maxRetries) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error: any) {
        attempt++;
        if (error.message.includes('503') && attempt < maxRetries) {
          console.log(`Attempt ${attempt} failed with 503 error. Retrying in ${delay}ms...`);
          await sleep(delay);
          delay *= 2; // exponential backoff
        } else {
          // For non-503 errors or if max retries are reached, re-throw the error
          console.error(`AI advice generation failed after ${attempt} attempts.`, error);
          throw new Error('Failed to generate AI advice after multiple retries.');
        }
      }
    }
    // This should not be reached, but is a fallback.
    throw new Error('Failed to generate AI advice after multiple retries.');
  }
);
