
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
import { PlanTripInputSchema, PlanTripOutputSchema } from '@/ai/schemas'; // Import from centralized schemas

// Export inferred types
export type PlanTripInput = z.infer<typeof PlanTripInputSchema>;
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
If a budget is mentioned, provide an estimated cost breakdown (e.g., Accommodation: X%, Food: Y%, Activities: Z%).
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
        model: 'googleai/gemini-2.0-flash', 
        input, 
        output: { schema: PlanTripOutputSchema }, 
        config: {
          temperature: 0.7, 
        }
    });
    if (!output) {
        throw new Error("AI failed to generate a trip plan.");
    }
    return output;
  }
);
