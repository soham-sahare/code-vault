"use client";

import { useState, useRef, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { Link as LinkIcon, ArrowLeft, PieChart, Tag, Hash, Activity, Clock, Loader2, RotateCcw } from "lucide-react";
import { Select } from "./ui/SelectUtils";
import { DatePicker } from "./ui/DatePicker";
import { getUserStats } from "@/actions/problem";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ActivityHeatmap } from "./ActivityHeatmap";

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
  activityTimeline: { _id: string; solutions: number; problems: number }[];
}

export default function StatsClient({ stats: initialStats }: { stats: Stats }) {
  // Default to Last 7 Days
  // Helper for local YYYY-MM-DD
  const toLocalYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  // Default to Last 7 Days (Today Inclusive)
  // Logic: End = Today, Start = Today - 6 days (total 7 days range)
  const getInitialDates = () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6); // 7 days inclusive
      return { start: toLocalYMD(start), end: toLocalYMD(end) };
  };

  const initialDates = getInitialDates();
  
  const [stats, setStats] = useState(initialStats);
  const [dateRange, setDateRange] = useState(initialDates);
  const [selectedPreset, setSelectedPreset] = useState("7d");
  const [isPending, startTransition] = useTransition();

  const DURATION_OPTIONS = [
    { label: "All Time", value: "all" },
    { label: "Last 24 Hours", value: "1d" },
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 15 Days", value: "15d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 3 Months", value: "3m" },
    { label: "Last 6 Months", value: "6m" },
    { label: "Last 9 Months", value: "9m" },
    { label: "Last 1 Year", value: "12m" },
  ];

  useEffect(() => {
    // Only fetch if not initial mount (simple check via preset logic or ref if needed)
    // But here we rely on the fact that initial state is set correctly.
    // However, if initialStats are NOT all-time, we might mismatch.
    // Assuming initialStats passed from server are also All Time by default (which they are).
    
    // If user changes dates manually, we fetch.
    const fetchData = () => {
        startTransition(async () => {
            const res = await getUserStats(dateRange.start || undefined, dateRange.end || undefined);
            if ('error' in res) {
                toast.error("Failed to update stats");
            } else {
                setStats(res as Stats);
            }
        });
    };
    
    fetchData();
  }, [dateRange]);

  const handlePresetChange = (val: string) => {
      setSelectedPreset(val);
      
      if (val === 'all') {
          setDateRange({ start: "", end: "" });
          return;
      }

      const end = new Date(); // Local today
      const start = new Date();
      
      switch(val) {
          case "1d": start.setDate(end.getDate()); break; // Today only? Or last 24h? Usually stats for "Today" meant 1d.
          // Adjusting 7d to be inclusive of today: Today - 6 days
          case "7d": start.setDate(end.getDate() - 6); break; 
          case "15d": start.setDate(end.getDate() - 14); break;
          case "30d": start.setDate(end.getDate() - 29); break;
          case "3m": start.setMonth(end.getMonth() - 3); break;
          case "6m": start.setMonth(end.getMonth() - 6); break;
          case "9m": start.setMonth(end.getMonth() - 9); break;
          case "12m": start.setFullYear(end.getFullYear() - 1); break;
      }

      setDateRange({
          start: toLocalYMD(start),
          end: toLocalYMD(end)
      });
  };

  const resetFilters = () => {
      const dates = getInitialDates();
      setSelectedPreset("7d");
      setDateRange(dates);
  };

  const handleDateChange = (key: 'start' | 'end', val: string) => {
      setDateRange(prev => ({ ...prev, [key]: val }));
      setSelectedPreset("custom"); // Reset preset if manually changed
  };

  const onDateChange = (key: 'start' | 'end', date: Date | undefined) => {
      if (!date) return;
      // Use local date to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;
      handleDateChange(key, localDateStr);
  };

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

  const filteredActivity = useMemo(() => {
      const activityMap = new Map(stats.activityTimeline?.map(a => [a._id, a]) || []);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      const formatLabel = (date: Date, type: 'daily' | 'monthly') => {
          if (type === 'daily') {
              return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          }
          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      };

      const data = [];

      if (diffDays <= 30) {
          // Daily Granularity
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];
              const dayData = activityMap.get(dateStr);
              data.push({
                  date: dateStr,
                  label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                  solutions: dayData?.solutions || 0,
                  problems: dayData?.problems || 0,
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
               let monthSolutions = 0;
               let monthProblems = 0;
               // Iterate days in this month
               const daysInMonth = new Date(year, month + 1, 0).getDate();
               for(let i = 1; i <= daysInMonth; i++) {
                   const dayDate = new Date(year, month, i); // Local time construction
                   // Manual ISO string construction to avoid timezone jumps

                   const y = dayDate.getFullYear();
                   const m = String(dayDate.getMonth() + 1).padStart(2, '0');
                   const d = String(dayDate.getDate()).padStart(2, '0');
                   const dayStr = `${y}-${m}-${d}`;
                   
                   const dayData = activityMap.get(dayStr);
                   monthSolutions += dayData?.solutions || 0;
                   monthProblems += dayData?.problems || 0;
               }

               data.push({
                   date: `${year}-${month}`,
                   label: formatLabel(current, 'monthly'),
                   solutions: monthSolutions,
                   problems: monthProblems,
                   type: 'monthly'
               });

               current.setMonth(current.getMonth() + 1);
           }
      }
      return data;
  }, [stats.activityTimeline, dateRange]);
  
  const maxActivity = Math.max(...filteredActivity.map(d => Math.max(d.solutions, d.problems)), 1);

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
        
         {/* Header & Global Filters */}
         <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
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

            {/* Global Filters moved here */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-2 w-full lg:w-auto">
                 <div className="w-full sm:w-48 min-w-[120px]">
                    <Select 
                        options={[...DURATION_OPTIONS, { label: "Custom", value: "custom" }]}
                        value={selectedPreset}
                        onChange={handlePresetChange}
                        placeholder="Period"
                    />
                 </div>
                 
                 <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:w-[150px]">
                        <DatePicker 
                            date={dateRange.start ? new Date(dateRange.start + 'T00:00:00') : undefined}
                            setDate={(d) => onDateChange('start', d)}
                            label="Start"
                        />
                    </div>
                    <span className="text-gray-500 hidden sm:block">-</span>
                    <div className="flex-1 sm:w-[150px]">
                        <DatePicker 
                            date={dateRange.end ? new Date(dateRange.end + 'T00:00:00') : undefined}
                            setDate={(d) => onDateChange('end', d)}
                            label="End"
                        />
                    </div>
                 </div>

                 <button 
                     onClick={resetFilters}
                     className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center h-10 w-10 sm:h-auto sm:w-auto self-center sm:self-auto"
                     title="Reset Filters"
                 >
                     <RotateCcw size={18} />
                 </button>
            </div>
         </div>
        
        {isPending && (
            <div className="fixed top-4 right-4 z-50 bg-black/80 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Loader2 size={16} className="animate-spin text-blue-400" />
                <span className="text-sm text-white">Updating stats...</span>
            </div>
        )}

        {/* Top Row: Donut Chart & Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Difficulty Distribution (Donut Chart) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[300px]">
            <h3 className="text-lg font-semibold text-white mb-6 w-full flex items-center gap-2">
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
            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-8 w-full px-2 sm:px-8">
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
             </div>
             
             <div 
                ref={scrollContainerRef}
                className="h-[300px] w-full overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
             >
                {/* 
                  Container width logic:
                  If filtering by 'all' or large range, ensure chart is wide enough to scroll.
                  Otherwise, fit 100%.
                */}
                <div style={{ minWidth: filteredActivity.length > 50 ? `${filteredActivity.length * 20}px` : '100%', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSolutions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis 
                                dataKey="label" 
                                stroke="#525252" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                interval="preserveStartEnd"
                                minTickGap={30}
                            />
                            <YAxis 
                                stroke="#525252" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                allowDecimals={false}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '12px' }}
                                labelStyle={{ color: '#a1a1aa', marginBottom: '4px', fontSize: '12px' }}
                                cursor={{ stroke: '#ffffff20' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="solutions" 
                                name="Total Solutions"
                                stroke="#EAB308" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorSolutions)" 
                            />
                            <Area 
                                type="monotone" 
                                dataKey="problems" 
                                name="Problems Practiced"
                                stroke="#8B5CF6" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorProblems)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
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
                    {stats.byTopic.map((topic) => {
                        const maxTopicCount = Math.max(...stats.byTopic.map(t => t.count), 1);
                        const width = (topic.count / maxTopicCount) * 100;
                        
                        return (
                            <div key={topic._id} className="relative flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 overflow-hidden group hover:border-white/10 transition">
                                <div 
                                    className="absolute inset-y-0 left-0 bg-blue-500/10 transition-all duration-1000 ease-out" 
                                    style={{ width: `${width}%` }}
                                ></div>
                                <span className="relative z-10 text-gray-300 text-sm truncate pr-2 font-medium" title={topic._id}>{topic._id}</span>
                                <span className="relative z-10 bg-black/20 px-2 py-0.5 rounded text-xs text-white font-medium border border-white/5">{topic.count}</span>
                            </div>
                        );
                    })}
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

        {/* Activity Heatmap */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
           <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
               <Activity size={18} className="text-green-400" />
               Activity Heatmap
           </h3>
           <ActivityHeatmap 
             data={stats.activityTimeline.map(item => ({
               date: item._id,
               count: item.solutions || item.problems || 0
             }))}
           />
        </div>

      </div>
    </div>
  );
}
