import { useMemo, useState } from 'react';
import { ArrowLeft, Flame, Trophy, Activity } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ScriptableContext
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);
import { 
  subDays, 
  format, 
  differenceInDays,
  startOfWeek
} from 'date-fns';
import ActivityCalendar from './ActivityCalendar';

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
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    Object.keys(habit.completedDates).forEach(d => {
      if (habit.completedDates[d]) {
        data[d] = 100;
      }
    });
    return data;
  }, [habit.completedDates]);

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
        fullDate: `${format(weekStart, 'MMMM dd, yyyy')} - ${format(weekEnd, 'MMMM dd, yyyy')}`,
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
        fullDate: format(d, 'MMMM yyyy'),
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

        {/* Activity Calendar Component */}
        <ActivityCalendar title="Activity Calendar" data={heatmapData} />

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
          <div className="h-72 w-full mt-4">
            <Line 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f8fafc' : '#0f172a',
                    bodyColor: isDark ? '#cbd5e1' : '#475569',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                      title: (tooltipItems) => {
                        const idx = tooltipItems[0].dataIndex;
                        return activeChartData[idx].fullDate;
                      },
                      label: (context) => {
                        return `Consistent Days: ${context.raw}`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: isDark ? '#94a3b8' : '#64748b',
                      maxRotation: 45,
                      minRotation: 45,
                      font: { size: 10 }
                    }
                  },
                  y: {
                    border: { display: false },
                    grid: {
                      color: isDark ? '#334155' : '#e2e8f0',
                    },
                    ticks: {
                      color: isDark ? '#94a3b8' : '#64748b',
                      stepSize: chartView === 'weekly' ? 1 : 5,
                      font: { size: 12 },
                      padding: 10
                    },
                    min: 0,
                    max: chartView === 'weekly' ? 7 : 31,
                  }
                },
                interaction: {
                  intersect: false,
                  mode: 'index',
                },
              }} 
              data={{
                labels: activeChartData.map(d => d.name),
                datasets: [
                  {
                    fill: true,
                    label: 'Done',
                    data: activeChartData.map(d => d.Done),
                    borderColor: isDark ? '#3b82f6' : '#2563eb',
                    borderWidth: 3,
                    pointBackgroundColor: isDark ? '#3b82f6' : '#2563eb',
                    pointBorderColor: isDark ? '#0f172a' : '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    backgroundColor: (context: ScriptableContext<"line">) => {
                      const ctx = context.chart.ctx;
                      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                      gradient.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.3)');
                      gradient.addColorStop(1, isDark ? 'rgba(59, 130, 246, 0)' : 'rgba(37, 99, 235, 0)');
                      return gradient;
                    }
                  }
                ]
              }} 
            />
          </div>
          </div>
        </div>

      </div>
    </div>
  );
}
