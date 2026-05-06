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

  const {
    items,
    total_calories,
    total_protein,
    total_carbs,
    total_fats,
    health_score,
    feedback,
    verdict,
    suggestions = [],
    allergy_warning,
    diet_preference,
    manual_description,
  } = analysis;

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

  const reportText = [
    'NutriSense Nutrition Report',
    `Verdict: ${verdict?.label || 'Fair'} - ${verdict?.reason || 'Review portions and macros.'}`,
    `Calories: ${total_calories} kcal`,
    `Protein: ${total_protein}g`,
    `Carbs: ${total_carbs}g`,
    `Fats: ${total_fats}g`,
    diet_preference ? `Diet preference: ${diet_preference}` : '',
    manual_description ? `Meal description: ${manual_description}` : '',
    allergy_warning ? `Allergy warning: ${allergy_warning}` : '',
    suggestions.length ? `Suggestions: ${suggestions.join('; ')}` : '',
    `Feedback: ${feedback}`,
  ].filter(Boolean).join('\n');

  const downloadReport = () => {
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nutrisense-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareReport = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'NutriSense Nutrition Report', text: reportText });
      return;
    }
    await navigator.clipboard.writeText(reportText);
  };

  return (
    <div
      className={`w-full max-w-full bg-card rounded-2xl shadow-xl border border-border overflow-hidden transition-opacity duration-300 motion-reduce:transition-none ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Header */}
      <div className="p-5 md:p-8 border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="min-w-0 max-w-full">
          <h2 className="text-xl md:text-2xl font-bold text-foreground font-display flex items-center gap-2 mb-2 break-words">
            <PieChart className="text-emerald-400 shrink-0" aria-hidden="true" />
            Nutritional Analysis
          </h2>
          <p className="text-muted-foreground text-sm break-words">Based on your daily targets ({userProfile.tdee} kcal)</p>
        </div>
        <div className={`w-full md:w-auto px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[120px] ${getScoreColor(health_score)}`} aria-label={`Health score: ${health_score} out of 10`}>
          <span className="text-sm font-medium mb-1">Health Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-display">{health_score}</span>
            <span className="text-sm opacity-70">/10</span>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8 border-b border-border grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Meal Verdict</p>
          <p className="text-xl font-black mt-1">{verdict?.label || 'Fair'}</p>
          <p className="text-sm text-muted-foreground mt-1">{verdict?.reason || 'Review portions and macro balance.'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Diet Match</p>
          <p className="text-xl font-black mt-1 capitalize">{diet_preference || 'Balanced'}</p>
          <p className="text-sm text-muted-foreground mt-1">Suggestions are personalized to this preference.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Allergy Check</p>
          <p className="text-sm text-amber-300 mt-2">{allergy_warning || 'No allergy warning added.'}</p>
        </div>
      </div>

      <div className="p-5 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left: Macros + Feedback */}
        <div className="space-y-8">
          <div className="space-y-5">
            <h3 className="text-base md:text-lg font-medium text-foreground mb-4">Macro Contribution</h3>
            {[
              { label: 'Calories', value: `${total_calories} / ${Math.round(userProfile.tdee)} kcal`, pct: calsPercent, barCls: 'bg-emerald-500', textCls: 'text-emerald-400' },
              { label: 'Protein',  value: `${total_protein}g / ${userProfile.macros.protein}g`,        pct: proteinPercent, barCls: 'bg-blue-500',    textCls: 'text-blue-400' },
              { label: 'Carbs',    value: `${total_carbs}g / ${userProfile.macros.carbs}g`,            pct: carbsPercent,   barCls: 'bg-amber-500',   textCls: 'text-amber-400' },
              { label: 'Fats',     value: `${total_fats}g / ${fatTarget}g`,                          pct: fatsPercent,    barCls: 'bg-rose-500',    textCls: 'text-rose-400' },
            ].map(({ label, value, pct: p, barCls, textCls }) => (
              <div key={label}>
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm mb-1.5">
                  <span className="text-muted-foreground font-medium shrink-0">{label}</span>
                  <span className={`${textCls} text-right break-words`}>{value}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                  <div className={`h-full ${barCls} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${p}%` }} />
                </div>
              </div>
            ))}
          </div>

          {feedback && (
            <div className="bg-muted rounded-xl p-4 md:p-5 border border-border max-w-full overflow-hidden">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Info size={16} className="text-emerald-400" aria-hidden="true" />
                AI Insights
              </h3>
              <p className="text-foreground text-sm leading-relaxed break-words">{feedback}</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="bg-emerald-500/10 rounded-xl p-4 md:p-5 border border-emerald-500/20 max-w-full overflow-hidden">
              <h3 className="text-sm font-bold text-emerald-300 mb-3">Personalized Suggestions</h3>
              <ul className="space-y-2">
                {suggestions.map((suggestion) => (
                  <li key={suggestion} className="text-sm text-foreground leading-relaxed break-words">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Detected Items */}
        <div>
          <h3 className="text-base md:text-lg font-medium text-foreground mb-4">Detected Items</h3>
          <div className="space-y-3">
            {(items || []).map((item, idx) => (
              <div key={idx} className="bg-muted p-4 rounded-xl border border-border flex flex-col gap-4 max-w-full overflow-hidden">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0" aria-hidden="true">
                    {item.confidence > 0.8
                      ? <CheckCircle2 size={18} className="text-emerald-400" />
                      : <AlertTriangle size={18} className="text-amber-400" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-foreground font-medium capitalize break-words">{item.name}</h4>
                    <p className="text-muted-foreground text-xs">Confidence: {Math.round(item.confidence * 100)}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm bg-card p-2 rounded-lg">
                  {[
                    { label: 'Cals', val: item.calories,         cls: '' },
                    { label: 'P',    val: `${item.protein}g`,    cls: 'text-blue-400' },
                    { label: 'C',    val: `${item.carbs}g`,      cls: 'text-amber-400' },
                    { label: 'F',    val: `${item.fats}g`,       cls: 'text-rose-400' },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="flex flex-col min-w-0">
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <span className={`font-medium break-words ${cls}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log button */}
      <div className="p-5 md:p-8 pt-0 border-t border-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={downloadReport}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold hover:bg-white/10 transition-colors"
          >
            Download Report
          </button>
          <button
            onClick={shareReport}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold hover:bg-white/10 transition-colors"
          >
            Share / Copy Report
          </button>
        </div>
        <button
          onClick={() => { onLogMeal(analysis); setIsLogged(true); }}
          disabled={isLogged}
          aria-label={isLogged ? 'Meal already logged' : 'Log this meal to today\'s history'}
          className={`w-full flex flex-wrap items-center justify-center gap-2 py-4 px-4 md:px-6 rounded-xl font-bold text-sm md:text-base transition-all active:scale-95 motion-reduce:active:scale-100 ${
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
