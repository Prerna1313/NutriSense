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

const getVerdict = (score) => {
  if (score >= 8) return { label: 'Good', reason: 'Strong fit for your current nutrition goal.' };
  if (score >= 5) return { label: 'Fair', reason: 'Works with a few portion or macro improvements.' };
  return { label: 'Avoid', reason: 'Likely too far from your current goal or missing balance.' };
};

const getPersonalizedSuggestions = (analysis, context = {}) => {
  const suggestions = [];
  const proteinTarget = context.userProfile?.macros?.protein ?? 90;
  const goal = context.userProfile?.goal ?? 'maintain';
  const allergies = context.allergies?.trim();
  const diet = context.dietPreference ?? 'balanced';

  if (analysis.total_protein < proteinTarget * 0.2) suggestions.push('Add protein: paneer, dal, eggs, tofu, curd, or grilled chicken.');
  if (analysis.total_fats > 25) suggestions.push('Reduce oil/ghee or choose grilled/steamed preparation.');
  if (analysis.total_carbs > 80 || goal === 'lose') suggestions.push('Swap some rice with millet, roti, salad, or extra sabzi.');
  if (diet === 'vegan') suggestions.push('Use tofu, sprouts, chickpeas, dal, or soy chunks for vegan protein.');
  if (diet === 'diabetic') suggestions.push('Prefer low-GI carbs like millet, dal, vegetables, and smaller rice portions.');
  if (diet === 'high-protein') suggestions.push('Increase lean protein and keep carbs moderate.');
  if (allergies) suggestions.push(`Allergy check: avoid or verify ingredients related to ${allergies}.`);

  return suggestions.slice(0, 4);
};

const normalizeAnalysis = (raw, context = {}) => {
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

  const normalized = {
    items: safeItems,
    total_calories: Math.round(toNumber(raw.total_calories ?? estimated.calories, totals.calories)),
    total_protein: Math.round(toNumber(raw.total_protein ?? estimated.protein, totals.protein)),
    total_carbs: Math.round(toNumber(raw.total_carbs ?? estimated.carbs, totals.carbs)),
    total_fats: Math.round(toNumber(raw.total_fats ?? estimated.fat, totals.fats)),
    health_score: Math.min(Math.max(Math.round(toNumber(raw.health_score ?? raw.healthScore, 7)), 1), 10),
    feedback: raw.feedback || 'Analysis complete. Review portion size and ingredients for the most accurate tracking.',
    source: raw.source || 'gemini',
  };

  const verdict = typeof raw.verdict === 'string'
    ? { label: raw.verdict, reason: getVerdict(normalized.health_score).reason }
    : raw.verdict ?? getVerdict(normalized.health_score);
  return {
    ...normalized,
    verdict,
    suggestions: raw.suggestions ?? getPersonalizedSuggestions(normalized, context),
    allergy_warning: context.allergies
      ? `Check for ${context.allergies} before eating. AI image analysis cannot guarantee allergen safety.`
      : '',
    diet_preference: context.dietPreference ?? 'balanced',
    manual_description: context.mealDescription ?? '',
  };
};

const estimateLocally = (userProfile = {}, context = {}) => {
  const goal = userProfile.goal || 'maintain';
  const score = goal === 'lose' ? 7 : goal === 'gain' ? 8 : 7;
  const description = (context.mealDescription || '').toLowerCase();
  const isIndian = /dal|roti|rice|paneer|idli|dosa|poha|upma|rajma|chole|sabzi|biryani|khichdi/.test(description);

  return normalizeAnalysis({
    source: 'estimate',
    items: isIndian
      ? [
          { name: 'dal or curry', confidence: 0.66, calories: 260, protein: 15, carbs: 28, fats: 9 },
          { name: 'rice or roti', confidence: 0.62, calories: 220, protein: 6, carbs: 44, fats: 3 },
          { name: 'sabzi or salad', confidence: 0.6, calories: 90, protein: 4, carbs: 14, fats: 3 },
        ]
      : [
          { name: 'main dish', confidence: 0.62, calories: 320, protein: 22, carbs: 28, fats: 12 },
          { name: 'carbohydrate portion', confidence: 0.58, calories: 180, protein: 4, carbs: 38, fats: 2 },
          { name: 'vegetable side', confidence: 0.6, calories: 70, protein: 3, carbs: 12, fats: 2 },
        ],
    total_calories: 570,
    total_protein: isIndian ? 25 : 29,
    total_carbs: isIndian ? 86 : 78,
    total_fats: isIndian ? 15 : 16,
    health_score: score,
    feedback:
      'Estimated analysis generated because the AI service was unavailable. This looks like a balanced plate; confirm portions after logging for better accuracy.',
  }, { userProfile, ...context });
};

const buildPrompt = (userProfile = {}, context = {}) => `
You are an expert nutritionist AI. Analyze this meal using the image and/or text description.

User context:
- Goal: ${userProfile.goal || 'maintain'}
- Daily target calories: ${Math.round(userProfile.tdee || 2000)}
- Diet preference: ${context.dietPreference || 'balanced'}
- Allergies or restrictions: ${context.allergies || 'none'}
- Meal description: ${context.mealDescription || 'not provided'}

Support Indian foods such as dal, roti, rice, sabzi, paneer, dosa, idli, poha, upma, chole, rajma, khichdi, biryani, curd, and chutney.

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
  "verdict": { "label": "Good", "reason": "Short reason" },
  "suggestions": ["add protein", "reduce oil", "swap rice with millet"],
  "feedback": "Short, practical nutrition feedback for the user's goal."
}
`;

export const analyzeMeal = async (base64Image, userProfile, context = {}) => {
  if (!apiKey) {
    return estimateLocally(userProfile, context);
  }

  const imagePayload = base64Image ? getImagePayload(base64Image) : null;
  const prompt = buildPrompt(userProfile, context);
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const parts = imagePayload ? [prompt, { inlineData: imagePayload }] : [prompt];
      const result = await model.generateContent(parts);
      const text = result.response.text();
      return normalizeAnalysis(extractJson(text), { userProfile, ...context });
    } catch (error) {
      lastError = error;
      console.warn(`[geminiService] ${modelName} failed:`, error.message);
    }
  }

  console.warn('[geminiService] Falling back to local estimate:', lastError?.message);
  return estimateLocally(userProfile, context);
};
