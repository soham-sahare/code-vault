"use client";

import { useMemo, useRef, useEffect } from 'react';
import { Tooltip as RechartsTooltip } from 'recharts';

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  startDate?: Date;
  endDate?: Date;
}

export function ActivityHeatmap({ data, startDate, endDate }: ActivityHeatmapProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to the right (most recent) on mount for mobile only
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Check if screen is mobile (less than 1024px which is lg breakpoint)
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }
    }
  }, []);

  const heatmapData = useMemo(() => {
    // Create a map of dates to counts
    const dataMap = new Map(data.map(d => [d.date, d.count]));
    
    // Determine date range
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    
    // Generate all dates in range
    const dates: { date: string; count: number; dayOfWeek: number; weekIndex: number }[] = [];
    const current = new Date(start);
    let weekIndex = 0;
    let lastDayOfWeek = current.getDay();
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();
      
      // Increment week index when we go from Saturday (6) to Sunday (0)
      if (lastDayOfWeek === 6 && dayOfWeek === 0) {
        weekIndex++;
      }
      
      dates.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0,
        dayOfWeek,
        weekIndex
      });
      
      lastDayOfWeek = dayOfWeek;
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [data, startDate, endDate]);

  // Get color based on count
  const getColor = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count <= 2) return 'bg-green-500/30';
    if (count <= 4) return 'bg-green-500/50';
    if (count <= 6) return 'bg-green-500/70';
    return 'bg-green-500/90';
  };

  // Get max week index
  const maxWeek = Math.max(...heatmapData.map(d => d.weekIndex));
  
  // Group by week
  const weeks: { [key: number]: typeof heatmapData } = {};
  heatmapData.forEach(d => {
    if (!weeks[d.weekIndex]) weeks[d.weekIndex] = [];
    weeks[d.weekIndex].push(d);
  });

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Track which months we've already shown
  const shownMonths = new Set<string>();

  return (
    <div className="w-full overflow-x-auto lg:overflow-x-visible scrollbar-hide" ref={scrollContainerRef}>
      <div className="min-w-[800px] lg:min-w-0 lg:w-full">
      {/* Month labels */}
      <div className="flex gap-[2px] mb-2">
        <div className="w-12" /> {/* Spacer for day labels */}
        <div className="flex-1 flex gap-[2px]">
          {Object.keys(weeks).map((weekIdx) => {
            const week = weeks[parseInt(weekIdx)];
            const firstDay = week[0];
            const date = new Date(firstDay.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            
            // Show month label only if:
            // 1. It's the first occurrence of this month
            // 2. AND it's within the first week of the month
            const shouldShowMonth = !shownMonths.has(monthKey) && date.getDate() <= 7;
            
            if (shouldShowMonth) {
              shownMonths.add(monthKey);
            }
            
            return (
              <div key={weekIdx} className="text-[10px] text-gray-500 flex-1 min-w-0">
                {shouldShowMonth ? monthLabels[date.getMonth()] : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-[2px]">
        {/* Day of week labels */}
        <div className="flex flex-col gap-[2px]">
          {dayLabels.map((label, idx) => (
            <div key={label} className="h-3 w-12 text-[10px] text-gray-500 flex items-center">
              {idx % 2 === 1 ? label : ''}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex-1 flex gap-[2px]">
          {Object.keys(weeks).map((weekIdx) => {
            const week = weeks[parseInt(weekIdx)];
            
            return (
              <div key={weekIdx} className="flex-1 flex flex-col gap-[2px] min-w-0">
                {[0, 1, 2, 3, 4, 5, 6].map(day => {
                  const cell = week.find(d => d.dayOfWeek === day);
                  
                  if (!cell) {
                    return <div key={day} className="h-3 w-full rounded-sm bg-transparent" />;
                  }
                  
                  return (
                    <div
                      key={cell.date}
                      className={`h-3 w-full rounded-sm ${getColor(cell.count)} border border-white/10 hover:ring-2 hover:ring-white/30 transition-all cursor-pointer group relative`}
                      title={`${cell.date}: ${cell.count} problem${cell.count !== 1 ? 's' : ''}`}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                        {new Date(cell.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: {cell.count} solved
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-white/5 border border-white/10" />
          <div className="h-3 w-3 rounded-sm bg-green-500/30 border border-white/10" />
          <div className="h-3 w-3 rounded-sm bg-green-500/50 border border-white/10" />
          <div className="h-3 w-3 rounded-sm bg-green-500/70 border border-white/10" />
          <div className="h-3 w-3 rounded-sm bg-green-500/90 border border-white/10" />
        </div>
        <span>More</span>
      </div>
      </div>
    </div>
  );
}
