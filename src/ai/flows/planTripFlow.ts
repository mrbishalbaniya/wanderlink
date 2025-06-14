
'use server';
/**
 * @fileOverview AI Trip Planning Assistant.
 *
 * - planTrip - A function that generates a travel plan based on user inputs.
 * - PlanTripInput - The input type for the planTrip function.
 * - PlanTripOutput - The return type for the planTrip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ItineraryItemSchema = z.object({
  day: z.string().describe("The day number or label (e.g., 'Day 1', 'Arrival Day')."),
  title: z.string().describe("A concise title for the day's plan (e.g., 'Arrival and Lakeside Exploration')."),
  activities: z.string().describe("A detailed description of activities planned for the day, in a paragraph or bullet points."),
  foodSuggestions: z.string().describe("Suggestions for meals or local cuisine to try for the day, can be a paragraph or list."),
});

export const PlanTripInputSchema = z.object({
  destination: z.string().describe('The primary destination of the trip (e.g., "Pokhara, Nepal", "Paris").'),
  startDate: z.string().describe('The starting date of the trip (e.g., "next Monday", "2024-12-25"). Can be relative or specific.').optional(),
  endDate: z.string().describe('The ending date of the trip (e.g., "next Friday", "2024-12-30"). Can be relative or specific.').optional(),
  numberOfDays: z.number().int().positive().describe('The total number of days for the trip. If startDate and endDate are provided, this can be derived by the AI.').optional(),
  budget: z.string().describe('The estimated budget for the trip (e.g., "NPR 15000", "moderate", "luxury").'),
  interests: z.string().describe('A comma-separated list of interests for the trip (e.g., "hiking, food, museums, photography, adventure, relaxation").'),
  numberOfPeople: z.number().int().positive().default(1).describe('The number of people participating in the trip.'),
});
export type PlanTripInput = z.infer<typeof PlanTripInputSchema>;

export const PlanTripOutputSchema = z.object({
  tripTitle: z.string().describe("A catchy and descriptive title for the overall trip plan (e.g., '5-Day Pokhara Adventure for Nature Lovers')."),
  itinerary: z.array(ItineraryItemSchema).describe('A day-by-day itinerary for the trip.'),
  travelTips: z.string().describe('General travel tips relevant to the destination and trip type (e.g., transportation advice, currency, what to pack briefly if not covered by a separate packing list request). Should be a paragraph or bullet points.'),
  recommendedPlaces: z.string().describe('A list or paragraph of additional recommended places to visit or activities to consider in or near the destination.'),
  estimatedCostBreakdown: z.string().describe("A brief, estimated breakdown of costs based on the provided budget, categorized into areas like accommodation, food, activities, and travel. Example: 'Accommodation: 40%, Food: 25%, Activities: 25%, Local Travel: 10%'").optional(),
});
export type PlanTripOutput = z.infer<typeof PlanTripOutputSchema>;


export async function planTrip(input: PlanTripInput): Promise<PlanTripOutput> {
  return planTripFlow(input);
}

const systemPrompt = `You are an expert AI Trip Planner. Your goal is to create a comprehensive and engaging travel plan based on the user's preferences.

Generate a detailed itinerary, practical travel tips, and suggest extra places or activities.
If budget information is provided, also give a rough estimated cost breakdown.
Ensure the output strictly adheres to the provided JSON schema.

User Inputs:
Destination: {{{destination}}}
Interests: {{{interests}}}
Budget: {{{budget}}}
Number of People: {{{numberOfPeople}}}
{{#if startDate}}Start Date: {{{startDate}}}{{/if}}
{{#if endDate}}End Date: {{{endDate}}}{{/if}}
{{#if numberOfDays}}Number of Days: {{{numberOfDays}}}{{/if}}

Please generate a travel plan. If numberOfDays is not specified but startDate and endDate are, calculate the duration.
Structure the itinerary clearly day by day.
Provide actionable travel tips.
Suggest other relevant places or activities.
If a budget is mentioned, provide an estimated breakdown (e.g., Accommodation: X%, Food: Y%, Activities: Z%).
The trip title should be creative and reflect the essence of the trip.
`;

const planTripFlow = ai.defineFlow(
  {
    name: 'planTripFlow',
    inputSchema: PlanTripInputSchema,
    outputSchema: PlanTripOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
        prompt: systemPrompt,
        model: 'googleai/gemini-2.0-flash', // Using Gemini Flash for potentially faster responses
        input, // Pass the validated input directly
        output: { schema: PlanTripOutputSchema }, // Ensure Genkit v1.x output schema definition
        config: {
          temperature: 0.7, // Allow for some creativity
        }
    });
    if (!output) {
        throw new Error("AI failed to generate a trip plan.");
    }
    return output;
  }
);
