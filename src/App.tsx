import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Check, X, Target, Moon, Sun, Trash2, GripVertical, BarChart3, Pencil } from "lucide-react";
import HabitAnalytics from "./HabitAnalytics";
import GlobalAnalytics from "./GlobalAnalytics";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { load } from '@tauri-apps/plugin-store';
import { confirm } from '@tauri-apps/plugin-dialog';
import "./index.css";

interface Habit {
  id: string;
  name: string;
  completedDates: Record<string, boolean>; 
}



// Sortable Row Component
interface SortableHabitRowProps {
  habit: Habit;
  dates: any[];
  toggleHabit: (habitId: string, dateId: string) => void;
  calculateScore: (completedDates: Record<string, boolean>) => number;
  setSelectedHabitId: (id: string) => void;
  deleteHabit: (id: string) => void;
  editHabit: (id: string, newName: string) => void;
}

function SortableHabitRow({ habit, dates, toggleHabit, calculateScore, setSelectedHabitId, deleteHabit, editHabit }: SortableHabitRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    setEditName(habit.name);
  }, [habit.name]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 50, opacity: 0.9 } as any : {})
  };

  return (
    <tr 
      ref={(node) => {
        setNodeRef(node);
        // @ts-ignore
        menuRef.current = node;
      }}
      style={style} 
      className={`group transition-colors ${isDragging ? 'bg-slate-100 dark:bg-slate-800 shadow-xl' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
    >
      <td className={`p-3 md:p-4 border-b border-slate-100 dark:border-slate-800 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors ${isDragging ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800'}`}>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center space-x-1 md:space-x-2 flex-1 min-w-0">
            <div className="relative">
              <div 
                {...attributes} 
                {...listeners} 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className={`cursor-grab active:cursor-grabbing p-1 -ml-2 transition-colors ${showMenu ? 'text-blue-500 dark:text-blue-400' : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400'}`}
                title="Drag to reorder or Click for options"
              >
                <GripVertical className="w-4 h-4" />
              </div>
            </div>

            <div 
              className="flex items-center space-x-2 md:space-x-3 cursor-pointer flex-1 min-w-0"
              onClick={() => {
                if (!isEditing && !showMenu) setSelectedHabitId(habit.id);
              }}
              title="Click to view analytics"
            >
              <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0" title={`${calculateScore(habit.completedDates)}% completed in last 30 days`}>
                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                  <circle className="text-slate-100 dark:text-slate-800" strokeWidth="3" stroke="currentColor" fill="transparent" r="12" cx="16" cy="16" />
                  <circle className="text-blue-500" strokeWidth="3" strokeDasharray={2 * Math.PI * 12} strokeDashoffset={(2 * Math.PI * 12) - ((calculateScore(habit.completedDates) / 100) * (2 * Math.PI * 12))} strokeLinecap="round" stroke="currentColor" fill="transparent" r="12" cx="16" cy="16" />
                </svg>
                <span className="absolute text-[8px] font-bold text-slate-600 dark:text-slate-400">
                  {calculateScore(habit.completedDates)}
                </span>
              </div>
              
              {isEditing ? (
                <div className="flex-1 flex items-center">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                      if (e.key === 'Escape') {
                        setEditName(habit.name);
                        setIsEditing(false);
                      }
                    }}
                    onBlur={() => {
                      if (editName.trim() && editName.trim() !== habit.name) { 
                        editHabit(habit.id, editName.trim()); 
                      } else { 
                        setEditName(habit.name); 
                      }
                      setIsEditing(false);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none outline-none text-sm font-medium text-slate-800 dark:text-slate-100 px-2 py-1 rounded shadow-inner focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              ) : showMenu ? (
                <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-left-2 duration-200">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); setIsEditing(true); }}
                    className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); deleteHabit(habit.id); }}
                    className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                    className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className="text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {habit.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      {dates.map((date) => {
        const isCompleted = !!habit.completedDates[date.id];
        return (
          <td key={date.id} className="p-2 border-b border-slate-50 dark:border-slate-800/50 text-center w-[56px] min-w-[56px] max-w-[56px] transition-colors">
            <button
              onClick={() => toggleHabit(habit.id, date.id)}
              className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 
                ${isCompleted ? 'text-blue-600 dark:text-blue-500 scale-110' : 'bg-transparent text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-400'}`}
            >
              {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <X className="w-4 h-4 stroke-[2]" />}
            </button>
          </td>
        );
      })}
    </tr>
  );
}

function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showGlobalAnalytics, setShowGlobalAnalytics] = useState(false);
  
  const [isDark, setIsDark] = useState(false);

  // Load Store Data on Mount
  useEffect(() => {
    async function initStore() {
      try {
        const store = await load('trackbuddy_store.json', { autoSave: false, defaults: {} } as any);
        
        const savedHabits = await store.get<Habit[]>('habits');
        if (savedHabits) {
          setHabits(savedHabits);
        }

        const savedTheme = await store.get<string>('theme');
        if (savedTheme) {
          setIsDark(savedTheme === 'dark');
        } else {
          setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
      } catch (err) {
        console.error("Store error:", err);
      } finally {
        setStoreLoaded(true);
      }
    }
    initStore();
  }, []);

  // Save Habits whenever they change (after initial load)
  useEffect(() => {
    if (!storeLoaded) return;
    async function saveHabits() {
      try {
        const store = await load('trackbuddy_store.json', { autoSave: false, defaults: {} } as any);
        await store.set('habits', habits);
        await store.save();
      } catch (err) {
        console.error("Save error:", err);
      }
    }
    saveHabits();
  }, [habits, storeLoaded]);

  // Save Theme whenever it changes
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    if (!storeLoaded) return;
    async function saveTheme() {
      try {
        const store = await load('trackbuddy_store.json', { autoSave: false, defaults: {} } as any);
        await store.set('theme', isDark ? 'dark' : 'light');
        await store.save();
      } catch (err) {
        console.error("Theme save error:", err);
      }
    }
    saveTheme();
  }, [isDark, storeLoaded]);

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!storeLoaded) return;
      setIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [storeLoaded]);



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
        id: isoString, monthName, dayName, dayNumber, isToday: i === 0
      });
    }
    return result;
  }, []);

  const calculateScore = (completedDates: Record<string, boolean>) => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (completedDates[dateStr]) count++;
    }
    return Math.round((count / 30) * 100);
  };

  const todayProgress = useMemo(() => {
    if (habits.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const todayStr = new Date().toISOString().split('T')[0];
    let completed = 0;
    habits.forEach(h => {
      if (h.completedDates[todayStr]) completed++;
    });
    return {
      completed,
      total: habits.length,
      percentage: Math.round((completed / habits.length) * 100)
    };
  }, [habits]);

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    setHabits([...habits, { id: Date.now().toString(), name: newHabit.trim(), completedDates: {} }]);
    setNewHabit("");
    setShowAddForm(false);
  };

  const deleteHabit = async (id: string) => {
    let isConfirmed = false;
    try {
      isConfirmed = await confirm(`Are you sure you want to delete this habit?`, { title: 'TrackBuddy', kind: 'warning' });
    } catch (e) {
      console.warn("Native dialog failed, using fallback:", e);
      isConfirmed = window.confirm(`Are you sure you want to delete this habit?`);
    }
    
    if (isConfirmed) {
      setHabits(prev => prev.filter(h => h.id !== id));
    }
  };

  const editHabit = async (id: string, newName: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, name: newName } : h));
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setHabits((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  if (!storeLoaded) {
    return (
      <div className="min-h-screen p-6 flex flex-col bg-slate-50 dark:bg-black items-center justify-center transition-colors">
        <div className="animate-pulse flex flex-col items-center">
          <Target className="w-10 h-10 text-blue-500 mb-4 opacity-50" />
          <p className="text-slate-400 dark:text-slate-500 font-medium">Loading TrackBuddy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex flex-col bg-slate-50 dark:bg-black transition-colors selection:bg-blue-100 relative">
      {selectedHabit && (
        <HabitAnalytics habit={selectedHabit} onClose={() => setSelectedHabitId(null)} isDark={isDark} />
      )}
      {showGlobalAnalytics && (
        <GlobalAnalytics habits={habits} onClose={() => setShowGlobalAnalytics(false)} isDark={isDark} />
      )}
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 max-w-6xl mx-auto w-full space-y-4 md:space-y-0">
        <div className="flex items-center space-x-3">
          <img src="/logo.svg" alt="TrackBuddy Logo" className="w-8 h-8 drop-shadow-sm" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">TrackBuddy</h1>
        </div>

        {/* Today's Progress Summary */}
        {habits.length > 0 && (
          <div className="flex flex-col items-center flex-1 max-w-sm mx-auto w-full px-4">
            <div className="flex justify-between w-full text-xs font-bold mb-1.5 text-slate-600 dark:text-slate-400">
              <span className="uppercase tracking-wider">Today's Progress</span>
              <span className="text-blue-600 dark:text-blue-400">{todayProgress.completed}/{todayProgress.total} ({todayProgress.percentage}%)</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${todayProgress.percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          {habits.length > 0 && (
            <button 
              onClick={() => setShowGlobalAnalytics(true)}
              className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 dark:text-slate-400 rounded-full transition-colors flex items-center"
              title="Global Analytics"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 dark:text-slate-400 rounded-full transition-colors"
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Add Habit Form */}
      <div className="max-w-6xl mx-auto w-full">

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden w-full transition-colors">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="table-fixed w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-black font-semibold text-slate-500 dark:text-slate-400 w-[240px] min-w-[240px] max-w-[240px] sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                    Habits
                  </th>
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
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {habits.map((habit) => (
                      <SortableHabitRow 
                        key={habit.id} 
                        habit={habit} 
                        dates={dates} 
                        toggleHabit={toggleHabit} 
                        calculateScore={calculateScore}
                        setSelectedHabitId={setSelectedHabitId}
                        deleteHabit={deleteHabit}
                        editHabit={editHabit}
                      />
                    ))}
                    <tr className="group">
                      <td className="p-4 bg-white dark:bg-slate-900 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                        {showAddForm ? (
                          <form 
                            onSubmit={(e) => { 
                              addHabit(e); 
                              if (newHabit.trim()) setShowAddForm(false);
                            }} 
                            className="flex items-center space-x-3 pl-8 h-[28px]"
                          >
                            <button type="submit" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 flex-shrink-0 transition-colors">
                              <Plus className="w-4 h-4" />
                            </button>
                            <input
                              type="text"
                              value={newHabit}
                              onChange={(e) => setNewHabit(e.target.value)}
                              onBlur={() => { if(!newHabit.trim()) setShowAddForm(false); }}
                              autoFocus
                              placeholder="Type habit..."
                              className="bg-transparent border-none outline-none flex-1 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 w-full"
                            />
                          </form>
                        ) : (
                          <div className="pl-8 flex items-center h-[28px]">
                            <button 
                              onClick={() => setShowAddForm(true)}
                              className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Add new habit"
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td colSpan={dates.length} className="bg-slate-50/50 dark:bg-slate-900/50"></td>
                    </tr>
                  </tbody>
                </SortableContext>
              </DndContext>
              
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
