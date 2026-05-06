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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeMeal(imagePreview, userProfile);
      onAnalysisComplete(result, imagePreview);
    } catch (err) {
      setError(err.message || 'Failed to analyze meal. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetImage = () => {
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden mb-8 animate-fade-in-up">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400" aria-hidden="true">
            <Camera size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Analyze Meal</h2>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="shrink-0 mt-0.5" size={20} aria-hidden="true" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isAnalyzing && <AnalyzingSkeleton />}

        {!isAnalyzing && !imagePreview && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload or take a photo of your meal"
            className="border-2 border-dashed border-slate-600 hover:border-emerald-500/50 rounded-2xl p-12 text-center transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 mb-4 transition-colors" aria-hidden="true">
              <Upload size={28} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Upload or Take a Photo</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Snap a picture of your meal for an instant nutritional breakdown using Gemini AI.
            </p>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageCapture} aria-hidden="true" />
          </div>
        )}

        {!isAnalyzing && imagePreview && (
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 aspect-video md:aspect-[21/9] flex items-center justify-center">
              <img src={imagePreview} alt="Meal to analyze" className="max-w-full max-h-full object-contain" />
              <button onClick={resetImage} className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-700 transition-colors">
                Change Photo
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="group flex items-center justify-center gap-2 w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 motion-reduce:active:scale-100"
              >
                <Sparkles size={20} className="group-hover:animate-pulse" aria-hidden="true" />
                <span>Analyze Nutritional Value</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealAnalyzer;
