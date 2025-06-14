
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
  destination: z.string().describe('The primary destination of the trip (e.g., "Pokhara, Nepal", "Paris").'),
  startDate: z.string().describe('The starting date of the trip (e.g., "next Monday", "2024-12-25"). Can be relative or specific.').optional(),
  endDate: z.string().describe('The ending date of the trip (e.g., "next Friday", "2024-12-30"). Can be relative or specific.').optional(),
  numberOfDays: z.number().int().positive().describe('The total number of days for the trip. If startDate and endDate are provided, this can be derived by the AI.').optional(),
  budget: z.string().describe('The estimated budget for the trip (e.g., "NPR 15000", "moderate", "luxury").'),
  interests: z.string().describe('A comma-separated list of interests for the trip (e.g., "hiking, food, museums, photography, adventure, relaxation").'),
  numberOfPeople: z.number().int().positive().default(1).describe('The number of people participating in the trip.'),
});

export const PlanTripOutputSchema = z.object({
  tripTitle: z.string().describe("A catchy and descriptive title for the overall trip plan (e.g., '5-Day Pokhara Adventure for Nature Lovers')."),
  itinerary: z.array(ItineraryItemSchema).describe('A day-by-day itinerary for the trip.'),
  travelTips: z.string().describe('General travel tips relevant to the destination and trip type (e.g., transportation advice, currency, what to pack briefly if not covered by a separate packing list request). Should be a paragraph or bullet points.'),
  recommendedPlaces: z.string().describe('A list or paragraph of additional recommended places to visit or activities to consider in or near the destination.'),
  estimatedCostBreakdown: z.string().describe("A brief, estimated breakdown of costs based on the provided budget, categorized into areas like accommodation, food, activities, and travel. Example: 'Accommodation: 40%, Food: 25%, Activities: 25%, Local Travel: 10%'").optional(),
});


// Schemas for GeneratePackingListFlow
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

export const GeneratePackingListOutputSchema = z.object({
  packingListName: z.string().describe("A descriptive name for this packing list (e.g., 'Packing List for 5-Day Pokhara Trek')."),
  categories: z.array(PackingListCategorySchema).describe("An array of packing list categories, each containing items."),
  additionalTips: z.string().describe("Any additional brief tips related to packing for this specific trip (e.g., 'Roll clothes to save space', 'Carry a photocopy of your passport').").optional(),
});
