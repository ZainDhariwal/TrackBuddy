import { useState, useMemo, useEffect } from "react";
import { Plus, Check, X, Target, Moon, Sun } from "lucide-react";
import HabitAnalytics from "./HabitAnalytics";
import "./index.css";

interface Habit {
  id: string;
  name: string;
  completedDates: Record<string, boolean>; 
}

const generateMockData = (probability: number) => {
  const dates: Record<string, boolean> = {};
  for(let i=0; i<100; i++) {
    if (Math.random() > probability) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates[d.toISOString().split('T')[0]] = true;
    }
  }
  return dates;
};

function App() {
  const [habits, setHabits] = useState<Habit[]>([
    { id: "1", name: "Read 10 pages", completedDates: generateMockData(0.3) },
    { id: "2", name: "Drink 2L Water", completedDates: generateMockData(0.1) },
    { id: "3", name: "Morning Workout", completedDates: generateMockData(0.5) },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  
  // Dark mode state
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Generate last 60 days dates for fluid full-screen layout
  const dates = useMemo(() => {
    const result = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const isoString = d.toISOString().split('T')[0]; 
      
      const monthName = d.toLocaleDateString("en-US", { month: "short" });
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNumber = d.getDate();
      
      result.push({
        id: isoString,
        monthName,
        dayName,
        dayNumber,
        isToday: i === 0
      });
    }
    return result;
  }, []);

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    setHabits([...habits, { id: Date.now().toString(), name: newHabit.trim(), completedDates: {} }]);
    setNewHabit("");
    setShowAddForm(false);
  };

  const toggleHabit = (habitId: string, dateId: string) => {
    setHabits(habits.map(h => {
      if (h.id === habitId) {
        const isCurrentlyCompleted = !!h.completedDates[dateId];
        return {
          ...h,
          completedDates: {
            ...h.completedDates,
            [dateId]: !isCurrentlyCompleted
          }
        };
      }
      return h;
    }));
  };

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  return (
    <div className="min-h-screen p-6 flex flex-col bg-slate-50 dark:bg-black transition-colors selection:bg-blue-100 relative">
      {selectedHabit && (
        <HabitAnalytics 
          habit={selectedHabit} 
          onClose={() => setSelectedHabitId(null)} 
          isDark={isDark}
        />
      )}
      {/* Header */}
      <header className="flex justify-between items-center mb-8 max-w-6xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <Target className="w-7 h-7 text-blue-600 dark:text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">TrackBuddy</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 dark:text-slate-400 rounded-full transition-colors"
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full shadow-sm transition-all flex items-center justify-center"
            title="Add Habit"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Add Habit Form (Conditional) */}
      <div className="max-w-6xl mx-auto w-full">
        {showAddForm && (
          <form onSubmit={addHabit} className="mb-6 flex space-x-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Type a new habit..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
              autoFocus
            />
            <button
              type="submit"
              className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl shadow-sm transition-all text-sm font-medium disabled:opacity-50"
              disabled={!newHabit.trim()}
            >
              Add
            </button>
          </form>
        )}

        {/* Matrix Table container - Full Screen Responsive */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden w-full transition-colors">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="table-fixed w-full text-left border-collapse">
              <thead>
                <tr>
                  {/* Sticky top-left cell for Habit Names */}
                  <th className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-black font-semibold text-slate-500 dark:text-slate-400 w-[240px] min-w-[240px] max-w-[240px] sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                    Habits
                  </th>
                  
                  {/* Dynamic Columns */}
                  {dates.map((date) => (
                    <th key={date.id} className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center w-[56px] min-w-[56px] max-w-[56px] transition-colors">
                      <div className="flex flex-col items-center justify-center space-y-0.5">
                        <span className={`text-[15px] font-extrabold ${date.isToday ? 'text-blue-600 dark:text-blue-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {date.dayNumber}
                        </span>
                        <span className={`text-[9px] uppercase font-bold tracking-widest ${date.isToday ? 'text-blue-400 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {date.monthName}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${date.isToday ? 'text-blue-500 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {date.dayName}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => (
                  <tr key={habit.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {/* Sticky Habit Name Column */}
                    <td 
                      className="p-4 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 dark:group-hover:bg-slate-800 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setSelectedHabitId(habit.id)}
                      title="Click to view analytics"
                    >
                      {habit.name}
                    </td>
                    
                    {/* Toggles Columns */}
                    {dates.map((date) => {
                      const isCompleted = !!habit.completedDates[date.id];
                      return (
                        <td key={date.id} className="p-2 border-b border-slate-50 dark:border-slate-800/50 text-center w-[56px] min-w-[56px] max-w-[56px] transition-colors">
                          <button
                            onClick={() => toggleHabit(habit.id, date.id)}
                            className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 
                              ${isCompleted 
                                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 scale-110 shadow-sm' 
                                : 'bg-transparent text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-400 dark:hover:text-slate-400'
                              }`}
                          >
                            {isCompleted ? (
                              <Check className="w-5 h-5 stroke-[3]" />
                            ) : (
                              <X className="w-5 h-5 stroke-[2]" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {habits.length === 0 && (
                  <tr>
                    <td colSpan={dates.length + 1} className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No habits yet. Click the + button to add one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
