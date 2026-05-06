import React from 'react';

const MacroTracker = ({ profile, logs }) => {
  const totals = logs.reduce((acc, log) => {
    acc.calories += log.calories || 0;
    acc.protein += log.protein || 0;
    acc.carbs += log.carbs || 0;
    acc.fats += log.fat ?? log.fats ?? 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const stats = [
    { label: 'Calories', current: totals.calories, target: profile.tdee, color: 'primary', unit: 'kcal' },
    { label: 'Protein', current: totals.protein, target: profile.macros.protein, color: 'blue-500', unit: 'g' },
    { label: 'Carbs', current: totals.carbs, target: profile.macros.carbs, color: 'amber-500', unit: 'g' },
    { label: 'Fats', current: totals.fats, target: profile.macros.fat ?? profile.macros.fats ?? 0, color: 'rose-500', unit: 'g' },
  ];

  const CircularProgress = ({ value, target, size = 180, strokeWidth = 14, colorClass }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-muted/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            className={`text-primary`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-3xl font-black tracking-tighter">{Math.round(value)}</div>
          <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mt-[-2px]">
            OF {Math.round(target)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Calorie Ring */}
        <div className="md:col-span-1 flex flex-col items-center justify-center glassmorphism p-8 rounded-[2.5rem] border border-white/10 shadow-xl shadow-primary/5">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Calories</h3>
          <CircularProgress value={totals.calories} target={profile.tdee} />
          <div className="mt-6 text-center">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Remaining</div>
            <div className="text-xl font-black text-primary">{Math.max(0, Math.round(profile.tdee - totals.calories))} kcal</div>
          </div>
        </div>

        {/* Macro Bars */}
        <div className="md:col-span-3 glassmorphism p-8 rounded-[2.5rem] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Macronutrients</h3>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-full bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today's Summary</div>
            </div>
          </div>

          <div className="space-y-10">
            {stats.slice(1).map((stat) => {
              const percentage = stat.target > 0 ? Math.min((stat.current / stat.target) * 100, 100) : 0;
              return (
                <div key={stat.label} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-lg font-black tracking-tight">{stat.label}</span>
                      <span className="ml-2 text-xs font-bold text-muted-foreground">{Math.round(stat.current)}{stat.unit} / {Math.round(stat.target)}{stat.unit}</span>
                    </div>
                    <span className="text-xs font-black text-primary">{Math.round(percentage)}%</span>
                  </div>
                  <div className="h-4 bg-muted/30 rounded-full overflow-hidden border border-white/5 p-[2px]">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroTracker;
