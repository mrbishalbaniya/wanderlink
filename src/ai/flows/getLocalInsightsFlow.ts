
'use server';
/**
 * @fileOverview AI Local Insights Generator.
 *
 * - getLocalInsights - A function that provides cultural and practical tips for a destination.
 * - GetLocalInsightsInput - The input type for the getLocalInsights function.
 * - GetLocalInsightsOutput - The return type for the getLocalInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GetLocalInsightsInputSchema, GetLocalInsightsOutputSchema } from '@/ai/schemas';

export type GetLocalInsightsInput = z.infer<typeof GetLocalInsightsInputSchema>;
export type GetLocalInsightsOutput = z.infer<typeof GetLocalInsightsOutputSchema>;

export async function getLocalInsights(input: GetLocalInsightsInput): Promise<GetLocalInsightsOutput> {
  return getLocalInsightsFlow(input);
}

const systemPrompt = `You are a seasoned travel expert. Your SOLE AND ONLY TASK is to provide concise and helpful tips for travelers visiting the EXACT destination specified: "{{{destination}}}".
ALL insights provided MUST be strictly about "{{{destination}}}". Do NOT infer or use information about other similar-sounding or related destinations.

Based on the specific destination "{{{destination}}}", provide the following insights.
Ensure the output strictly adheres to the provided JSON schema.
Provide exactly 5 key tips, broken down into the categories: Local Customs, Safety Info, What to Avoid, and Must-Try Food.
The response for each category should be a descriptive paragraph or a few key bullet points specifically for "{{{destination}}}".
If the destination is a city, focus on that city. If it's a country, provide general tips for that country.
The "destinationName" field in the output JSON MUST exactly match the input destination string: "{{{destination}}}". No modifications.
`;

const getLocalInsightsFlow = ai.defineFlow(
  {
    name: 'getLocalInsightsFlow',
    inputSchema: GetLocalInsightsInputSchema,
    outputSchema: GetLocalInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      prompt: systemPrompt,
      model: 'googleai/gemini-2.0-flash',
      input,
      output: { schema: GetLocalInsightsOutputSchema },
      config: {
        temperature: 0.4, 
      }
    });
    if (!output) {
      throw new Error("AI failed to generate local insights.");
    }
    // Ensure destinationName is explicitly set from the input.
    return { ...output, destinationName: input.destination };
  }
);
