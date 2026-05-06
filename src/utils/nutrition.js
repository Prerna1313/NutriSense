/**
 * Calculates BMR (Basal Metabolic Rate) using the Mifflin-St Jeor Equation.
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @param {number} age - Age in years
 * @param {'male' | 'female'} gender - Gender
 * @returns {number} BMR in calories
 */
export const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age || !gender) return 0;
  
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  
  return Math.round(bmr);
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * @param {number} bmr - Basal Metabolic Rate
 * @param {'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'} activityLevel 
 * @returns {number} TDEE in calories
 */
export const calculateTDEE = (bmr, activityLevel) => {
  if (!bmr || !activityLevel) return 0;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = multipliers[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
};

/**
 * Estimates macronutrient needs based on TDEE and goal.
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {'lose' | 'maintain' | 'gain'} goal - User's weight goal
 * @returns {Object} Macronutrient breakdown in grams and target calories
 */
export const calculateMacros = (tdee, goal) => {
  if (!tdee || !goal) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

  let targetCalories = tdee;
  
  if (goal === 'lose') {
    targetCalories -= 500; // 500 cal deficit for ~0.5kg/week loss
  } else if (goal === 'gain') {
    targetCalories += 300; // 300 cal surplus for lean gain
  }

  // General macro split: 30% Protein, 40% Carbs, 30% Fat
  const proteinCals = targetCalories * 0.30;
  const carbsCals = targetCalories * 0.40;
  const fatCals = targetCalories * 0.30;

  return {
    calories: Math.round(targetCalories),
    protein: Math.round(proteinCals / 4), // 4 cals per gram of protein
    carbs: Math.round(carbsCals / 4),     // 4 cals per gram of carbs
    fat: Math.round(fatCals / 9),         // 9 cals per gram of fat
  };
};

/**
 * Aggregates macros from an array of meal log entries.
 * @param {Array} entries - Array of log entry objects
 * @returns {{ calories: number, protein: number, carbs: number, fat: number, fiber: number }}
 */
export const aggregateMacros = (entries = []) => {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.estimatedCalories || 0),
      protein: acc.protein + (entry.macros?.protein || 0),
      carbs: acc.carbs + (entry.macros?.carbs || 0),
      fat: acc.fat + (entry.macros?.fat || 0),
      fiber: acc.fiber + (entry.macros?.fiber || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
};
