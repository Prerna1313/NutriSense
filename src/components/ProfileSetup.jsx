import React, { useState } from 'react';
import { calculateBMR, calculateTDEE, calculateMacros } from '../utils/nutrition';
import { Activity, Target, User, Scale, Ruler, ChevronRight, Check } from 'lucide-react';

const ProfileSetup = ({ onComplete, initialData = null }) => {
  const [formData, setFormData] = useState(initialData || {
    gender: 'male',
    age: '',
    weight: '',
    height: '',
    activityLevel: 'moderate',
    goal: 'maintain'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const bmr = calculateBMR(
      Number(formData.weight),
      Number(formData.height),
      Number(formData.age),
      formData.gender
    );
    
    const tdee = calculateTDEE(bmr, formData.activityLevel);
    const macros = calculateMacros(tdee, formData.goal);

    const userProfile = {
      ...formData,
      bmr,
      tdee,
      macros
    };
    
    onComplete(userProfile); // App.jsx → handleProfileComplete → saveProfile handles persistence
  };

  const activityOptions = [
    { value: 'sedentary', label: 'Sedentary', desc: 'Office job, little exercise' },
    { value: 'light', label: 'Lightly Active', desc: '1-2 days of exercise' },
    { value: 'moderate', label: 'Moderately Active', desc: '3-5 days of exercise' },
    { value: 'active', label: 'Very Active', desc: '6-7 days of exercise' },
  ];

  return (
    <div className={`flex items-center justify-center ${!initialData ? 'min-h-screen p-6' : ''}`}>
      <div className={`glassmorphism p-10 rounded-[2rem] w-full max-w-2xl border border-white/10 animate-fade-in-up ${!initialData ? 'shadow-2xl shadow-primary/5' : ''}`}>
        {!initialData && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-6 border border-primary/20">
              <User size={40} />
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-3 font-display tracking-tight">Create Your Health Profile</h2>
            <p className="text-muted-foreground text-lg">We'll use this to calculate your personalized nutrition targets.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Personal Details</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative group">
                    <select 
                      name="gender" 
                      value={formData.gender} 
                      onChange={handleChange}
                      className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3.5 text-foreground appearance-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all group-hover:bg-muted/80 cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <ChevronRight size={16} className="rotate-90" />
                    </div>
                  </div>
                  <input 
                    type="number" 
                    name="age" 
                    value={formData.age} 
                    onChange={handleChange}
                    placeholder="Age"
                    min="15" max="100" required
                    className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3.5 text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all hover:bg-muted/80"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Biometrics</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input 
                      type="number" 
                      name="weight" 
                      value={formData.weight} 
                      onChange={handleChange}
                      placeholder="Weight (kg)"
                      min="30" max="300" required
                      className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3.5 pl-10 text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all hover:bg-muted/80"
                    />
                    <Scale size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary opacity-60" />
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="height" 
                      value={formData.height} 
                      onChange={handleChange}
                      placeholder="Height (cm)"
                      min="100" max="250" required
                      className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3.5 pl-10 text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all hover:bg-muted/80"
                    />
                    <Ruler size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary opacity-60" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Daily Activity</label>
                <div className="space-y-2">
                  {activityOptions.map((opt) => (
                    <div 
                      key={opt.value}
                      onClick={() => setFormData(prev => ({ ...prev, activityLevel: opt.value }))}
                      className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer border transition-all ${
                        formData.activityLevel === opt.value 
                        ? 'bg-primary/10 border-primary shadow-sm shadow-primary/5' 
                        : 'bg-muted/30 border-border/40 hover:bg-muted/50 hover:border-border'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm">{opt.label}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{opt.desc}</div>
                      </div>
                      {formData.activityLevel === opt.value && (
                        <div className="bg-primary text-primary-foreground p-1 rounded-full shadow-sm">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Target size={16} className="text-primary" /> What's your goal?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['lose', 'maintain', 'gain'].map((goalOption) => (
                <button
                  key={goalOption}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, goal: goalOption }))}
                  className={`group relative overflow-hidden py-4 px-2 rounded-2xl text-sm font-bold transition-all border ${
                    formData.goal === goalOption 
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                    : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50 hover:border-border'
                  }`}
                >
                  <span className="relative z-10">{goalOption.toUpperCase()}</span>
                  {formData.goal === goalOption && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-5 px-6 rounded-2xl shadow-xl shadow-primary/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 mt-4"
          >
            {initialData ? 'Update Preferences' : 'Get My Personal Plan'}
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
