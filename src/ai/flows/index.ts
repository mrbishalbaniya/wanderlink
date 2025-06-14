
// This file is intended to export AI flows.
// For the purpose of this exercise, we assume detectDuplicateImageFlow.ts exists
// and provides the detectDuplicateImage function.
// In a real Genkit project, flows might be registered differently or imported directly.

export { detectDuplicateImage, type DuplicateImageResult } from './detectDuplicateImageFlow';
export { planTrip, type PlanTripInput, type PlanTripOutput } from './planTripFlow';
export { generatePackingList, type GeneratePackingListInput, type GeneratePackingListOutput } from './generatePackingListFlow';
export { getLocalInsights, type GetLocalInsightsInput, type GetLocalInsightsOutput } from './getLocalInsightsFlow';
export { getWeatherSuggestions, type GetWeatherSuggestionsInput, type GetWeatherSuggestionsOutput } from './getWeatherSuggestionsFlow';
