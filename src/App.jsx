import React, { useState, useEffect, useMemo } from 'react';
import ProfileSetup from './components/ProfileSetup';
import MealAnalyzer from './components/MealAnalyzer';
import AnalysisCard from './components/AnalysisCard';
import NutritionDashboard from './components/NutritionDashboard';
import Dashboard from './components/Dashboard';
import { logMeal, getTodayEntries, syncFromFirestore } from './services/logService';
import { loadProfile, saveProfile, clearProfile } from './services/profileService';
import { Activity, Leaf, LogOut, Flame, History, User, Utensils, ClipboardList } from 'lucide-react';

function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState('analyze');
  const [isInitializing, setIsInitializing] = useState(true);
  const [mealHistory, setMealHistory] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);

  useEffect(() => {
    const init = async () => {
      const profile = await loadProfile();
      if (profile) setUserProfile(profile);

      const savedHistory = localStorage.getItem('nutrisense_history');
      if (savedHistory) {
        try { setMealHistory(JSON.parse(savedHistory)); } catch { /* ignore */ }
      }

      setTodayEntries(getTodayEntries());
      setIsInitializing(false);

      await syncFromFirestore();
      setTodayEntries(getTodayEntries());
    };
    init();
  }, []);

  const handleProfileComplete = (profile) => {
    setUserProfile(profile);
    saveProfile(profile);
    setActiveTab('analyze');
  };

  const handleAnalysisComplete = (result, image) => {
    setAnalysisResult({ ...result, image });
  };

  const handleLogMeal = (analysis) => {
    logMeal(analysis);
    setTodayEntries(getTodayEntries());

    const newHistory = [
      {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        mealName: analysis.items?.map((i) => i.name).join(', ') || 'Meal',
        image: analysis.image,
        calories: analysis.total_calories,
        protein: analysis.total_protein,
        carbs: analysis.total_carbs,
        fat: analysis.total_fats,
        health_score: analysis.health_score,
      },
      ...mealHistory,
    ];
    setMealHistory(newHistory);
    localStorage.setItem('nutrisense_history', JSON.stringify(newHistory));
    setActiveTab('log');
  };

  const handleDeleteMeal = () => {
    setTodayEntries(getTodayEntries());
  };

  const handleLogout = () => {
    clearProfile();
    localStorage.removeItem('nutrisense_history');
    localStorage.removeItem('nutrisense_log');
    setUserProfile(null);
    setAnalysisResult(null);
    setMealHistory([]);
    setTodayEntries([]);
  };

  // Derived calorie budget.
  const todayCalories = useMemo(
    () => todayEntries.reduce((sum, e) => sum + (e.estimatedCalories ?? 0), 0),
    [todayEntries]
  );
  const calorieTarget = userProfile?.tdee ?? 2000;
  const remaining = Math.round(calorieTarget - todayCalories);
  const calorieProgress = Math.min(100, (todayCalories / calorieTarget) * 100) || 0;

  const getTodayStats = () => {
    const today = new Date().toDateString();
    return mealHistory
      .filter((m) => new Date(m.timestamp).toDateString() === today)
      .reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          protein:  acc.protein  + (m.protein || 0),
          carbs:    acc.carbs    + (m.carbs   || 0),
          fat:      acc.fat      + (m.fat     || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin text-primary">
          <Activity size={32} />
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  const navItems = [
    { id: 'analyze',   label: 'Analyze Meal',  Icon: Utensils },
    { id: 'log',       label: "Today's Log",   Icon: ClipboardList },
    { id: 'history',   label: 'Trends',        Icon: History },
    { id: 'dashboard', label: 'Insights',      Icon: Activity },
    { id: 'profile',   label: 'Profile',       Icon: User },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 glassmorphism border-r border-border hidden md:flex flex-col z-10">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-xl" aria-hidden="true">
              <Leaf size={24} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-display tracking-tight">
              NutriSense
            </h1>
          </div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest ml-1">
            AI Nutrition Dashboard
          </p>
        </div>

        <nav aria-label="Main navigation" className="flex-1 px-4 py-4 space-y-2">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              id={`tab-${id}`}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === id
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Icon
                size={20}
                className={activeTab === id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                aria-hidden="true"
              />
              <span className="font-semibold">{label}</span>
              {id === 'log' && todayEntries.length > 0 && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                  {todayEntries.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Calorie budget card */}
        <div className="p-6 m-4 glassmorphism bg-white/5 rounded-2xl border border-white/5 mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Daily Target
            </span>
            <Flame size={14} className="text-primary animate-pulse" aria-hidden="true" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-bold mb-1.5 flex-wrap gap-1">
                <span>Today's Intake</span>
                <span className="text-primary">
                  {Math.round(todayCalories)} / {Math.round(calorieTarget)} kcal
                </span>
              </div>
              <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    calorieProgress > 100 ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${calorieProgress}%` }}
                />
              </div>
              {/* Live remaining budget */}
              <p
                aria-live="polite"
                className={`text-xs font-semibold mt-2 ${
                  remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {remaining >= 0
                  ? `${remaining} kcal remaining`
                  : `${Math.abs(remaining)} kcal over budget`}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            >
              <LogOut size={14} aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t border-border flex"
      >
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            id={`tab-mobile-${id}`}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-bold transition-colors ${
              activeTab === id ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main
        id="main-content"
        className="flex-1 overflow-y-auto relative scroll-smooth pb-20 md:pb-0"
      >
        {/* Mobile header with calorie budget */}
        <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Leaf size={18} className="text-primary" aria-hidden="true" />
            <span className="font-bold text-base tracking-tight">NutriSense</span>
          </div>
          <p
            aria-live="polite"
            className={`text-xs font-semibold ${
              remaining >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {remaining >= 0
              ? `${remaining} kcal remaining`
              : `${Math.abs(remaining)} kcal over budget`}
          </p>
        </header>

        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-12 animate-fade-in-up">

          {/* Analyze meal */}
          <section
            aria-labelledby="tab-analyze"
            role="tabpanel"
            hidden={activeTab !== 'analyze'}
            className="space-y-10"
          >
            {activeTab === 'analyze' && (
              <>
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-display">
                    Analyze Your Meal
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Snap a photo or describe what you're eating for a real-time nutritional breakdown.
                  </p>
                </div>

                <MealAnalyzer userProfile={userProfile} onAnalysisComplete={handleAnalysisComplete} />

                {analysisResult ? (
                  <div className="animate-fade-in-up">
                    <AnalysisCard analysis={analysisResult} userProfile={userProfile} onLogMeal={handleLogMeal} />
                  </div>
                ) : (
                  /* Empty analysis state */
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <div
                      className="w-[120px] h-[120px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <Leaf size={56} className="text-emerald-400" />
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                      Your meal analysis will appear here
                    </p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Today's log */}
          <section
            aria-labelledby="tab-log"
            role="tabpanel"
            hidden={activeTab !== 'log'}
          >
            {activeTab === 'log' && (
              <Dashboard
                entries={todayEntries}
                profile={userProfile}
                onDeleteMeal={handleDeleteMeal}
                onSwitchTab={setActiveTab}
              />
            )}
          </section>

          {/* Trends */}
          <section
            aria-labelledby="tab-history"
            role="tabpanel"
            hidden={activeTab !== 'history'}
            className="space-y-8"
          >
            {activeTab === 'history' && (
              <>
                <div className="flex justify-between items-end flex-wrap gap-2">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-display">
                    Nutrition History
                  </h2>
                  <p className="text-muted-foreground font-medium">
                    {mealHistory.length} meals logged
                  </p>
                </div>

                {mealHistory.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {mealHistory.map((meal) => (
                      <div
                        key={meal.id}
                        className="glassmorphism p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-6 items-start md:items-center transition-shadow duration-200 hover:shadow-md"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-bold">{meal.mealName || 'Analyzed Meal'}</h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                              {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(meal.timestamp).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-4 md:gap-8">
                          {[
                            { label: 'Calories', value: Math.round(meal.calories), color: 'text-primary' },
                            { label: 'Protein',  value: `${Math.round(meal.protein)}g` },
                            { label: 'Carbs',    value: `${Math.round(meal.carbs)}g` },
                            { label: 'Fat',      value: `${Math.round(meal.fat)}g` },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="text-center">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">{label}</p>
                              <p className={`text-lg font-bold ${color || ''}`}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glassmorphism p-16 rounded-3xl text-center border-dashed border-2 border-border/50">
                    <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <History size={40} className="text-primary opacity-50" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">No Meals Logged Yet</h3>
                    <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                      Start analyzing and logging your meals to see your nutritional trends here.
                    </p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Insights */}
          <section
            aria-labelledby="tab-dashboard"
            role="tabpanel"
            hidden={activeTab !== 'dashboard'}
            className="space-y-8"
          >
            {activeTab === 'dashboard' && (
              <>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-display">
                  Health Insights
                </h2>
                <NutritionDashboard
                  mealLogs={mealHistory}
                  profile={userProfile}
                  onAddMeal={() => setActiveTab('analyze')}
                />
              </>
            )}
          </section>

          {/* Profile */}
          <section
            aria-labelledby="tab-profile"
            role="tabpanel"
            hidden={activeTab !== 'profile'}
            className="space-y-8"
          >
            {activeTab === 'profile' && (
              <>
                <h2
                  id="profile-heading"
                  className="text-3xl md:text-4xl font-bold tracking-tight font-display"
                >
                  Health Profile
                </h2>
                <ProfileSetup onComplete={handleProfileComplete} initialData={userProfile} />
              </>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}

export default App;
