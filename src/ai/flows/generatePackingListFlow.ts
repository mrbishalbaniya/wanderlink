
'use server';
/**
 * @fileOverview AI Packing List Generator.
 *
 * - generatePackingList - A function that creates a packing list based on trip details.
 * - GeneratePackingListInput - The input type for the generatePackingList function.
 * - GeneratePackingListOutput - The return type for the generatePackingList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GeneratePackingListInputSchema, GeneratePackingListOutputSchema } from '@/ai/schemas'; // Import from centralized schemas

// Export inferred types
export type GeneratePackingListInput = z.infer<typeof GeneratePackingListInputSchema>;
export type GeneratePackingListOutput = z.infer<typeof GeneratePackingListOutputSchema>;

export async function generatePackingList(input: GeneratePackingListInput): Promise<GeneratePackingListOutput> {
  return generatePackingListFlow(input);
}

const systemPrompt = `You are an expert AI Packing List Generator. Your task is to create a comprehensive and practical packing list.
Your response MUST be strictly based on the EXACT destination provided: "{{{destination}}}".
Do NOT infer or use information about other similar-sounding or related destinations. ALL items and advice must be relevant for "{{{destination}}}".

User Inputs:
Destination: {{{destination}}}
Trip Type: {{{tripType}}}
Duration: {{{durationDays}}} days
{{#if weather}}Expected Weather: {{{weather}}}{{/if}}
{{#if genderContext}}Gender Context for clothing (if applicable): {{{genderContext}}}{{/if}}

Please generate a categorized packing list for a trip to "{{{destination}}}".
Common categories include: Clothing, Toiletries, Electronics, Documents, Medication, Gear (if applicable, e.g., for hiking), Miscellaneous.
Tailor the list specifically to the destination "{{{destination}}}", trip type, duration, and weather.
The "packingListName" field in the output JSON should be a descriptive name for this packing list, for example: "Packing List for {{{durationDays}}}-Day Trip to {{{destination}}}".
The "destinationName" field in the output JSON MUST exactly match the input destination string: "{{{destination}}}". No modifications.
Optionally, include a few brief additional packing tips specific to "{{{destination}}}".
Ensure the output strictly adheres to the provided JSON schema.
`;

const generatePackingListFlow = ai.defineFlow(
  {
    name: 'generatePackingListFlow',
    inputSchema: GeneratePackingListInputSchema,
    outputSchema: GeneratePackingListOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      prompt: systemPrompt,
      model: 'googleai/gemini-2.0-flash',
      input,
      output: { schema: GeneratePackingListOutputSchema },
      config: {
        temperature: 0.5, 
      }
    });
    if (!output) {
      throw new Error("AI failed to generate a packing list.");
    }
     // Ensure destinationName is explicitly set from the input
    return { ...output, destinationName: input.destination };
  }
);
