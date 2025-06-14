
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

const PackingListItemSchema = z.string().describe("A single item to pack (e.g., 'Hiking boots', 'Sunscreen SPF 50').");

const PackingListCategorySchema = z.object({
  categoryName: z.string().describe("The name of the packing category (e.g., 'Clothing', 'Toiletries', 'Electronics', 'Documents', 'Medication', 'Miscellaneous')."),
  items: z.array(PackingListItemSchema).describe("A list of items belonging to this category."),
});

export const GeneratePackingListInputSchema = z.object({
  destination: z.string().describe('The primary destination of the trip (e.g., "Pokhara, Nepal", "Phuket, Thailand").'),
  tripType: z.string().describe('The type of trip (e.g., "beach vacation", "mountain trekking", "city exploration", "business trip").'),
  durationDays: z.number().int().positive().describe('The total number of days for the trip.'),
  weather: z.string().describe('A brief description of the expected weather or season (e.g., "sunny with chances of rain", "cold and snowy", "tropical monsoon", "summer").').optional(),
  genderContext: z.enum(["male", "female", "neutral"]).default("neutral").describe("Gender context for clothing suggestions, if applicable. Defaults to neutral.").optional(),
});
export type GeneratePackingListInput = z.infer<typeof GeneratePackingListInputSchema>;

export const GeneratePackingListOutputSchema = z.object({
  packingListName: z.string().describe("A descriptive name for this packing list (e.g., 'Packing List for 5-Day Pokhara Trek')."),
  categories: z.array(PackingListCategorySchema).describe("An array of packing list categories, each containing items."),
  additionalTips: z.string().describe("Any additional brief tips related to packing for this specific trip (e.g., 'Roll clothes to save space', 'Carry a photocopy of your passport').").optional(),
});
export type GeneratePackingListOutput = z.infer<typeof GeneratePackingListOutputSchema>;

export async function generatePackingList(input: GeneratePackingListInput): Promise<GeneratePackingListOutput> {
  return generatePackingListFlow(input);
}

const systemPrompt = `You are an expert AI Packing List Generator. Your task is to create a comprehensive and practical packing list based on the user's trip details.

User Inputs:
Destination: {{{destination}}}
Trip Type: {{{tripType}}}
Duration: {{{durationDays}}} days
{{#if weather}}Expected Weather: {{{weather}}}{{/if}}
{{#if genderContext}}Gender Context for clothing (if applicable): {{{genderContext}}}{{/if}}

Please generate a categorized packing list.
Common categories include: Clothing, Toiletries, Electronics, Documents, Medication, Gear (if applicable, e.g., for hiking), Miscellaneous.
Tailor the list specifically to the destination, trip type, duration, and weather.
Provide a descriptive name for the packing list.
Optionally, include a few brief additional packing tips.
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
      model: 'googleai/gemini-2.0-flash', // Using Gemini Flash
      input,
      output: { schema: GeneratePackingListOutputSchema },
      config: {
        temperature: 0.5, // More factual for packing lists
      }
    });
    if (!output) {
      throw new Error("AI failed to generate a packing list.");
    }
    return output;
  }
);
