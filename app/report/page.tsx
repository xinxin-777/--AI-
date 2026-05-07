'use client';

import { useEffect, useState } from 'react';
import { loadRecentRecords, loadProfile, MealRecord } from '@/lib/storage';

interface WeeklyStats {
  totalDays: number;
  checkedDays: number;
  averageScore: number;
  highRiskMeals: number;
  achieveRate: number;
  topRiskFoods: string[];
  dailyScores: { date: string; score: number | null }[];
  todayRecords: MealRecord[];
}

function getScoreColor(score: number | null): string {
  if (score === null) return '#E5E0D9';
  if (score >= 75) return '#3A8C5C';
  if (score >= 55) return '#D97B3A';
  return '#C94F42';
}

function getDayLabel(dateStr: string): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const d = new Date(dateStr);
  return days[d.getDay()];
}

function computeWeeklyStats(records: MealRecord[]): WeeklyStats {
  const now = new Date();
  const daily: { [date: string]: MealRecord[] } = {};

  // Build last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily[key] = [];
  }

  for (const r of records) {
    const key = new Date(r.timestamp).toISOString().slice(0, 10);
    if (key in daily) {
      daily[key].push(r);
    }
  }

  const dailyScores = Object.entries(daily).map(([date, recs]) => ({
    date,
    score: recs.length > 0 ? Math.round(recs.reduce((s, r) => s + r.score, 0) / recs.length) : null,
  }));

  const checkedDays = dailyScores.filter((d) => d.score !== null).length;
  const validScores = dailyScores.filter((d) => d.score !== null).map((d) => d.score!);
  const averageScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  const highRiskMeals = records.filter((r) => r.score < 55).length;
  const achieveRate = checkedDays > 0 ? Math.round((validScores.filter((s) => s >= 65).length / checkedDays) * 100) : 0;

  // Top risk foods
  const foodCounts: { [name: string]: number } = {};
  for (const r of records) {
    for (const f of r.foods) {
      if (f.riskLevel !== 'ok') {
        foodCounts[f.name] = (foodCounts[f.name] || 0) + 1;
      }
    }
  }
  const topRiskFoods = Object.entries(foodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  // Today's records
  const todayKey = now.toISOString().slice(0, 10);
  const todayRecords = daily[todayKey] || [];

  return {
    totalDays: 7,
    checkedDays,
    averageScore,
    highRiskMeals,
    achieveRate,
    topRiskFoods,
    dailyScores,
    todayRecords,
  };
}

const RISK_COUNT_MAP = (records: MealRecord[]): { [name: string]: number } => {
  const counts: { [name: string]: number } = {};
  for (const r of records) {
    for (const f of r.foods) {
      if (f.riskLevel !== 'ok') {
        counts[f.name] = (counts[f.name] || 0) + 1;
      }
    }
  }
  return counts;
};

export default function ReportPage() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [riskCounts, setRiskCounts] = useState<{ [name: string]: number }>({});

  useEffect(() => {
    const records = loadRecentRecords(7);
    const s = computeWeeklyStats(records);
    setStats(s);
    setRiskCounts(RISK_COUNT_MAP(records));
  }, []);

  const fetchAdvice = async () => {
    if (!stats) return;
    setLoadingAdvice(true);
    try {
      const profile = loadProfile();
      const resp = await fetch('/api/weekly-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyData: {
            averageScore: stats.averageScore,
            checkedDays: stats.checkedDays,
            highRiskMeals: stats.highRiskMeals,
            topRiskFoods: stats.topRiskFoods,
          },
          userProfile: profile,
        }),
      });
      const data = await resp.json();
      setAdvice(data.advice);
    } catch {
      setAdvice('暂时无法获取建议，请稍后重试。');
    } finally {
      setLoadingAdvice(false);
    }
  };

  if (!stats) return null;

  const maxRiskCount = Math.max(...Object.values(riskCounts), 1);

  return (
    <div className="app-container pb-safe">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="font-serif text-xl font-bold text-[#1A1F1C]">饮食周报</h1>
        <p className="text-sm text-[#9AA5A2]">近7天饮食健康总结</p>
      </div>

      <div className="px-4 space-y-4 pb-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '本周达标率', value: `${stats.achieveRate}%`, color: '#1A6B5C' },
            { label: '打卡天数', value: `${stats.checkedDays}/7天`, color: '#3A8C5C' },
            { label: '平均评分', value: `${stats.averageScore}分`, color: '#D97B3A' },
            { label: '高风险餐次', value: `${stats.highRiskMeals}次`, color: '#C94F42' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl p-4">
              <p className="text-xs text-[#9AA5A2] mb-1">{item.label}</p>
              <p className="text-2xl font-bold" style={{ color: item.color }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* 7-Day Calendar */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-serif text-base font-semibold text-[#1A1F1C] mb-4">
            7日评分日历
          </h2>
          <div className="flex justify-between gap-1">
            {stats.dailyScores.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full aspect-square rounded-xl flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: `${getScoreColor(d.score)}20`,
                    color: getScoreColor(d.score),
                  }}
                >
                  {d.score !== null ? d.score : '—'}
                </div>
                <span className="text-xs text-[#9AA5A2]">周{getDayLabel(d.date)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 justify-center">
            {[
              { color: '#3A8C5C', label: '≥75 良好' },
              { color: '#D97B3A', label: '≥55 注意' },
              { color: '#C94F42', label: '<55 警告' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-[#9AA5A2]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today Records */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-serif text-base font-semibold text-[#1A1F1C] mb-3">
            今日餐次
          </h2>
          {stats.todayRecords.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[#9AA5A2]">今日暂无记录</p>
              <p className="text-xs text-[#C8C3BC] mt-1">去拍照分析您的餐食吧</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.todayRecords.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.thumbnailBase64}
                    alt="餐食"
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1A1F1C]">
                        {r.foods.slice(0, 2).map((f) => f.name).join('、')}
                        {r.foods.length > 2 ? '...' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: getScoreColor(r.score) }}
                      >
                        {r.score}分
                      </span>
                      <span className="text-xs text-[#9AA5A2]">
                        {new Date(r.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk Foods Bar Chart */}
        {stats.topRiskFoods.length > 0 && (
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-serif text-base font-semibold text-[#1A1F1C] mb-4">
              高风险食材 Top 5
            </h2>
            <div className="space-y-3">
              {stats.topRiskFoods.map((food) => {
                const count = riskCounts[food] || 0;
                const pct = Math.round((count / maxRiskCount) * 100);
                return (
                  <div key={food} className="flex items-center gap-3">
                    <span className="text-sm text-[#5A6360] w-16 flex-shrink-0">{food}</span>
                    <div className="flex-1 h-2.5 bg-[#F4F1EC] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C94F42] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#9AA5A2] w-8 text-right">{count}次</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Advice */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-base font-semibold text-[#1A1F1C]">
              下周饮食建议
            </h2>
            {!advice && (
              <button
                onClick={fetchAdvice}
                disabled={loadingAdvice}
                className="px-3 py-1.5 bg-[#1A6B5C] text-white text-xs font-medium rounded-full disabled:opacity-60"
              >
                {loadingAdvice ? '生成中...' : 'AI 生成'}
              </button>
            )}
          </div>
          {advice ? (
            <p className="text-sm text-[#5A6360] leading-relaxed">{advice}</p>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-[#9AA5A2]">点击"AI 生成"获取个性化建议</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
