import React, { useState, useEffect } from 'react';
import ProfileSetup from './components/ProfileSetup';
import MealAnalyzer from './components/MealAnalyzer';
import AnalysisCard from './components/AnalysisCard';
import NutritionDashboard from './components/NutritionDashboard';
import Dashboard from './components/Dashboard';
import { logMeal, getTodayEntries, deleteMeal, syncFromFirestore } from './services/logService';
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
      // Load profile (localStorage first, then Firestore fallback)
      const profile = await loadProfile();
      if (profile) setUserProfile(profile);

      // Legacy history (localStorage only)
      const savedHistory = localStorage.getItem('nutrisense_history');
      if (savedHistory) {
        try { setMealHistory(JSON.parse(savedHistory)); } catch { /* ignore */ }
      }

      // Load today's entries from localStorage immediately
      setTodayEntries(getTodayEntries());
      setIsInitializing(false);

      // Then quietly sync any missing entries from Firestore
      await syncFromFirestore();
      setTodayEntries(getTodayEntries());
    };
    init();
  }, []);

  const handleProfileComplete = (profile) => {
    setUserProfile(profile);
    saveProfile(profile);   // persist to localStorage + Firestore
    setActiveTab('analyze');
  };

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
  };

  // ── New log handler used by AnalysisCard's onLogMeal prop ──────────────────
  const handleLogMeal = (analysis) => {
    logMeal(analysis);
    setTodayEntries(getTodayEntries());

    // Also keep legacy history for the Trends tab
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

    // Navigate to Today's Log tab
    setActiveTab('log');
  };

  const handleDeleteMeal = (id) => {
    // deleteMeal already called inside Dashboard; just refresh state
    setTodayEntries(getTodayEntries());
  };

  const handleLogout = () => {
    clearProfile();   // removes from localStorage (Firestore copy kept)
    localStorage.removeItem('nutrisense_history');
    localStorage.removeItem('nutrisense_log');
    setUserProfile(null);
    setAnalysisResult(null);
    setMealHistory([]);
    setTodayEntries([]);
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayMeals = mealHistory.filter(
      (meal) => new Date(meal.timestamp).toDateString() === today
    );
    return todayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const todayStats = getTodayStats();
  const calorieProgress =
    Math.min(100, (todayStats.calories / userProfile?.tdee) * 100) || 0;

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
    { id: 'analyze', label: 'Analyze Meal',  Icon: Utensils },
    { id: 'log',     label: "Today's Log",   Icon: ClipboardList },
    { id: 'history', label: 'Trends',        Icon: History },
    { id: 'dashboard', label: 'Insights',    Icon: Activity },
    { id: 'profile', label: 'Profile',       Icon: User },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 glassmorphism border-r border-border hidden md:flex flex-col z-10">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-xl">
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

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === id
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Icon
                size={20}
                className={
                  activeTab === id
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground'
                }
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

        <div className="p-6 m-4 glassmorphism bg-white/5 rounded-2xl border border-white/5 mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Daily Target
            </span>
            <Flame size={14} className="text-primary animate-pulse" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-bold mb-1.5">
                <span>Today's Intake</span>
                <span className="text-primary">
                  {Math.round(todayStats.calories)} / {Math.round(userProfile.tdee)} kcal
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
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="max-w-4xl mx-auto p-6 md:p-12 animate-fade-in-up">

          {/* ── Analyze Meal ── */}
          {activeTab === 'analyze' && (
            <div className="space-y-10">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight font-display">
                  Analyze Your Meal
                </h2>
                <p className="text-lg text-muted-foreground">
                  Snap a photo or describe what you're eating for a real-time nutritional breakdown.
                </p>
              </div>

              <MealAnalyzer
                userProfile={userProfile}
                onAnalysisComplete={handleAnalysisComplete}
              />

              {analysisResult && (
                <div className="animate-fade-in-up">
                  <AnalysisCard
                    analysis={analysisResult}
                    userProfile={userProfile}
                    onLogMeal={handleLogMeal}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Today's Log ── */}
          {activeTab === 'log' && (
            <Dashboard
              entries={todayEntries}
              profile={userProfile}
              onDeleteMeal={handleDeleteMeal}
              onSwitchTab={setActiveTab}
            />
          )}

          {/* ── Trends ── */}
          {activeTab === 'history' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <h2 className="text-4xl font-bold tracking-tight font-display">
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
                      className="glassmorphism p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-6 items-start md:items-center"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">
                            {meal.mealName || 'Analyzed Meal'}
                          </h3>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                            {new Date(meal.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(meal.timestamp).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 md:gap-8">
                        {[
                          { label: 'Calories', value: Math.round(meal.calories), color: 'text-primary' },
                          { label: 'Protein',  value: `${Math.round(meal.protein)}g` },
                          { label: 'Carbs',    value: `${Math.round(meal.carbs)}g` },
                          { label: 'Fat',      value: `${Math.round(meal.fat)}g` },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">
                              {label}
                            </p>
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
                    <History size={40} className="text-primary opacity-50" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No Meals Logged Yet</h3>
                  <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                    Start analyzing and logging your meals to see your nutritional trends here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Insights ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <h2 className="text-4xl font-bold tracking-tight font-display">
                Health Insights
              </h2>
              <NutritionDashboard
                mealHistory={mealHistory}
                userProfile={userProfile}
              />
            </div>
          )}

          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <h2 className="text-4xl font-bold tracking-tight font-display">
                Health Profile
              </h2>
              <ProfileSetup onComplete={handleProfileComplete} initialData={userProfile} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
