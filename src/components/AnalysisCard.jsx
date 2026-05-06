import { useState, useEffect } from 'react';
import { PieChart, Info, CheckCircle2, AlertTriangle, PlusCircle } from 'lucide-react';

const AnalysisCard = ({ analysis, userProfile, onLogMeal }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (!analysis) return null;

  const { items, total_calories, total_protein, total_carbs, total_fats, health_score, feedback } = analysis;

  const pct = (amount, target) => Math.min(Math.round((amount / target) * 100), 100);
  const fatTarget = userProfile.macros.fat ?? userProfile.macros.fats ?? 1;
  const calsPercent    = pct(total_calories, userProfile.tdee);
  const proteinPercent = pct(total_protein,  userProfile.macros.protein);
  const carbsPercent   = pct(total_carbs,    userProfile.macros.carbs);
  const fatsPercent    = pct(total_fats,     fatTarget);

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 5) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div
      className={`bg-card rounded-2xl shadow-xl border border-border overflow-hidden transition-opacity duration-300 motion-reduce:transition-none ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-2 mb-2">
            <PieChart className="text-emerald-400" aria-hidden="true" />
            Nutritional Analysis
          </h2>
          <p className="text-muted-foreground text-sm">Based on your daily targets ({userProfile.tdee} kcal)</p>
        </div>
        <div className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[120px] ${getScoreColor(health_score)}`} aria-label={`Health score: ${health_score} out of 10`}>
          <span className="text-sm font-medium mb-1">Health Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-display">{health_score}</span>
            <span className="text-sm opacity-70">/10</span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Macros + Feedback */}
        <div className="space-y-8">
          <div className="space-y-5">
            <h3 className="text-lg font-medium text-foreground mb-4">Macro Contribution</h3>
            {[
              { label: 'Calories', value: `${total_calories} / ${Math.round(userProfile.tdee)} kcal`, pct: calsPercent, barCls: 'bg-emerald-500', textCls: 'text-emerald-400' },
              { label: 'Protein',  value: `${total_protein}g / ${userProfile.macros.protein}g`,        pct: proteinPercent, barCls: 'bg-blue-500',    textCls: 'text-blue-400' },
              { label: 'Carbs',    value: `${total_carbs}g / ${userProfile.macros.carbs}g`,            pct: carbsPercent,   barCls: 'bg-amber-500',   textCls: 'text-amber-400' },
              { label: 'Fats',     value: `${total_fats}g / ${fatTarget}g`,                          pct: fatsPercent,    barCls: 'bg-rose-500',    textCls: 'text-rose-400' },
            ].map(({ label, value, pct: p, barCls, textCls }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground font-medium">{label}</span>
                  <span className={textCls}>{value}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                  <div className={`h-full ${barCls} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${p}%` }} />
                </div>
              </div>
            ))}
          </div>

          {feedback && (
            <div className="bg-muted rounded-xl p-5 border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Info size={16} className="text-emerald-400" aria-hidden="true" />
                AI Insights
              </h3>
              <p className="text-foreground text-sm leading-relaxed">{feedback}</p>
            </div>
          )}
        </div>

        {/* Right: Detected Items */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Detected Items</h3>
          <div className="space-y-3">
            {(items || []).map((item, idx) => (
              <div key={idx} className="bg-muted p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5" aria-hidden="true">
                    {item.confidence > 0.8
                      ? <CheckCircle2 size={18} className="text-emerald-400" />
                      : <AlertTriangle size={18} className="text-amber-400" />}
                  </div>
                  <div>
                    <h4 className="text-foreground font-medium capitalize">{item.name}</h4>
                    <p className="text-muted-foreground text-xs">Confidence: {Math.round(item.confidence * 100)}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-4 text-sm bg-card p-2 sm:p-0 rounded-lg sm:bg-transparent">
                  {[
                    { label: 'Cals', val: item.calories,         cls: '' },
                    { label: 'P',    val: `${item.protein}g`,    cls: 'text-blue-400' },
                    { label: 'C',    val: `${item.carbs}g`,      cls: 'text-amber-400' },
                    { label: 'F',    val: `${item.fats}g`,       cls: 'text-rose-400' },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <span className={`font-medium ${cls}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log button */}
      <div className="p-6 md:p-8 pt-0 border-t border-border">
        <button
          onClick={() => { onLogMeal(analysis); setIsLogged(true); }}
          disabled={isLogged}
          aria-label={isLogged ? 'Meal already logged' : 'Log this meal to today\'s history'}
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold transition-all active:scale-95 motion-reduce:active:scale-100 ${
            isLogged
              ? 'bg-emerald-500/20 text-emerald-500 cursor-default border border-emerald-500/20'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
          }`}
        >
          {isLogged
            ? <><CheckCircle2 size={20} aria-hidden="true" /> Meal Logged Successfully</>
            : <><PlusCircle size={20} aria-hidden="true" /> Log This Meal to History</>}
        </button>
      </div>
    </div>
  );
};

export default AnalysisCard;
