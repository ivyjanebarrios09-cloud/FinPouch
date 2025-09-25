'use server';

/**
 * @fileOverview A flow to generate personalized spending advice based on user wallet activity.
 *
 * - generateSpendingAdvice - A function that generates spending advice.
 * - GenerateSpendingAdviceInput - The input type for the generateSpendingAdvice function.
 * - GenerateSpendingAdviceOutput - The return type for the generateSpendingAdvice function.
 */

import {ai} from '@/ai/genkit';
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
    const {output} = await prompt(input);
    return output!;
  }
);
