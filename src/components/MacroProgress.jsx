import React from 'react';

/**
 * Reusable macro progress bar component.
 * @param {{ label: string, icon: string, current: number, target: number, unit: string, colorClass: string }} props
 */
const MacroProgress = ({ label, icon, current, target, unit, colorClass }) => {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const isOver = current > target;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-slate-700">
          <span aria-hidden="true">{icon}</span>
          {label}
          {isOver && (
            <span className="ml-1 text-rose-500" aria-label="Over target">⚠</span>
          )}
        </span>
        <span className="text-slate-500 tabular-nums">
          {Math.round(current)} / {target} {unit}
        </span>
      </div>
      <div
        className="w-full h-3 rounded-full bg-slate-200 overflow-hidden"
        role="progressbar"
        aria-label={`${label}: ${Math.round(current)} of ${target} ${unit}`}
        aria-valuenow={Math.round(current)}
        aria-valuemin={0}
        aria-valuemax={target}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isOver ? 'bg-rose-500' : colorClass
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default MacroProgress;
