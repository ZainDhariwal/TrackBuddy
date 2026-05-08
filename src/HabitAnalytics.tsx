import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ArrowLeft, Flame, Trophy, Activity, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  subDays, 
  format, 
  eachDayOfInterval, 
  differenceInDays,
  startOfWeek
} from 'date-fns';

interface Habit {
  id: string;
  name: string;
  completedDates: Record<string, boolean>;
}

interface Props {
  habit: Habit;
  onClose: () => void;
  isDark: boolean;
}

export default function HabitAnalytics({ habit, onClose, isDark }: Props) {
  const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the heatmap to the right (latest date) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

  // Generate last 75 weeks (~1.5 years) for full GitHub-style heatmap that fills ultrawide screens
  const heatmapWeeks = useMemo(() => {
    const end = new Date();
    const start = startOfWeek(subDays(end, 75 * 7), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, []);

  const monthLabels = useMemo(() => {
    const labels: { name: string; colIndex: number }[] = [];
    let currentMonth = -1;
    heatmapWeeks.forEach((week, index) => {
      const midWeekDate = week[3]; 
      if (midWeekDate && midWeekDate.getMonth() !== currentMonth) {
        currentMonth = midWeekDate.getMonth();
        labels.push({
          name: format(midWeekDate, 'MMM'),
          colIndex: index
        });
      }
    });
    return labels;
  }, [heatmapWeeks]);

  // Calculate Streaks
  const stats = useMemo(() => {
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let last30DaysCount = 0;
    
    const today = new Date();
    let datePointer = new Date();
    
    while (true) {
      const dateStr = format(datePointer, 'yyyy-MM-dd');
      if (habit.completedDates[dateStr]) {
        currentStreak++;
        datePointer = subDays(datePointer, 1);
      } else {
        if (differenceInDays(today, datePointer) > 0) {
           break;
        }
        datePointer = subDays(datePointer, 1);
      }
    }

    const datesArr = Object.keys(habit.completedDates).sort();
    const thirtyDaysAgo = subDays(today, 30);
    datesArr.forEach(d => {
      if (habit.completedDates[d]) {
        if (new Date(d) >= thirtyDaysAgo) {
          last30DaysCount++;
        }
      }
    });

    let prevDate: Date | null = null;
    datesArr.forEach(d => {
      if (habit.completedDates[d]) {
        const currentDate = new Date(d);
        if (prevDate && differenceInDays(currentDate, prevDate) === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        prevDate = currentDate;
      }
    });

    return {
      currentStreak,
      bestStreak: Math.max(currentStreak, bestStreak),
      monthlyScore: Math.round((last30DaysCount / 30) * 100)
    };
  }, [habit.completedDates]);

  // Generate Weekly Chart Data (Last 12 weeks)
  const weeklyChartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      let completed = 0;
      let missed = 0;
      
      for (let j = 0; j < 7; j++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + j);
        if (d > today) break; 
        
        const dateStr = format(d, 'yyyy-MM-dd');
        if (habit.completedDates[dateStr]) {
          completed++;
        } else {
          missed++;
        }
      }
      
      const startStr = format(weekStart, 'MMM dd');
      const endStr = weekStart.getMonth() === weekEnd.getMonth() 
        ? format(weekEnd, 'dd') 
        : format(weekEnd, 'MMM dd');
      
      data.push({
        name: `${startStr}-${endStr}`,
        Done: completed,
        Missed: missed
      });
    }
    return data;
  }, [habit.completedDates]);

  // Generate Monthly Chart Data (Last 6 months)
  const monthlyChartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0).getDate();
      
      let completed = 0;
      let missed = 0;
      
      for(let j=1; j<=daysInMonth; j++) {
        const checkDate = new Date(today.getFullYear(), today.getMonth() - i, j);
        if (checkDate > today) break;
        
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (habit.completedDates[dateStr]) {
          completed++;
        } else {
          missed++;
        }
      }
      
      data.push({
        name: format(d, 'MMM'),
        Done: completed,
        Missed: missed
      });
    }
    return data;
  }, [habit.completedDates]);

  const activeChartData = chartView === 'weekly' ? weeklyChartData : monthlyChartData;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-black w-full h-full absolute inset-0 z-50 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 transition-colors">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-black/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center space-x-4 z-10 shadow-sm transition-colors">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{habit.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Detailed Analytics</p>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 pb-20">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Current Streak</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.currentStreak} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">days</span></p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Best Streak</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.bestStreak} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">days</span></p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">30-Day Score</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.monthlyScore}%</p>
            </div>
          </div>
        </div>

        {/* GitHub Heatmap - Full Width */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Activity Calendar</h3>
          </div>
          
          <div ref={scrollContainerRef} className="w-full overflow-x-auto pb-4 custom-scrollbar smooth-scroll">
            <div className="min-w-max relative pl-8 pt-6">
              {/* Month Labels */}
              <div className="absolute top-0 left-8 right-0 flex text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {monthLabels.map((label, idx) => (
                  <div 
                    key={idx} 
                    className="absolute" 
                    style={{ left: `${label.colIndex * 18}px` }}
                  >
                    {label.name}
                  </div>
                ))}
              </div>

              {/* Day Labels (Left Axis) */}
              <div className="absolute left-0 top-6 bottom-0 flex flex-col justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500 pb-1 h-[120px]">
                <span className="invisible">Mon</span>
                <span>Mon</span>
                <span className="invisible">Wed</span>
                <span>Wed</span>
                <span className="invisible">Fri</span>
                <span>Fri</span>
                <span className="invisible">Sun</span>
              </div>

              {/* Grid Wrapper */}
              <div className="flex gap-[4px]">
                {heatmapWeeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="grid grid-rows-7 gap-[4px]">
                    {week.map((date) => {
                      if (!date) return <div key={Math.random()} className="w-[14px] h-[14px]" />; // Fallback

                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isCompleted = habit.completedDates[dateStr];
                      const isFuture = date > new Date();
                      
                      let colorClass = 'bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40'; // Default Empty
                      if (isCompleted) {
                        colorClass = 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 shadow-sm'; // Completed
                      } else if (isFuture) {
                        colorClass = 'bg-transparent border-transparent'; // Hide future dates completely
                      }

                      return (
                        <div 
                          key={dateStr}
                          title={`${format(date, 'MMM dd, yyyy')}${isCompleted ? ' (Completed)' : ''}`}
                          className={`w-[14px] h-[14px] rounded-[3px] transition-colors cursor-help ${colorClass}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center space-x-2 mt-4 text-xs text-slate-400 dark:text-slate-500 font-medium px-2">
            <span>Less</span>
            <div className="w-[14px] h-[14px] rounded-[3px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></div>
            <div className="w-[14px] h-[14px] rounded-[3px] bg-blue-300 dark:bg-blue-800"></div>
            <div className="w-[14px] h-[14px] rounded-[3px] bg-blue-500 dark:bg-blue-600"></div>
            <span>More</span>
          </div>
        </div>

        {/* Frequency Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Frequency Analysis</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl transition-colors">
              <button 
                onClick={() => setChartView('weekly')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${chartView === 'weekly' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setChartView('monthly')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${chartView === 'monthly' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Monthly
              </button>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                  angle={-45}
                  textAnchor="end"
                  dy={10}
                  dx={-5}
                  height={50}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }} 
                />
                <Bar 
                  dataKey="Done" 
                  stackId="a" 
                  fill={isDark ? '#2563eb' : '#3b82f6'} 
                  radius={chartView === 'weekly' ? [0, 0, 4, 4] : [0, 0, 4, 4]} 
                  barSize={32}
                />
                <Bar 
                  dataKey="Missed" 
                  stackId="a" 
                  fill={isDark ? '#334155' : '#cbd5e1'} 
                  radius={chartView === 'weekly' ? [4, 4, 0, 0] : [4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
