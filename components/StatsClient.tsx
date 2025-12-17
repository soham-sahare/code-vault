"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, PieChart, Tag, Hash, Activity, Clock } from "lucide-react";
import { Select } from "./ui/SelectUtils";

interface Stats {
  total: number;
  solved: number;
  byDifficulty: { _id: string; count: number }[];
  byTopic: { _id: string; count: number }[];
  byTag: { _id: string; count: number }[];
  distinctTopics: string[];
  distinctTags: string[];
  byTimeComplexity: { _id: string; count: number }[];
  bySpaceComplexity: { _id: string; count: number }[];
  activityTimeline: { _id: string; count: number }[];
}

export default function StatsClient({ stats }: { stats: Stats }) {
  // Default to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [dateRange, setDateRange] = useState({
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
  });

  // Calculate percentages for the donut chart
  const easyCount = stats.byDifficulty.find((d) => d._id === "Easy")?.count || 0;
  const mediumCount = stats.byDifficulty.find((d) => d._id === "Medium")?.count || 0;
  const hardCount = stats.byDifficulty.find((d) => d._id === "Hard")?.count || 0;
  const totalSolved = stats.solved || 0;

  const easyPct = totalSolved ? (easyCount / totalSolved) * 100 : 0;
  const mediumPct = totalSolved ? (mediumCount / totalSolved) * 100 : 0;
  const hardPct = totalSolved ? (hardCount / totalSolved) * 100 : 0;

  const easyDeg = totalSolved ? (easyCount / totalSolved) * 360 : 0;
  const mediumDeg = totalSolved ? (mediumCount / totalSolved) * 360 : 0;

  const getFilteredActivity = () => {
      const activityMap = new Map(stats.activityTimeline?.map(a => [a._id, a.count]) || []);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      const dataPoints = [];

      if (diffDays <= 30) {
          // Daily Granularity
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];
              dataPoints.push({
                  date: dateStr,
                  label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                  count: activityMap.get(dateStr) || 0,
                  type: 'daily'
              });
          }
      } else {
           // Monthly Granularity
           // Normalize start to beginning of month to ensure we catch everything
           const current = new Date(start.getFullYear(), start.getMonth(), 1);
           const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

           while (current <= endMonth) {
               const year = current.getFullYear();
               const month = current.getMonth(); // 0-indexed
               const monthLabel = current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
               
               // Aggregate all days in this month
               let monthCount = 0;
               // Iterate days in this month
               const daysInMonth = new Date(year, month + 1, 0).getDate();
               for(let i = 1; i <= daysInMonth; i++) {
                   const dayDate = new Date(year, month, i); // Local time construction
                   // Manual ISO string construction to avoid timezone jumps
                   const y = dayDate.getFullYear();
                   const m = String(dayDate.getMonth() + 1).padStart(2, '0');
                   const d = String(dayDate.getDate()).padStart(2, '0');
                   const dayStr = `${y}-${m}-${d}`;
                   
                   monthCount += activityMap.get(dayStr) || 0;
               }

               dataPoints.push({
                   date: `${year}-${month}`, // Unique ID for key
                   label: monthLabel,
                   count: monthCount,
                   type: 'monthly'
               });

               current.setMonth(current.getMonth() + 1);
           }
      }
      return dataPoints;
  };
  
  const filteredActivity = getFilteredActivity();
  const maxActivity = Math.max(...filteredActivity.map(d => d.count), 1);

  // Sort complexities
  const sortedTime = [...(stats.byTimeComplexity || [])].sort((a,b) => b.count - a.count);
  const sortedSpace = [...(stats.bySpaceComplexity || [])].sort((a,b) => b.count - a.count);
  const maxTimeCount = Math.max(...sortedTime.map(t => t.count), 1);
  const maxSpaceCount = Math.max(...sortedSpace.map(s => s.count), 1);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [filteredActivity, dateRange]);

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Statistics & Analytics</h1>
            <p className="text-gray-400 mt-1">Detailed breakdown of your problem solving journey</p>
          </div>
        </div>

        {/* Top Row: Donut Chart & Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Difficulty Distribution (Donut Chart) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[300px]">
            <h3 className="text-lg font-semibold text-white mb-6 absolute top-6 left-6 flex items-center gap-2">
                <PieChart size={18} className="text-blue-400" />
                Difficulty Distribution
            </h3>
            
            <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                {/* SVG Donut */}
                <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                  <path
                    className="text-white/5"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.8"
                  />
                  <path
                    className="text-green-500"
                    strokeDasharray={`${easyPct}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.8"
                  />
                  {mediumCount > 0 && (
                      <path
                        className="text-yellow-500"
                        strokeDasharray={`${mediumPct}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.8"
                        style={{ transformOrigin: 'center', transform: `rotate(${easyDeg}deg)` }}
                      />
                  )}
                  {hardCount > 0 && (
                      <path
                        className="text-red-500"
                        strokeDasharray={`${hardPct}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.8"
                        style={{ transformOrigin: 'center', transform: `rotate(${easyDeg + mediumDeg}deg)` }}
                      />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{totalSolved}</span>
                  <span className="text-sm text-gray-400">Solved</span>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-8 grid grid-cols-3 gap-8 w-full px-8">
               <div className="flex flex-col items-center">
                   <div className="flex items-center gap-2 mb-1">
                       <span className="w-3 h-3 rounded-full bg-green-500"></span>
                       <span className="text-sm text-gray-400">Easy</span>
                   </div>
                   <span className="text-xl font-bold text-white">{easyCount}</span>
               </div>
               <div className="flex flex-col items-center">
                   <div className="flex items-center gap-2 mb-1">
                       <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                       <span className="text-sm text-gray-400">Med</span>
                   </div>
                   <span className="text-xl font-bold text-white">{mediumCount}</span>
               </div>
               <div className="flex flex-col items-center">
                   <div className="flex items-center gap-2 mb-1">
                       <span className="w-3 h-3 rounded-full bg-red-500"></span>
                       <span className="text-sm text-gray-400">Hard</span>
                   </div>
                   <span className="text-xl font-bold text-white">{hardCount}</span>
               </div>
            </div>
          </div>

          {/* Activity / Solved Summary Grid */}
          <div className="grid grid-rows-2 gap-6">
             {/* Total Stats */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center">
                 <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                     <Activity size={18} className="text-purple-400" />
                     Performance Overview
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white/5 rounded-xl">
                         <p className="text-sm text-gray-400">Completion Rate</p>
                         <p className="text-2xl font-bold text-white mt-1">
                            {stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%
                         </p>
                     </div>
                     <div className="p-4 bg-white/5 rounded-xl">
                         <p className="text-sm text-gray-400">Total Solved</p>
                         <p className="text-2xl font-bold text-white mt-1">{stats.solved}</p>
                     </div>
                 </div>
            </div>

            {/* Topics Summary (Top 3) */}
             <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Hash size={18} className="text-orange-400" />
                    Top Topics
                </h3>
                <div className="space-y-3">
                    {stats.byTopic.slice(0, 3).map((topic) => (
                        <div key={topic._id} className="flex items-center justify-between">
                            <span className="text-gray-300">{topic._id}</span>
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-orange-500 rounded-full" 
                                        style={{ width: `${(topic.count / totalSolved) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-medium text-white w-6 text-right">{topic.count}</span>
                            </div>
                        </div>
                    ))}
                    {stats.byTopic.length === 0 && <p className="text-gray-500 italic">No topics available yet.</p>}
                </div>
            </div>
          </div>
        </div>

        {/* Complexity Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Complexity */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                 <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Clock size={18} className="text-green-400" />
                    Time Complexity Distribution
                 </h3>
                 <div className="space-y-4">
                    {sortedTime.map((item) => (
                        <div key={item._id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300 font-mono">{item._id}</span>
                                <span className="text-gray-400">{item.count}</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-500/50 rounded-full transition-all duration-500" 
                                    style={{ width: `${(item.count / maxTimeCount) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {sortedTime.length === 0 && <p className="text-gray-500 italic">No solution data yet.</p>}
                 </div>
            </div>

            {/* Space Complexity */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                 <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Hash size={18} className="text-blue-400" />
                    Space Complexity Distribution
                 </h3>
                 <div className="space-y-4">
                    {sortedSpace.map((item) => (
                        <div key={item._id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300 font-mono">{item._id}</span>
                                <span className="text-gray-400">{item.count}</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500/50 rounded-full transition-all duration-500" 
                                    style={{ width: `${(item.count / maxSpaceCount) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {sortedSpace.length === 0 && <p className="text-gray-500 italic">No solution data yet.</p>}
                 </div>
            </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
             <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Activity size={18} className="text-yellow-400" />
                    Activity
                 </h3>
                  <div className="flex items-center gap-2">
                     <div className="relative">
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                        />
                        <span className="text-[10px] text-gray-500 absolute -top-2.5 left-2 bg-[#09090b] px-1">Start</span>
                     </div>
                     <span className="text-gray-500">-</span>
                     <div className="relative">
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                        />
                        <span className="text-[10px] text-gray-500 absolute -top-2.5 left-2 bg-[#09090b] px-1">End</span>
                     </div>
                  </div>
             </div>
             
             <div 
                ref={scrollContainerRef}
                className="h-64 w-full flex items-end gap-1 sm:gap-2 overflow-x-auto pt-16 pb-2 px-4 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-y-hidden"
             >
                {filteredActivity.map((day, idx) => (
                    <div key={day.date} className="flex flex-col justify-end items-center flex-1 h-full min-w-[20px] group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 border border-white/20 shadow-xl pointer-events-none transform -translate-x-1/2 left-1/2">
                            {day.count} solutions {day.type === 'monthly' ? 'in' : 'on'} {day.label}
                        </div>
                        
                        <div 
                            className={`w-full rounded-t-sm transition-all duration-300 ${day.count > 0 ? 'bg-yellow-500/60 hover:bg-yellow-400' : 'bg-white/5'}`}
                            style={{ height: `${Math.max((day.count / maxActivity) * 80, 4)}%` }} // Adjusted height scale to fit new container
                        ></div>
                        
                        {/* Intelligent X-Axis Labeling */}
                        {(
                            (filteredActivity.length <= 15) || 
                            (filteredActivity.length <= 30 && idx % 3 === 0) || 
                            (filteredActivity.length > 30 && idx % Math.ceil(filteredActivity.length / 10) === 0)
                        ) && (
                            <span className="text-[10px] text-gray-600 mt-2 truncate w-full text-center">{day.label}</span>
                        )}
                    </div>
                ))}
             </div>
        </div>

        {/* Detailed Breakdowns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* All Topics List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Hash size={18} className="text-blue-400" />
                    Topic Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                    {stats.byTopic.map((topic) => (
                        <div key={topic._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-gray-300 text-sm truncate pr-2" title={topic._id}>{topic._id}</span>
                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-white font-medium">{topic.count}</span>
                        </div>
                    ))}
                    {stats.byTopic.length === 0 && <p className="text-gray-500 col-span-2 text-center py-4">No data to display.</p>}
                </div>
            </div>

            {/* All Tags List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Tag size={18} className="text-pink-400" />
                    Tag Breakdown
                </h3>
                <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto content-start scrollbar-thin scrollbar-thumb-white/10">
                    {stats.byTag.map((tag) => (
                        <div key={tag._id} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition cursor-default">
                             <span className="text-gray-300 text-sm">{tag._id}</span>
                             <span className="bg-white/10 px-1.5 rounded-full text-[10px] text-gray-400 font-mono">{tag.count}</span>
                        </div>
                    ))}
                     {stats.byTag.length === 0 && <p className="text-gray-500 text-center w-full py-4">No data to display.</p>}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
