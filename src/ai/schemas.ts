
/**
 * @fileOverview Defines Zod schemas for AI flows.
 * This file centralizes schema definitions to be used by both
 * server-side Genkit flows and client-side forms.
 */
import { z } from 'zod';

// Schemas for PlanTripFlow
const ItineraryItemSchema = z.object({
  day: z.string().describe("The day number or label (e.g., 'Day 1', 'Arrival Day')."),
  title: z.string().describe("A concise title for the day's plan (e.g., 'Arrival and Lakeside Exploration')."),
  activities: z.string().describe("A detailed description of activities planned for the day, in a paragraph or bullet points."),
  foodSuggestions: z.string().describe("Suggestions for meals or local cuisine to try for the day, can be a paragraph or list."),
});

export const PlanTripInputSchema = z.object({
  destination: z.string().min(1, "Destination is required.").describe('The primary destination of the trip (e.g., "Pokhara, Nepal", "Paris").'),
  startDate: z.date().optional().nullable().describe('The starting date of the trip.'),
  endDate: z.date().optional().nullable().describe('The ending date of the trip.'),
  numberOfDays: z.number().int().positive().optional().nullable().describe('The total number of days for the trip. If startDate and endDate are provided, this can be derived by the AI.'),
  budget: z.string().min(1, "Budget is required.").describe('The estimated budget for the trip (e.g., "NPR 15000", "moderate", "luxury").'),
  interests: z.string().min(1, "Interests are required.").describe('A comma-separated list of interests for the trip (e.g., "hiking, food, museums, photography, adventure, relaxation").'),
  numberOfPeople: z.number().int().positive().min(1).default(1).describe('The number of people participating in the trip.'),
}).refine(data => {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    return false;
  }
  return true;
}, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});


export const PlanTripOutputSchema = z.object({
  destinationName: z.string().describe("The specific destination the plan is for. THIS MUST EXACTLY MATCH THE USER'S INPUT DESTINATION STRING. Do not alter it."),
  tripTitle: z.string().describe("A catchy and descriptive title for the overall trip plan (e.g., '5-Day Pokhara Adventure for Nature Lovers'). This title should reflect the content of the plan for the specified 'destinationName'."),
  itinerary: z.array(ItineraryItemSchema).describe('A day-by-day itinerary for the trip to `destinationName`.'),
  travelTips: z.string().describe('General travel tips relevant to `destinationName` and trip type (e.g., transportation advice, currency, what to pack briefly if not covered by a separate packing list request). Should be a paragraph or bullet points.'),
  recommendedPlaces: z.string().describe('A list or paragraph of additional recommended places to visit or activities to consider in or near `destinationName`.'),
  estimatedCostBreakdown: z.string().describe("A brief, estimated breakdown of costs based on the provided budget, categorized into areas like accommodation, food, activities, and travel for the trip to `destinationName`. Example: 'Accommodation: 40%, Food: 25%, Activities: 25%, Local Travel: 10%'").optional(),
});


// Schemas for GeneratePackingListFlow
const PackingListItemSchema = z.string().describe("A single item to pack (e.g., 'Hiking boots', 'Sunscreen SPF 50').");

const PackingListCategorySchema = z.object({
  categoryName: z.string().describe("The name of the packing category (e.g., 'Clothing', 'Toiletries', 'Electronics', 'Documents', 'Medication', 'Miscellaneous')."),
  items: z.array(PackingListItemSchema).describe("A list of items belonging to this category."),
});

export const GeneratePackingListInputSchema = z.object({
  destination: z.string().min(1, "Destination is required.").describe('The primary destination of the trip (e.g., "Pokhara, Nepal", "Phuket, Thailand").'),
  tripType: z.string().min(1, "Trip type is required.").describe('The type of trip (e.g., "beach vacation", "mountain trekking", "city exploration", "business trip").'),
  durationDays: z.number().int().positive({ message: "Duration must be a positive number."}).min(1, { message: "Duration must be at least 1 day."}).describe('The total number of days for the trip.'),
  weather: z.string().describe('A brief description of the expected weather or season (e.g., "sunny with chances of rain", "cold and snowy", "tropical monsoon", "summer").').optional(),
  genderContext: z.enum(["male", "female", "neutral"]).default("neutral").describe("Gender context for clothing suggestions, if applicable. Defaults to neutral.").optional(),
});

export const GeneratePackingListOutputSchema = z.object({
  destinationName: z.string().describe("The specific destination the packing list is for. THIS MUST EXACTLY MATCH THE USER'S INPUT DESTINATION STRING. Do not alter it."),
  packingListName: z.string().describe("A descriptive name for this packing list (e.g., 'Packing List for 5-Day Pokhara Trek'). This title should reflect the content of the list for the specified 'destinationName'."),
  categories: z.array(PackingListCategorySchema).describe("An array of packing list categories, each containing items relevant for `destinationName`."),
  additionalTips: z.string().describe("Any additional brief tips related to packing for this specific trip to `destinationName` (e.g., 'Roll clothes to save space', 'Carry a photocopy of your passport').").optional(),
});

// Schemas for GetLocalInsightsFlow
export const GetLocalInsightsInputSchema = z.object({
  destination: z.string().min(1, { message: "Destination cannot be empty."}).describe('The city or country for which to get local insights (e.g., "Kathmandu, Nepal", "Thailand").'),
});

export const GetLocalInsightsOutputSchema = z.object({
  destinationName: z.string().describe("The name of the destination for which insights are provided. THIS MUST EXACTLY MATCH THE USER'S INPUT DESTINATION STRING. Do not alter it."),
  localCustoms: z.string().describe("Tips related to local customs, etiquette, and cultural sensitivities for `destinationName`."),
  safetyInfo: z.string().describe("Important safety information, common scams to be aware of, and emergency contacts if applicable for `destinationName`."),
  whatToAvoid: z.string().describe("Things to avoid doing or saying, or places to be cautious about in `destinationName`."),
  mustTryFood: z.string().describe("A list of must-try local dishes or food experiences in `destinationName`."),
});

// Schemas for GetWeatherSuggestionsFlow
export const GetWeatherSuggestionsInputSchema = z.object({
  destination: z.string().min(1, { message: "Destination cannot be empty."}).describe('The destination for weather-based suggestions (e.g., "Pokhara, Nepal").'),
  date: z.string().min(1, { message: "Date cannot be empty."}).describe('The date or date range for the trip (e.g., "next Tuesday", "2024-12-25 to 2024-12-28", "mid-July").'),
});

export const GetWeatherSuggestionsOutputSchema = z.object({
  destinationName: z.string().describe("The name of the destination. THIS MUST EXACTLY MATCH THE USER'S INPUT DESTINATION STRING. Do not alter it."),
  dateContext: z.string().describe("The date or date range for which suggestions are provided. THIS MUST EXACTLY MATCH THE USER'S INPUT DATE CONTEXT. Do not alter it."),
  weatherOverview: z.string().describe("A brief overview of the expected weather conditions based on typical patterns for `destinationName` and `dateContext`. This is a general expectation, not a live forecast."),
  suitableActivities: z.string().describe("Suggestions for activities suitable for the typical weather during that time in `destinationName`."),
  packingChanges: z.string().describe("Recommendations for specific clothing or gear to pack based on the typical weather in `destinationName`."),
  backupPlansForRain: z.string().describe("Alternative activities or suggestions in case of unexpected rain or adverse weather in `destinationName`."),
});
