import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const getImagePayload = (imageDataUrl) => {
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  return {
    data: match ? match[2] : imageDataUrl,
    mimeType: match ? match[1] : 'image/jpeg',
  };
};

const extractJson = (text) => {
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Gemini did not return JSON.');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeAnalysis = (raw) => {
  const estimated = raw.estimatedMacros ?? {};
  const items = Array.isArray(raw.items) && raw.items.length > 0
    ? raw.items
    : [
        {
          name: raw.mealName || 'meal',
          confidence: 0.72,
          calories: estimated.calories ?? raw.total_calories ?? 0,
          protein: estimated.protein ?? raw.total_protein ?? 0,
          carbs: estimated.carbs ?? raw.total_carbs ?? 0,
          fats: estimated.fat ?? raw.total_fats ?? 0,
        },
      ];

  const safeItems = items.map((item) => ({
    name: item.name || 'meal item',
    confidence: Math.min(Math.max(toNumber(item.confidence, 0.7), 0), 1),
    calories: Math.round(toNumber(item.calories)),
    protein: Math.round(toNumber(item.protein)),
    carbs: Math.round(toNumber(item.carbs)),
    fats: Math.round(toNumber(item.fats ?? item.fat)),
  }));

  const totals = safeItems.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fats: sum.fats + item.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return {
    items: safeItems,
    total_calories: Math.round(toNumber(raw.total_calories ?? estimated.calories, totals.calories)),
    total_protein: Math.round(toNumber(raw.total_protein ?? estimated.protein, totals.protein)),
    total_carbs: Math.round(toNumber(raw.total_carbs ?? estimated.carbs, totals.carbs)),
    total_fats: Math.round(toNumber(raw.total_fats ?? estimated.fat, totals.fats)),
    health_score: Math.min(Math.max(Math.round(toNumber(raw.health_score ?? raw.healthScore, 7)), 1), 10),
    feedback: raw.feedback || 'Analysis complete. Review portion size and ingredients for the most accurate tracking.',
    source: raw.source || 'gemini',
  };
};

const estimateLocally = (userProfile = {}) => {
  const goal = userProfile.goal || 'maintain';
  const score = goal === 'lose' ? 7 : goal === 'gain' ? 8 : 7;

  return normalizeAnalysis({
    source: 'estimate',
    items: [
      { name: 'main dish', confidence: 0.62, calories: 320, protein: 22, carbs: 28, fats: 12 },
      { name: 'carbohydrate portion', confidence: 0.58, calories: 180, protein: 4, carbs: 38, fats: 2 },
      { name: 'vegetable side', confidence: 0.6, calories: 70, protein: 3, carbs: 12, fats: 2 },
    ],
    total_calories: 570,
    total_protein: 29,
    total_carbs: 78,
    total_fats: 16,
    health_score: score,
    feedback:
      'Estimated analysis generated because the AI service was unavailable. This looks like a balanced plate; confirm portions after logging for better accuracy.',
  });
};

const buildPrompt = (userProfile = {}) => `
You are an expert nutritionist AI. Analyze this meal image.

User context:
- Goal: ${userProfile.goal || 'maintain'}
- Daily target calories: ${Math.round(userProfile.tdee || 2000)}

Return only valid JSON. No markdown. No comments. Use this exact shape:
{
  "items": [
    {
      "name": "food item name",
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
  "feedback": "Short, practical nutrition feedback for the user's goal."
}
`;

export const analyzeMeal = async (base64Image, userProfile) => {
  if (!apiKey) {
    return estimateLocally(userProfile);
  }

  const imagePayload = getImagePayload(base64Image);
  const prompt = buildPrompt(userProfile);
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent([
        prompt,
        { inlineData: imagePayload },
      ]);
      const text = result.response.text();
      return normalizeAnalysis(extractJson(text));
    } catch (error) {
      lastError = error;
      console.warn(`[geminiService] ${modelName} failed:`, error.message);
    }
  }

  console.warn('[geminiService] Falling back to local estimate:', lastError?.message);
  return estimateLocally(userProfile);
};
