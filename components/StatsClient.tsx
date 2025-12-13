"use strict";
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, PieChart, Tag, Hash, Activity } from "lucide-react";

interface Stats {
  total: number;
  solved: number;
  byDifficulty: { _id: string; count: number }[];
  byTopic: { _id: string; count: number }[];
  byTag: { _id: string; count: number }[];
  distinctTopics: string[];
  distinctTags: string[];
}

export default function StatsClient({ stats }: { stats: Stats }) {
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

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
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
                  {/* Background Circle */}
                  <path
                    className="text-white/5"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.8"
                  />
                  
                  {/* Easy Segment (Green) */}
                  <path
                    className="text-green-500"
                    strokeDasharray={`${easyPct}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.8"
                  />
                  
                  {/* Medium Segment (Yellow) - Rotated by easyDeg */}
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

                  {/* Hard Segment (Red) - Rotated by easyDeg + mediumDeg */}
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

                {/* Center Text */}
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
