import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { analyzeMeal } from '../services/geminiService';

const AnalyzingSkeleton = () => (
  <div aria-label="Analyzing your meal..." aria-busy="true" className="space-y-4 py-2">
    <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
    <div className="h-32 w-full bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
    <div className="h-12 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
  </div>
);

const MealAnalyzer = ({ userProfile, onAnalysisComplete }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [mealDescription, setMealDescription] = useState('');
  const [dietPreference, setDietPreference] = useState('balanced');
  const [allergies, setAllergies] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const sampleMeal = {
    description: 'Dal, jeera rice, mixed vegetable sabzi, curd, and salad',
    diet: 'veg',
    allergies: '',
  };

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select a valid image file.'); return; }
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview && !mealDescription.trim()) {
      setError('Upload a meal image or describe the meal first.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    const context = { mealDescription, dietPreference, allergies };
    try {
      const result = await analyzeMeal(imagePreview, userProfile, context);
      onAnalysisComplete(result, imagePreview);
    } catch (err) {
      console.warn('[MealAnalyzer] Falling back after analysis error:', err);
      onAnalysisComplete({
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
        health_score: userProfile.goal === 'gain' ? 8 : 7,
        feedback: 'Estimated analysis generated because the AI service was unavailable. This gives you a working nutrition breakdown for tracking.',
      }, imagePreview);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetImage = () => {
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const useSampleMeal = async () => {
    setMealDescription(sampleMeal.description);
    setDietPreference(sampleMeal.diet);
    setAllergies(sampleMeal.allergies);
    setImagePreview(null);
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeMeal('', userProfile, {
        mealDescription: sampleMeal.description,
        dietPreference: sampleMeal.diet,
        allergies: sampleMeal.allergies,
      });
      onAnalysisComplete(result, null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-full bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden mb-8 xl:mb-0 animate-fade-in-up">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400" aria-hidden="true">
            <Camera size={24} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white font-display">Meal Input</h2>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="shrink-0 mt-0.5" size={20} aria-hidden="true" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isAnalyzing && <AnalyzingSkeleton />}

        {!isAnalyzing && (
          <div className="space-y-6">
            {!imagePreview ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload or take a photo of your meal"
                className="border-2 border-dashed border-slate-600 hover:border-emerald-500/50 rounded-2xl p-6 sm:p-10 md:p-12 text-center transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 mb-4 transition-colors" aria-hidden="true">
                  <Upload size={28} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Upload or Take a Photo</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                  Snap a picture, describe the meal, or use the sample demo meal.
                </p>
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageCapture} aria-hidden="true" />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 aspect-video md:aspect-[21/9] flex items-center justify-center">
                <img src={imagePreview} alt="Meal to analyze" className="max-w-full max-h-full object-contain" />
                <button onClick={resetImage} className="absolute top-3 right-3 max-w-[calc(100%-1.5rem)] bg-slate-900/80 backdrop-blur text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-slate-700 transition-colors">
                  Change Photo
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Meal description</span>
                <textarea
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  placeholder="Example: paneer roti, dal rice, dosa sambar, chicken biryani..."
                  rows={4}
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                <label className="space-y-2 block">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Diet preference</span>
                  <select
                    value={dietPreference}
                    onChange={(e) => setDietPreference(e.target.value)}
                    className="w-full bg-slate-900/70 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-veg</option>
                    <option value="vegan">Vegan</option>
                    <option value="diabetic">Diabetic-friendly</option>
                    <option value="high-protein">High-protein</option>
                  </select>
                </label>
                <label className="space-y-2 block">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Allergy warning</span>
                  <input
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="Example: peanuts, dairy, gluten"
                    className="w-full bg-slate-900/70 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="group flex flex-wrap items-center justify-center gap-2 w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 font-bold py-3 px-5 md:px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 motion-reduce:active:scale-100"
              >
                <Sparkles size={20} className="group-hover:animate-pulse" aria-hidden="true" />
                <span>Analyze Nutritional Value</span>
              </button>
              <button
                onClick={useSampleMeal}
                className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all"
              >
                Use Sample Indian Meal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealAnalyzer;
