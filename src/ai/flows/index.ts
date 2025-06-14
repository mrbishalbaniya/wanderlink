
// This file is intended to export AI flows.
// For the purpose of this exercise, we assume detectDuplicateImageFlow.ts exists
// and provides the detectDuplicateImage function.
// In a real Genkit project, flows might be registered differently or imported directly.

export { detectDuplicateImage, type DuplicateImageResult } from './detectDuplicateImageFlow';
export { planTrip, type PlanTripInput, type PlanTripOutput } from './planTripFlow'; // Removed schema exports
export { generatePackingList, type GeneratePackingListInput, type GeneratePackingListOutput } from './generatePackingListFlow'; // Removed schema exports
