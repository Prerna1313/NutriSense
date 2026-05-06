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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
      
      Please provide a detailed nutritional breakdown in the following JSON format strictly. Do not include markdown code blocks, just the raw JSON.
      
      {
        "mealName": "Name of the dish",
        "description": "Brief description of the meal",
        "ingredients": ["ingredient 1", "ingredient 2"],
        "estimatedMacros": {
          "calories": number,
          "protein": number, // in grams
          "carbs": number, // in grams
          "fat": number // in grams
        },
        "healthScore": number, // 1-10 rating based on the user's goal
        "feedback": "Specific feedback on how this meal aligns with their goal of ${userProfile.goal}ing weight, and any suggestions for improvement."
      }
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    // Sometimes the model wraps it in markdown code blocks, so we try to clean it up
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Error analyzing meal with Gemini:", error);
    throw new Error('Failed to analyze the meal. Please try again with a clearer image.');
  }
};
