'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadProfile, loadRecentRecords, UserProfile, MealRecord } from '@/lib/storage';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

const DISEASE_LABELS: Record<string, string> = {
  hypertension: '高血压',
  diabetes: '2型糖尿病',
  hyperuricemia: '高尿酸血症',
  hyperlipidemia: '高血脂',
};

function getScoreColor(score: number): string {
  if (score >= 75) return '#3A8C5C';
  if (score >= 55) return '#D97B3A';
  return '#C94F42';
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentRecords, setRecentRecords] = useState<MealRecord[]>([]);
  const [weekAvg, setWeekAvg] = useState<number>(0);

  useEffect(() => {
    setProfile(loadProfile());
    const records = loadRecentRecords(7);
    setRecentRecords(records.slice(0, 3));
    if (records.length > 0) {
      setWeekAvg(Math.round(records.reduce((s, r) => s + r.score, 0) / records.length));
    }
  }, []);

  const diseaseNames = profile?.diseases.map((d) => DISEASE_LABELS[d] || d) || [];

  return (
    <div className="app-container pb-safe">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-8 rounded-b-3xl"
        style={{ background: 'linear-gradient(135deg, #1A6B5C 0%, #2D8B72 100%)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm">{getGreeting()}</p>
            <h1 className="font-serif text-2xl font-bold text-white mt-1">慢护</h1>
            <p className="text-white/70 text-xs mt-1">AI 慢病饮食管家</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl">🌿</span>
          </div>
        </div>

        {/* Health Tags */}
        {diseaseNames.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {diseaseNames.map((name) => (
              <span
                key={name}
                className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-medium"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Week Summary */}
        {recentRecords.length > 0 && (
          <div className="mt-4 bg-white/15 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs">本周平均评分</p>
              <p className="text-white text-2xl font-bold">{weekAvg}分</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">记录餐次</p>
              <p className="text-white text-2xl font-bold">{recentRecords.length}次</p>
            </div>
            <Link
              href="/report"
              className="px-3 py-2 bg-white/20 rounded-xl text-white text-xs font-medium"
            >
              查看周报 →
            </Link>
          </div>
        )}
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/analyze"
            className="bg-[#1A6B5C] rounded-2xl p-4 text-white flex flex-col gap-2 active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold">拍照分析</p>
            <p className="text-xs text-white/70">识别食物风险</p>
          </Link>
          <Link
            href="/report"
            className="bg-white rounded-2xl p-4 flex flex-col gap-2 active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 bg-[#1A6B5C]/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1A6B5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#1A1F1C]">饮食周报</p>
            <p className="text-xs text-[#9AA5A2]">查看本周总结</p>
          </Link>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-base font-semibold text-[#1A1F1C]">最近记录</h2>
            <Link href="/report" className="text-xs text-[#1A6B5C]">查看全部</Link>
          </div>
          {recentRecords.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-4xl mb-2">🥗</p>
              <p className="text-sm text-[#9AA5A2]">还没有饮食记录</p>
              <Link
                href="/analyze"
                className="mt-3 inline-block px-4 py-2 bg-[#1A6B5C]/10 text-[#1A6B5C] text-sm font-medium rounded-full"
              >
                去拍照分析
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.thumbnailBase64}
                    alt="餐食"
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1A1F1C] truncate">
                      {r.foods.slice(0, 2).map((f) => f.name).join('、')}
                      {r.foods.length > 2 ? '...' : ''}
                    </p>
                    <p className="text-xs text-[#9AA5A2] mt-0.5">
                      {new Date(r.timestamp).toLocaleString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div
                    className="text-lg font-bold"
                    style={{ color: getScoreColor(r.score) }}
                  >
                    {r.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Summary */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-base font-semibold text-[#1A1F1C]">健康档案</h2>
            <Link href="/onboarding" className="text-xs text-[#1A6B5C]">修改</Link>
          </div>
          {profile ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs text-[#9AA5A2] w-14 flex-shrink-0">病种</span>
                <span className="text-xs text-[#5A6360]">
                  {diseaseNames.length > 0 ? diseaseNames.join('、') : '未设置'}
                </span>
              </div>
              {profile.allergies.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[#9AA5A2] w-14 flex-shrink-0">禁忌</span>
                  <span className="text-xs text-[#5A6360]">{profile.allergies.join('、')}</span>
                </div>
              )}
              {profile.metrics.fastingBloodSugar && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[#9AA5A2] w-14 flex-shrink-0">空腹血糖</span>
                  <span className="text-xs text-[#5A6360]">{profile.metrics.fastingBloodSugar} mmol/L</span>
                </div>
              )}
            </div>
          ) : (
            <Link href="/onboarding" className="text-sm text-[#1A6B5C]">
              设置健康档案 →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
