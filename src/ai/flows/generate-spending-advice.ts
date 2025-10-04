'use server';

/**
 * @fileOverview A flow to generate personalized spending advice based on user wallet activity.
 *
 * - generateSpendingAdvice - A function that generates spending advice.
 * - GenerateSpendingAdviceInput - The input type for the generateSpendingAdvice function.
 * - GenerateSpendingAdviceOutput - The return type for the generateSpendingAdvice function.
 */

import {ai} from '@/ai/genkit';
import {sleep} from '@/lib/utils';
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
  async input => {
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error: any) {
        attempt++;
        if (attempt >= maxRetries) {
          console.error(
            'AI advice generation failed after multiple retries:',
            error
          );
          throw error;
        }
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(
          `AI advice generation failed. Retrying in ${delay}ms...`,
          error
        );
        await sleep(delay);
      }
    }
    // This part should not be reachable if retries are handled correctly.
    throw new Error('Failed to generate spending advice after all retries.');
  }
);
