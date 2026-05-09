import { useMemo, useRef, useEffect } from 'react';
import { Target } from 'lucide-react';
import { subDays, format, startOfWeek, eachDayOfInterval } from 'date-fns';

interface Props {
  title: string;
  data: Record<string, number>; // Maps 'YYYY-MM-DD' -> percentage (0-100)
}

export default function ActivityCalendar({ title, data }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

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

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      <div className="flex items-center space-x-2 mb-6">
        <Target className="w-5 h-5 text-blue-500 dark:text-blue-400" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>

      <div ref={scrollContainerRef} className="w-full overflow-x-auto pb-4 custom-scrollbar smooth-scroll">
        <div className="min-w-max relative pr-10 pt-6">
          {/* Month Labels */}
          <div className="absolute top-0 left-0 right-10 flex text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{ left: `${label.colIndex * 23}px` }}
              >
                {label.name}
              </div>
            ))}
          </div>

          {/* Day Labels (Right Axis) */}
          <div className="absolute right-0 top-6 bottom-0 grid grid-rows-7 gap-[3px] text-[10px] font-medium text-slate-400 dark:text-slate-500 text-right pr-2">
            <div className="h-5 flex items-center justify-end">Mon</div>
            <div className="h-5 flex items-center justify-end">Tue</div>
            <div className="h-5 flex items-center justify-end">Wed</div>
            <div className="h-5 flex items-center justify-end">Thu</div>
            <div className="h-5 flex items-center justify-end">Fri</div>
            <div className="h-5 flex items-center justify-end">Sat</div>
            <div className="h-5 flex items-center justify-end">Sun</div>
          </div>

          {/* Grid Wrapper */}
          <div className="flex gap-[3px]">
            {heatmapWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-rows-7 gap-[3px]">
                {week.map((date) => {
                  if (!date) return <div key={Math.random()} className="w-5 h-5" />;

                  const dateStr = format(date, 'yyyy-MM-dd');
                  const percentage = data[dateStr] || 0;
                  const isFuture = date > new Date();

                  if (isFuture) {
                    return <div key={dateStr} className="w-5 h-5 rounded-[3px] bg-transparent border-transparent"></div>;
                  }

                  let colorClass = 'bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40';
                  let textClass = 'text-slate-400 dark:text-slate-500';

                  if (percentage > 0 && percentage <= 33) {
                    colorClass = 'bg-blue-200 dark:bg-blue-900/40';
                    textClass = 'text-slate-600 dark:text-blue-200';
                  }
                  else if (percentage > 33 && percentage <= 66) {
                    colorClass = 'bg-blue-400 dark:bg-blue-700/60';
                    textClass = 'text-white';
                  }
                  else if (percentage > 66 && percentage < 100) {
                    colorClass = 'bg-blue-500 dark:bg-blue-500 shadow-sm';
                    textClass = 'text-white';
                  }
                  else if (percentage === 100) {
                    colorClass = 'bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
                    textClass = 'text-white';
                  }

                  return (
                    <div
                      key={dateStr}
                      className={`w-5 h-5 flex items-center justify-center text-[8px] font-medium rounded-[3px] transition-colors relative group cursor-help ${colorClass}`}
                    >
                      <span className={textClass}>
                        {format(date, 'd')}
                      </span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {format(date, 'MMM dd, yyyy')}: {Math.round(percentage)}% Done
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 mt-4 text-[11px] font-medium text-slate-500">
        <span>Less</span>
        <div className="w-4 h-4 rounded-[3px] bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40"></div>
        <div className="w-4 h-4 rounded-[3px] bg-blue-200 dark:bg-blue-900/40"></div>
        <div className="w-4 h-4 rounded-[3px] bg-blue-400 dark:bg-blue-700/60"></div>
        <div className="w-4 h-4 rounded-[3px] bg-blue-500 dark:bg-blue-500"></div>
        <div className="w-4 h-4 rounded-[3px] bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
        <span>More</span>
      </div>
    </div>
  );
}
