import React from 'react';
import MacroProgress from './MacroProgress';
import { aggregateMacros } from '../utils/nutrition';
import { deleteMeal } from '../services/logService';
import { Trash2 } from 'lucide-react';

const verdictConfig = {
  good:    { label: 'Good',  cls: 'bg-emerald-100 text-emerald-700' },
  partial: { label: '~ Fair',  cls: 'bg-amber-100 text-amber-700' },
  avoid:   { label: 'Avoid', cls: 'bg-rose-100 text-rose-700' },
};

const formatTime = (isoString) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));

const formatDate = () =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

/**
 * Today's Log Dashboard
 * @param {{ entries: Array, profile: Object, onDeleteMeal: (id: string) => void, onSwitchTab: (tab: string) => void }} props
 */
const Dashboard = ({ entries = [], profile = {}, onDeleteMeal, onSwitchTab }) => {
  const totals = aggregateMacros(entries);
  const caloTarget = profile.dailyCalorieTarget ?? profile.tdee ?? 2000;

  const macros = [
    {
      label: 'Calories',
      icon: 'Cal',
      current: totals.calories,
      target: caloTarget,
      unit: 'kcal',
      colorClass: 'bg-emerald-500',
    },
    {
      label: 'Protein',
      icon: 'P',
      current: totals.protein,
      target: Math.round(caloTarget * 0.075),
      unit: 'g',
      colorClass: 'bg-sky-500',
    },
    {
      label: 'Carbs',
      icon: 'C',
      current: totals.carbs,
      target: Math.round(caloTarget * 0.1375),
      unit: 'g',
      colorClass: 'bg-violet-500',
    },
    {
      label: 'Fat',
      icon: 'F',
      current: totals.fat,
      target: Math.round(caloTarget * 0.0333),
      unit: 'g',
      colorClass: 'bg-orange-500',
    },
  ];

  const handleDelete = (entry) => {
    deleteMeal(entry.id);
    onDeleteMeal(entry.id);
  };

  return (
    <div className="space-y-8 max-w-full overflow-hidden">
      {/* Section A — Daily Summary Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{formatDate()}</h2>
        <p className="text-slate-400 mt-1 font-medium">
          {entries.length} meal{entries.length !== 1 ? 's' : ''} logged -{' '}
          {Math.round(totals.calories)} kcal consumed
        </p>
      </div>

      {/* Section B — Macro Progress */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg overflow-hidden">
        <h2 className="text-lg font-semibold text-slate-200 mb-5">Today's Progress</h2>
        <div aria-live="polite" className="space-y-4">
          {macros.map((m) => (
            <MacroProgress key={m.label} {...m} />
          ))}
        </div>
      </div>

      {/* Section C — Meal List */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
          <span className="text-5xl font-black text-emerald-400" aria-hidden="true">+</span>
          <p className="text-lg font-medium text-slate-600">No meals logged today</p>
          <p className="text-sm text-slate-400">Analyze your first meal to get started</p>
          <button
            onClick={() => onSwitchTab('analyze')}
            aria-label="Go to Analyze Meal tab"
            className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            Analyze a Meal
          </button>
        </div>
      ) : (
        <div
          role="list"
          aria-label="Today's logged meals"
          className="space-y-3"
        >
          {entries.map((entry) => {
            const vc = verdictConfig[entry.verdict] ?? verdictConfig.partial;
            return (
              <div
                key={entry.id}
                role="listitem"
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden"
              >
                {/* Left */}
                <div className="flex-1 min-w-0 w-full">
                  <p className="font-medium text-slate-800 truncate">{entry.mealName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400">{formatTime(entry.loggedAt)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${vc.cls}`}>
                      {vc.label}
                    </span>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-slate-800 font-bold text-base">
                      {entry.estimatedCalories}
                    </span>{' '}
                    <span className="text-slate-400 text-xs">kcal</span>
                  </div>
                  <button
                    onClick={() => handleDelete(entry)}
                    aria-label={`Delete ${entry.mealName} from today's log`}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
