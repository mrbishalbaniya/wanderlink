// This is a MOCK AI flow.
// DO NOT MODIFY or expect this to be a real AI implementation.
// It's a placeholder to make the `CreatePostForm` import work.

export interface DuplicateImageResult {
  isDuplicate: boolean;
  message?: string;
  similarityScore?: number; // Example: 0.0 to 1.0
}

export async function detectDuplicateImage(imageFile: File): Promise<DuplicateImageResult> {
  console.log(`[AI Flow MOCK] Checking for duplicate image: ${imageFile.name}`);
  
  // Simulate network delay and processing
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Simulate a small chance of detecting a duplicate
  if (Math.random() < 0.1) { // 10% chance of being a "duplicate"
    const score = 0.8 + Math.random() * 0.19; // Simulate high similarity
    return { 
      isDuplicate: true, 
      message: `This image seems very similar to an existing one (Mock similarity: ${score.toFixed(2)}).`,
      similarityScore: score 
    };
  }

  return { 
    isDuplicate: false,
    similarityScore: Math.random() * 0.5 // Simulate low similarity
  };
}
