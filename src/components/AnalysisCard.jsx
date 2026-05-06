import { useState } from 'react';
import { PieChart, Info, CheckCircle2, AlertTriangle, ArrowRight, PlusCircle } from 'lucide-react';

const AnalysisCard = ({ analysis, userProfile, onLogMeal }) => {
  const [isLogged, setIsLogged] = useState(false);
  if (!analysis) return null;

  const { items, total_calories, total_protein, total_carbs, total_fats, health_score, feedback } = analysis;
  
  // Calculate percentages against user daily targets
  const getPercentage = (amount, target) => Math.min(Math.round((amount / target) * 100), 100);
  
  const calsPercent = getPercentage(total_calories, userProfile.tdee);
  const proteinPercent = getPercentage(total_protein, userProfile.macros.protein);
  const carbsPercent = getPercentage(total_carbs, userProfile.macros.carbs);
  const fatsPercent = getPercentage(total_fats, userProfile.macros.fats);

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 5) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-fade-in-up">
      
      {/* Header section with score */}
      <div className="p-6 md:p-8 border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-2 mb-2">
            <PieChart className="text-emerald-400" />
            Nutritional Analysis
          </h2>
          <p className="text-muted-foreground text-sm">Based on your daily targets ({userProfile.tdee} kcal)</p>
        </div>
        
        <div className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[120px] ${getScoreColor(health_score)}`}>
          <span className="text-sm font-medium mb-1">Health Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-display">{health_score}</span>
            <span className="text-sm opacity-70">/10</span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left column: Macros & Feedback */}
        <div className="space-y-8">
          
          {/* Macro Progress Bars */}
          <div className="space-y-5">
            <h3 className="text-lg font-medium text-foreground mb-4">Macro Contribution</h3>
            
            {/* Calories */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground font-medium">Calories</span>
                <span className="text-emerald-400">{total_calories} / {Math.round(userProfile.tdee)} kcal</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${calsPercent}%` }}
                />
              </div>
            </div>

            {/* Protein */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground font-medium">Protein</span>
                <span className="text-blue-400">{total_protein}g / {userProfile.macros.protein}g</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out delay-100"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground font-medium">Carbs</span>
                <span className="text-amber-400">{total_carbs}g / {userProfile.macros.carbs}g</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out delay-200"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>

            {/* Fats */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground font-medium">Fats</span>
                <span className="text-rose-400">{total_fats}g / {userProfile.macros.fats}g</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out delay-300"
                  style={{ width: `${fatsPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* AI Feedback */}
          <div className="bg-muted rounded-xl p-5 border border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Info size={16} className="text-emerald-400" />
              AI Insights
            </h3>
            <p className="text-foreground text-sm leading-relaxed">{feedback}</p>
          </div>
        </div>

        {/* Right column: Detected Items */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Detected Items</h3>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="bg-muted p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.confidence > 0.8 ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={18} className="text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-foreground font-medium capitalize">{item.name}</h4>
                    <p className="text-muted-foreground text-xs">
                      Confidence: {Math.round(item.confidence * 100)}%
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm sm:text-right bg-card p-2 sm:p-0 rounded-lg sm:bg-transparent">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Cals</span>
                    <span className="text-foreground font-medium">{item.calories}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">P</span>
                    <span className="text-blue-400 font-medium">{item.protein}g</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">C</span>
                    <span className="text-amber-400 font-medium">{item.carbs}g</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">F</span>
                    <span className="text-rose-400 font-medium">{item.fats}g</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="p-6 md:p-8 pt-0 border-t border-border flex gap-4">
        <button 
          onClick={() => {
            onLogMeal(analysis);
            setIsLogged(true);
          }}
          disabled={isLogged}
          className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold transition-all ${
            isLogged 
              ? 'bg-emerald-500/20 text-emerald-500 cursor-default border border-emerald-500/20' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95'
          }`}
        >
          {isLogged ? (
            <>
              <CheckCircle2 size={20} />
              Meal Logged Successfully
            </>
          ) : (
            <>
              <PlusCircle size={20} />
              Log This Meal to History
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AnalysisCard;
