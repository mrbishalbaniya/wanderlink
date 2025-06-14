
'use server';
/**
 * @fileOverview AI Trip Planning Assistant.
 *
 * - planTrip - A function that generates a travel plan based on user inputs.
 * - PlanTripInput - The input type for the planTrip function (client-facing, uses Date objects).
 * - PlanTripOutput - The return type for the planTrip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PlanTripInputSchema as ClientPlanTripInputSchema, PlanTripOutputSchema } from '@/ai/schemas';
import { format as formatDateFns } from 'date-fns';

// This is the type for the EXPORTED function, which will receive Date objects from the client form
export type PlanTripInput = z.infer<typeof ClientPlanTripInputSchema>;
export type PlanTripOutput = z.infer<typeof PlanTripOutputSchema>;

// Internal Zod schema for the Genkit flow's direct input, where dates are expected as strings for the prompt
const FlowInternalPlanTripInputSchema = z.object({
  destination: z.string().describe('The primary destination of the trip (e.g., "Pokhara, Nepal", "Paris").'),
  startDate: z.string().describe('The starting date of the trip in yyyy-MM-dd format.').optional(),
  endDate: z.string().describe('The ending date of the trip in yyyy-MM-dd format.').optional(),
  numberOfDays: z.number().int().positive().describe('The total number of days for the trip. If startDate and endDate are provided, this can be derived by the AI.').optional(),
  budget: z.string().describe('The estimated budget for the trip (e.g., "NPR 15000", "moderate", "luxury").'),
  interests: z.string().describe('A comma-separated list of interests for the trip (e.g., "hiking, food, museums, photography, adventure, relaxation").'),
  numberOfPeople: z.number().int().positive().default(1).describe('The number of people participating in the trip.'),
});


export async function planTrip(clientInput: PlanTripInput): Promise<PlanTripOutput> {
  // Transform client input (with Date objects) to flow input (with string dates)
  const flowInput: z.infer<typeof FlowInternalPlanTripInputSchema> = {
    destination: clientInput.destination,
    startDate: clientInput.startDate ? formatDateFns(clientInput.startDate, 'yyyy-MM-dd') : undefined,
    endDate: clientInput.endDate ? formatDateFns(clientInput.endDate, 'yyyy-MM-dd') : undefined,
    numberOfDays: clientInput.numberOfDays ?? undefined, // Ensure undefined if null
    budget: clientInput.budget,
    interests: clientInput.interests,
    numberOfPeople: clientInput.numberOfPeople || 1, // Ensure default if not provided or 0
  };
  return planTripFlowInstance(flowInput);
}

const systemPrompt = `You are an expert AI Trip Planner. Your goal is to create a comprehensive and engaging travel plan based on the user's preferences.

Generate a detailed itinerary, practical travel tips, and suggest extra places or activities.
If budget information is provided, also give a rough estimated cost breakdown (e.g., "Accommodation: 40%, Food: 25%, Activities: 25%, Local Travel: 10%").
Ensure the output strictly adheres to the provided JSON schema.
Consider the number of people when suggesting activities and accommodations. Try to balance active days with rest/relaxation.

User Inputs:
Destination: {{{destination}}}
Interests: {{{interests}}}
Budget: {{{budget}}}
Number of People: {{{numberOfPeople}}}
{{#if startDate}}Start Date: {{{startDate}}} (Interpret as yyyy-MM-dd){{/if}}
{{#if endDate}}End Date: {{{endDate}}} (Interpret as yyyy-MM-dd){{/if}}
{{#if numberOfDays}}Number of Days: {{{numberOfDays}}}{{/if}}

Please generate a travel plan. If numberOfDays is not specified but startDate and endDate are, calculate the duration.
Structure the itinerary clearly day by day.
Provide actionable travel tips.
Suggest other relevant places or activities.
If a budget is mentioned, provide an estimated cost breakdown (e.g., Accommodation: X%, Food: Y%, Activities: Z%).
The trip title should be creative and reflect the essence of the trip.
`;

// This is the Genkit flow instance
const planTripFlowInstance = ai.defineFlow(
  {
    name: 'planTripFlowInstance', // Renamed to avoid conflict if planTripFlow was a type
    inputSchema: FlowInternalPlanTripInputSchema, // Uses the internal schema with string dates
    outputSchema: PlanTripOutputSchema,
  },
  async (internalFlowInput) => { // Parameter name reflects it's the internal version
    const {output} = await ai.generate({
        prompt: systemPrompt,
        model: 'googleai/gemini-2.0-flash', 
        input: internalFlowInput, 
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

