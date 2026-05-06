import React, { useEffect, useState } from 'react';
import MacroTracker from './MacroTracker';

const HYDRATION_KEY = 'nutrisense_hydration_ml';
const HYDRATION_GOAL_ML = 3000;
const HYDRATION_STEP_ML = 250;

const NutritionDashboard = ({ profile = {}, mealLogs = [], onAddMeal = () => {} }) => {
  const recentMeals = [...mealLogs].reverse().slice(0, 5);
  const displayName = profile.name || 'there';
  const [hydrationMl, setHydrationMl] = useState(() => {
    const saved = Number(localStorage.getItem(HYDRATION_KEY));
    return Number.isFinite(saved) ? saved : 1200;
  });

  useEffect(() => {
    localStorage.setItem(HYDRATION_KEY, String(hydrationMl));
  }, [hydrationMl]);

  const hydrationBlocks = 8;
  const filledBlocks = Math.round((hydrationMl / HYDRATION_GOAL_ML) * hydrationBlocks);
  const hydrationText = `${(hydrationMl / 1000).toFixed(2).replace(/\.?0+$/, '')}L / 3L`;
  const addWater = () => {
    setHydrationMl((current) => Math.min(current + HYDRATION_STEP_ML, HYDRATION_GOAL_ML));
  };
  const resetWater = () => setHydrationMl(0);
  const weeklyCalories = mealLogs.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const weeklyProtein = mealLogs.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const avgCalories = mealLogs.length ? Math.round(weeklyCalories / Math.min(mealLogs.length, 7)) : 0;
  const weeklySummary = mealLogs.length
    ? `This week you logged ${mealLogs.length} meal${mealLogs.length === 1 ? '' : 's'}, averaging ${avgCalories} kcal per logged meal with ${Math.round(weeklyProtein)}g protein total.`
    : 'Log meals to unlock a weekly pattern summary for calories, protein, and meal quality.';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Welcome back, <span className="text-primary">{displayName}</span>!
          </h1>
          <p className="text-muted-foreground font-medium">
            Here's your nutritional summary for today.
          </p>
        </div>
        <button
          onClick={onAddMeal}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          Analyze New Meal
        </button>
      </div>

      {/* Stats Overview */}
      <MacroTracker profile={profile} logs={mealLogs} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Meals */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Recent Meals</h2>
            <button className="text-sm font-bold text-primary hover:underline">View All History</button>
          </div>
          
          <div className="space-y-4">
            {recentMeals.length > 0 ? (
              recentMeals.map((meal, index) => (
                <div key={index} className="glassmorphism p-6 rounded-3xl border border-white/10 flex items-center gap-6 hover:border-primary/30 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden flex-shrink-0 border border-white/5">
                    {meal.image ? (
                      <img src={meal.image} alt={meal.mealName || meal.foodName || 'Logged meal'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-black text-primary">MEAL</div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-black text-lg">{meal.mealName || meal.foodName || 'Logged meal'}</h4>
                    <div className="flex gap-4 mt-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{meal.calories} kcal</span>
                      <span aria-hidden="true">/</span>
                      <span>{meal.protein}g P</span>
                      <span aria-hidden="true">/</span>
                      <span>{meal.carbs}g C</span>
                      <span aria-hidden="true">/</span>
                      <span>{meal.fat ?? meal.fats}g F</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-muted-foreground mb-1">{new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter rounded-lg border border-primary/20">
                      Healthy
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="glassmorphism p-12 rounded-[2.5rem] border border-white/10 text-center space-y-4">
                <div className="text-4xl font-black text-primary">+</div>
                <h4 className="text-xl font-black">No meals logged yet</h4>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Take a photo of your first meal to start tracking your nutrition automatically.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights & Quick Tracking */}
        <div className="space-y-8">
          {/* AI Insight Card */}
          <div className="glassmorphism p-8 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-xl font-black text-primary-foreground shadow-lg shadow-primary/20">AI</div>
              <h3 className="text-lg font-black uppercase tracking-widest text-primary">AI Insight</h3>
            </div>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              Based on your activity level and today's intake, we recommend adding some <span className="text-foreground font-bold">leafy greens</span> to your next meal to boost your fiber and micronutrients.
            </p>
            <button className="mt-6 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
              Tell me more
            </button>
          </div>

          <div className="glassmorphism p-8 rounded-[2.5rem] border border-white/10">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Weekly Summary</h3>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">{weeklySummary}</p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase">Meals</p>
                <p className="text-2xl font-black">{mealLogs.length}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase">Avg kcal</p>
                <p className="text-2xl font-black">{avgCalories}</p>
              </div>
            </div>
          </div>

          {/* Water Tracker */}
          <div className="glassmorphism p-8 rounded-[2.5rem] border border-white/10">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Hydration</h3>
                <span className="text-primary font-black text-lg">{hydrationText}</span>
             </div>
             <div className="flex gap-2 mb-6" aria-label={`Hydration progress ${hydrationText}`}>
                {Array.from({ length: hydrationBlocks }, (_, index) => index + 1).map((i) => (
                  <div key={i} className={`flex-grow h-12 rounded-lg border ${i <= filledBlocks ? 'bg-primary border-primary/20 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]' : 'bg-muted/30 border-white/5'} transition-all`}></div>
                ))}
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
               <button
                 onClick={addWater}
                 disabled={hydrationMl >= HYDRATION_GOAL_ML}
                 className="w-full py-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white disabled:opacity-50 disabled:hover:bg-primary/10 disabled:hover:text-primary transition-all"
               >
                  {hydrationMl >= HYDRATION_GOAL_ML ? 'Goal Reached' : 'Add 250ml'}
               </button>
               <button
                 onClick={resetWater}
                 className="px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
               >
                 Reset
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionDashboard;
