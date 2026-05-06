import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with the key from environment variables
// Note: In a real production app, this should be handled by a backend service
// to avoid exposing the API key in the frontend code.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

/**
 * Analyzes an image of a meal and provides nutritional breakdown.
 * @param {string} base64Image - Base64 encoded image string
 * @param {Object} userProfile - User's profile containing their goals and macros
 * @returns {Promise<Object>} Nutritional information and recommendations
 */
export const analyzeMeal = async (base64Image, userProfile) => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error('Gemini API key is missing. Please add it to your .env file.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Clean up base64 string if it contains data URL prefix
    const base64Data = base64Image.split(',')[1] || base64Image;

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ];

    const prompt = `
      You are an expert nutritionist AI. Analyze this image of a meal.
      
      User Context:
      - Goal: ${userProfile.goal}
      - Daily Target Calories: ${userProfile.macros.calories}
      
      Please provide a detailed nutritional breakdown in the following JSON format strictly. Do not include markdown code blocks, comments, or extra text. Use only numbers for macro values.
      
      {
        "items": [
          {
            "name": "ingredient or dish component",
            "confidence": 0.9,
            "calories": 120,
            "protein": 8,
            "carbs": 15,
            "fats": 4
          }
        ],
        "total_calories": 500,
        "total_protein": 30,
        "total_carbs": 55,
        "total_fats": 18,
        "health_score": 8,
        "feedback": "Specific feedback on how this meal aligns with their goal of ${userProfile.goal}ing weight, and any suggestions for improvement."
      }
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    // Sometimes the model wraps it in markdown code blocks, so we try to clean it up
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      items: parsed.items ?? [],
      total_calories: Number(parsed.total_calories ?? parsed.estimatedMacros?.calories ?? 0),
      total_protein: Number(parsed.total_protein ?? parsed.estimatedMacros?.protein ?? 0),
      total_carbs: Number(parsed.total_carbs ?? parsed.estimatedMacros?.carbs ?? 0),
      total_fats: Number(parsed.total_fats ?? parsed.estimatedMacros?.fat ?? 0),
      health_score: Number(parsed.health_score ?? parsed.healthScore ?? 0),
      feedback: parsed.feedback ?? 'Analysis complete.',
    };

  } catch (error) {
    console.error("Error analyzing meal with Gemini:", error);
    throw new Error('Failed to analyze the meal. Please try again with a clearer image.');
  }
};
