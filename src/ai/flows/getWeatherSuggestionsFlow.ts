
'use server';
/**
 * @fileOverview AI Weather-Based Travel Suggestion Generator.
 *
 * - getWeatherSuggestions - A function that provides travel suggestions based on typical weather for a destination and date.
 * - GetWeatherSuggestionsInput - The input type for the getWeatherSuggestions function.
 * - GetWeatherSuggestionsOutput - The return type for the getWeatherSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GetWeatherSuggestionsInputSchema, GetWeatherSuggestionsOutputSchema } from '@/ai/schemas';

export type GetWeatherSuggestionsInput = z.infer<typeof GetWeatherSuggestionsInputSchema>;
export type GetWeatherSuggestionsOutput = z.infer<typeof GetWeatherSuggestionsOutputSchema>;

export async function getWeatherSuggestions(input: GetWeatherSuggestionsInput): Promise<GetWeatherSuggestionsOutput> {
  return getWeatherSuggestionsFlow(input);
}

const systemPrompt = `You are an AI Travel Advisor specializing in weather-based recommendations.
Your response MUST be strictly about the EXACT destination provided: "{{{destination}}}". Do NOT infer or use information about other similar-sounding or related destinations. ALL suggestions must pertain to "{{{destination}}}".

Based on the specific destination "{{{destination}}}" and the date/period: {{{date}}}, provide the following:
1.  A brief overview of the TYPICAL weather conditions for "{{{destination}}}" and that time of year (e.g., "Typically warm and sunny with occasional afternoon showers." or "Usually cold and snowy."). This is not a live forecast, but a general expectation for "{{{destination}}}".
2.  Suggestions for suitable activities in "{{{destination}}}".
3.  Specific packing recommendations or changes based on the typical weather for "{{{destination}}}".
4.  Backup plans or alternative activities in "{{{destination}}}" in case of rain or adverse weather.
Ensure the output strictly adheres to the provided JSON schema.
The "destinationName" field in the output JSON MUST exactly match the input destination string: "{{{destination}}}". No modifications.
The "dateContext" field in the output JSON MUST exactly match the input date string: "{{{date}}}". No modifications.
`;

const getWeatherSuggestionsFlow = ai.defineFlow(
  {
    name: 'getWeatherSuggestionsFlow',
    inputSchema: GetWeatherSuggestionsInputSchema,
    outputSchema: GetWeatherSuggestionsOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      prompt: systemPrompt,
      model: 'googleai/gemini-2.0-flash',
      input,
      output: { schema: GetWeatherSuggestionsOutputSchema },
      config: {
        temperature: 0.5,
      }
    });
    if (!output) {
      throw new Error("AI failed to generate weather-based suggestions.");
    }
    // Ensure destinationName and dateContext are explicitly set from the input.
    return { ...output, destinationName: input.destination, dateContext: input.date };
  }
);
