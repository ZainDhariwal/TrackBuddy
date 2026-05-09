import { useMemo, useState } from 'react';
import { ArrowLeft, Trophy, Activity, Flame } from 'lucide-react';
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
import { 
  subDays, 
  format, 
  startOfWeek,
  endOfMonth
} from 'date-fns';
import ActivityCalendar from './ActivityCalendar';

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

interface Habit {
  id: string;
  name: string;
  completedDates: Record<string, boolean>;
}

interface Props {
  habits: Habit[];
  onClose: () => void;
  isDark: boolean;
}

export default function GlobalAnalytics({ habits, onClose, isDark }: Props) {
  const [chartView, setChartView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  const stats = useMemo(() => {
    let perfectDays = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let last30DaysScore = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalHabits = habits.length;

    if (totalHabits === 0) return { perfectDays: 0, bestStreak: 0, monthlyScore: 0 };

    for (let i = 0; i < 30; i++) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      let completed = 0;
      habits.forEach(h => { if (h.completedDates[dateStr]) completed++; });
      last30DaysScore += (completed / totalHabits) * 100;
    }
    const monthlyScore = Math.round(last30DaysScore / 30);

    for (let i = 0; i < 365; i++) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      let completed = 0;
      habits.forEach(h => { if (h.completedDates[dateStr]) completed++; });
      const percentage = (completed / totalHabits) * 100;
      
      if (percentage === 100) perfectDays++;

      if (percentage >= 50) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    return { perfectDays, bestStreak, monthlyScore };
  }, [habits]);

  const globalHeatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalHabits = habits.length;

    if (totalHabits === 0) return data;

    const startDate = subDays(today, 75 * 7);
    for (let i = 0; i < 75 * 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      let completed = 0;
      habits.forEach(h => {
        if (h.completedDates[dateStr]) completed++;
      });
      data[dateStr] = (completed / totalHabits) * 100;
    }
    return data;
  }, [habits]);

  const activeChartData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalHabits = habits.length;
    if (totalHabits === 0) return [];

    if (chartView === 'daily') {
      for (let i = 29; i >= 0; i--) {
        const d = subDays(today, i);
        const dateStr = format(d, 'yyyy-MM-dd');
        let completedHabits = 0;
        habits.forEach(h => {
          if (h.completedDates[dateStr]) completedHabits++;
        });
        const avgPercentage = Math.round((completedHabits / totalHabits) * 100);
        
        data.push({
          name: format(d, 'MMM dd'),
          fullDate: format(d, 'MMMM dd, yyyy'),
          Percentage: avgPercentage
        });
      }
    } else if (chartView === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const weekStart = startOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        let dailyPercentagesSum = 0;
        let daysCount = 0;
        
        for (let j = 0; j < 7; j++) {
          const d = new Date(weekStart);
          d.setDate(d.getDate() + j);
          if (d > today) break;
          
          const dateStr = format(d, 'yyyy-MM-dd');
          let completedHabits = 0;
          habits.forEach(h => {
            if (h.completedDates[dateStr]) completedHabits++;
          });
          dailyPercentagesSum += (completedHabits / totalHabits) * 100;
          daysCount++;
        }
        
        const avgPercentage = daysCount > 0 ? Math.round(dailyPercentagesSum / daysCount) : 0;
        
        const startStr = format(weekStart, 'MMM dd');
        const endStr = weekStart.getMonth() === weekEnd.getMonth() 
          ? format(weekEnd, 'dd') 
          : format(weekEnd, 'MMM dd');
        
        data.push({
          name: `${startStr}-${endStr}`,
          fullDate: `${format(weekStart, 'MMM dd, yyyy')} - ${format(weekEnd, 'MMM dd, yyyy')}`,
          Percentage: avgPercentage
        });
      }
    } else if (chartView === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEnd = endOfMonth(d);
        
        let dailyPercentagesSum = 0;
        let daysCount = 0;
        
        const daysInMonth = monthEnd.getDate();
        for (let j = 1; j <= daysInMonth; j++) {
          const checkDate = new Date(d.getFullYear(), d.getMonth(), j);
          if (checkDate > today) break;
          
          const dateStr = format(checkDate, 'yyyy-MM-dd');
          let completedHabits = 0;
          habits.forEach(h => {
            if (h.completedDates[dateStr]) completedHabits++;
          });
          dailyPercentagesSum += (completedHabits / totalHabits) * 100;
          daysCount++;
        }
        
        const avgPercentage = daysCount > 0 ? Math.round(dailyPercentagesSum / daysCount) : 0;
        
        data.push({
          name: format(d, 'MMM'),
          fullDate: format(d, 'MMMM yyyy'),
          Percentage: avgPercentage
        });
      }
    } else if (chartView === 'yearly') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEnd = endOfMonth(d);
        
        let dailyPercentagesSum = 0;
        let daysCount = 0;
        
        const daysInMonth = monthEnd.getDate();
        for (let j = 1; j <= daysInMonth; j++) {
          const checkDate = new Date(d.getFullYear(), d.getMonth(), j);
          if (checkDate > today) break;
          
          const dateStr = format(checkDate, 'yyyy-MM-dd');
          let completedHabits = 0;
          habits.forEach(h => {
            if (h.completedDates[dateStr]) completedHabits++;
          });
          dailyPercentagesSum += (completedHabits / totalHabits) * 100;
          daysCount++;
        }
        
        const avgPercentage = daysCount > 0 ? Math.round(dailyPercentagesSum / daysCount) : 0;
        
        data.push({
          name: format(d, 'MMM yy'),
          fullDate: format(d, 'MMMM yyyy'),
          Percentage: avgPercentage
        });
      }
    }

    return data;
  }, [habits, chartView]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-black w-full h-full absolute inset-0 z-50 overflow-y-auto animate-in slide-in-from-right duration-300 transition-colors">
      <div className="sticky top-0 bg-white/80 dark:bg-black/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center space-x-4 z-10 shadow-sm transition-colors">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Global Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Combined performance across all habits</p>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 pb-20">
        
        {/* Global Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Perfect Days</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.perfectDays} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">100%</span></p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Best Streak</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.bestStreak} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">days {'>'}50%</span></p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">30-Day Avg</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.monthlyScore}%</p>
            </div>
          </div>
        </div>

        {/* Global Activity Heatmap Component */}
        <ActivityCalendar title="Global Activity Calendar" data={globalHeatmapData} />

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Overall Consistency Trend</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl transition-colors">
              <button 
                onClick={() => setChartView('daily')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${chartView === 'daily' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Daily
              </button>
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
              <button 
                onClick={() => setChartView('yearly')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${chartView === 'yearly' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <div className="h-72 w-full mt-4">
            <Line 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
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
                        return `Average Consistency: ${context.raw}%`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: {
                      color: isDark ? '#94a3b8' : '#64748b',
                      maxRotation: 45,
                      minRotation: 45,
                      font: { size: 10 }
                    }
                  },
                  y: {
                    border: { display: false },
                    grid: { color: isDark ? '#334155' : '#e2e8f0' },
                    ticks: {
                      color: isDark ? '#94a3b8' : '#64748b',
                      stepSize: 20,
                      font: { size: 12 },
                      padding: 10,
                      callback: (value) => `${value}%`
                    },
                    min: 0,
                    max: 100,
                  }
                },
                interaction: { intersect: false, mode: 'index' },
              }} 
              data={{
                labels: activeChartData.map(d => d.name),
                datasets: [
                  {
                    fill: true,
                    label: 'Consistency',
                    data: activeChartData.map(d => d.Percentage),
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
  );
}
