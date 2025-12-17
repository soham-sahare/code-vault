"use client";

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Lightbulb, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Problem {
  difficulty: string;
  topic: string[];
  status: string;
  lastPracticed?: string;
}

interface AnalyticsInsightsProps {
  problems: Problem[];
  stats: {
    total: number;
    solved: number;
    byDifficulty: { _id: string; count: number }[];
    byTopic: { _id: string; count: number }[];
  };
}

export function AnalyticsInsights({ problems, stats }: AnalyticsInsightsProps) {
  const insights = useMemo(() => {
    // Calculate completion rate
    const completionRate = stats.total > 0 ? (stats.solved / stats.total * 100) : 0;
    
    // Find weakest topics (topics with lowest completion rate)
    const topicStats = stats.byTopic.map(topic => {
      const topicProblems = problems.filter(p => p.topic.includes(topic._id));
      const topicSolved = topicProblems.filter(p => p.status === 'Solved').length;
      const completionRate = topicProblems.length > 0 ? (topicSolved / topicProblems.length * 100) : 0;
      
      return {
        name: topic._id,
        total: topicProblems.length,
        solved: topicSolved,
        completionRate
      };
    }).sort((a, b) => a.completionRate - b.completionRate);

    const weakestTopics = topicStats.slice(0, 3).filter(t => t.total > 0);
    const strongestTopics = topicStats.slice(-3).reverse().filter(t => t.total > 0 && t.completionRate > 0);

    // Calculate difficulty distribution
    const difficultyMap = new Map(stats.byDifficulty.map(d => [d._id, d.count]));
    const easyCount = difficultyMap.get('Easy') || 0;
    const mediumCount = difficultyMap.get('Medium') || 0;
    const hardCount = difficultyMap.get('Hard') || 0;
    
    // Find problems that need review (not practiced in last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const needsReview = problems.filter(p => {
      if (!p.lastPracticed || p.status !== 'Solved') return false;
      const lastPracticed = new Date(p.lastPracticed);
      return lastPracticed < sevenDaysAgo;
    }).length;

    // Generate recommendations
    const recommendations = [];
    
    if (completionRate < 30) {
      recommendations.push({
        type: 'warning',
        title: 'Low Completion Rate',
        message: `You've solved ${completionRate.toFixed(1)}% of problems. Try to maintain consistency!`,
        icon: AlertCircle
      });
    } else if (completionRate >= 70) {
      recommendations.push({
        type: 'success',
        title: 'Great Progress!',
        message: `${completionRate.toFixed(1)}% completion rate. Keep up the excellent work!`,
        icon: CheckCircle2
      });
    }

    if (weakestTopics.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Focus Areas',
        message: `Consider practicing: ${weakestTopics.map(t => t.name).join(', ')}`,
        icon: Target
      });
    }

    if (needsReview > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Review Needed',
        message: `${needsReview} problem${needsReview > 1 ? 's' : ''} need review to maintain retention`,
        icon: TrendingDown
      });
    }

    if (hardCount > 0 && hardCount / stats.solved > 0.3) {
      recommendations.push({
        type: 'success',
        title: 'Challenging Yourself',
        message: `${((hardCount / stats.solved) * 100).toFixed(0)}% of solved problems are Hard difficulty!`,
        icon: TrendingUp
      });
    }

    return {
      completionRate,
      weakestTopics,
      strongestTopics,
      needsReview,
      recommendations,
      difficultyBalance: {
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount
      }
    };
  }, [problems, stats]);

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'info': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default: return 'bg-white/5 border-white/10 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-medium text-gray-400">Completion Rate</h4>
          </div>
          <p className="text-2xl font-bold text-white">{insights.completionRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">{stats.solved} of {stats.total} solved</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-medium text-gray-400">Needs Review</h4>
          </div>
          <p className="text-2xl font-bold text-white">{insights.needsReview}</p>
          <p className="text-xs text-gray-500 mt-1">Problems to review</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h4 className="text-sm font-medium text-gray-400">Difficulty Balance</h4>
          </div>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-green-400">{insights.difficultyBalance.easy}</p>
              <p className="text-[10px] text-gray-500">Easy</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-yellow-400">{insights.difficultyBalance.medium}</p>
              <p className="text-[10px] text-gray-500">Med</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-red-400">{insights.difficultyBalance.hard}</p>
              <p className="text-[10px] text-gray-500">Hard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            Recommendations
          </h3>
          {insights.recommendations.map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-4 rounded-xl border ${getRecommendationColor(rec.type)}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                  <p className="text-xs opacity-80 mt-1">{rec.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weakness Analysis */}
      {insights.weakestTopics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Areas to Improve</h3>
          <div className="space-y-2">
            {insights.weakestTopics.map((topic, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{topic.name}</span>
                  <span className="text-xs text-gray-400">{topic.solved}/{topic.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-red-500/50 h-2 rounded-full transition-all"
                    style={{ width: `${topic.completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{topic.completionRate.toFixed(0)}% complete</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {insights.strongestTopics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Your Strengths</h3>
          <div className="flex flex-wrap gap-2">
            {insights.strongestTopics.map((topic, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-400 flex items-center gap-2"
              >
                <CheckCircle2 className="w-3 h-3" />
                {topic.name} ({topic.completionRate.toFixed(0)}%)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
