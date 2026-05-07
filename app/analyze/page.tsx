'use client';

import { useState, useRef, useCallback } from 'react';
import {
  loadProfile,
  saveMealRecord,
  compressImageToThumbnail,
  MealRecord,
  FoodItem,
  Suggestion,
  Nutrients,
} from '@/lib/storage';

type ScoreLevel = 'excellent' | 'good' | 'caution' | 'poor';

interface AnalysisResult {
  score: number;
  scoreLevel: ScoreLevel;
  foods: FoodItem[];
  suggestions: Suggestion[];
  nutrients: Nutrients;
}

const SCORE_COLORS: Record<ScoreLevel, string> = {
  excellent: '#3A8C5C',
  good: '#1A6B5C',
  caution: '#D97B3A',
  poor: '#C94F42',
};

const SCORE_LABELS: Record<ScoreLevel, string> = {
  excellent: '非常适合',
  good: '整体良好',
  caution: '需要注意',
  poor: '不建议',
};

const RISK_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ok: { bg: 'bg-[#3A8C5C]/10', text: 'text-[#3A8C5C]', label: '适合' },
  warn: { bg: 'bg-[#D97B3A]/10', text: 'text-[#D97B3A]', label: '注意' },
  bad: { bg: 'bg-[#C94F42]/10', text: 'text-[#C94F42]', label: '不建议' },
};

function ScoreRing({ score, level }: { score: number; level: ScoreLevel }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = SCORE_COLORS[level];

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#E5E0D9" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="70" y="65" textAnchor="middle" fill={color} fontSize="32" fontWeight="700">
          {score}
        </text>
        <text x="70" y="85" textAnchor="middle" fill="#9AA5A2" fontSize="12">
          {SCORE_LABELS[level]}
        </text>
      </svg>
    </div>
  );
}

function NutrientBar({
  label,
  value,
  unit,
  percentage,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  percentage: number;
  color: string;
}) {
  const pct = Math.min(percentage, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#5A6360]">{label}</span>
        <span className="text-[#1A1F1C] font-medium">
          {value}
          {unit}
          <span className="text-[#9AA5A2] font-normal ml-1">({percentage}%)</span>
        </span>
      </div>
      <div className="h-2 bg-[#E5E0D9] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);

    try {
      const profile = loadProfile();
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, userProfile: profile }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '分析失败');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      // Save record with thumbnail
      const thumbnail = await compressImageToThumbnail(imageBase64, mimeType);
      const record: MealRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        thumbnailBase64: thumbnail,
        score: data.score,
        scoreLevel: data.scoreLevel,
        foods: data.foods,
        suggestions: data.suggestions,
        nutrients: data.nutrients,
      };
      saveMealRecord(record);
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析出错，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container pb-safe">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="font-serif text-xl font-bold text-[#1A1F1C]">拍照分析</h1>
        <p className="text-sm text-[#9AA5A2]">上传您的餐食照片，获取个性化建议</p>
      </div>

      {/* Upload Area */}
      <div className="px-4 mb-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !imagePreview && fileInputRef.current?.click()}
          className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${
            dragging ? 'ring-2 ring-[#1A6B5C]' : ''
          }`}
        >
          {imagePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="上传的餐食"
                className="w-full h-56 object-cover rounded-2xl"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImagePreview(null);
                  setImageBase64(null);
                  setResult(null);
                  setError(null);
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-lg leading-none">×</span>
              </button>
            </div>
          ) : (
            <div className="h-48 bg-white border-2 border-dashed border-[#C8C3BC] rounded-2xl flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 bg-[#1A6B5C]/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#1A6B5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#1A6B5C]">点击上传或拖拽图片</p>
              <p className="text-xs text-[#9AA5A2]">支持 JPG、PNG 格式</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Analyze Button */}
      {imageBase64 && !result && (
        <div className="px-4 mb-6">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#1A6B5C] text-white font-semibold text-base disabled:opacity-60 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI 正在分析中...
              </span>
            ) : (
              '开始分析'
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-[#C94F42]/10 rounded-xl">
          <p className="text-sm text-[#C94F42]">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="px-4 mb-4">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 border-3 border-[#E5E0D9] border-t-[#1A6B5C] rounded-full animate-spin" />
            <p className="text-sm font-medium text-[#1A1F1C]">识别食物中...</p>
            <p className="text-xs text-[#9AA5A2] mt-1">正在调用 AI 进行专业评估</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="px-4 space-y-4 pb-4">
          {/* Score Card */}
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-serif text-base font-semibold text-[#1A1F1C] mb-4">
              综合评分
            </h2>
            <div className="flex items-center gap-6">
              <ScoreRing score={result.score} level={result.scoreLevel} />
              <div className="flex-1">
                <div
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2"
                  style={{
                    backgroundColor: `${SCORE_COLORS[result.scoreLevel]}20`,
                    color: SCORE_COLORS[result.scoreLevel],
                  }}
                >
                  {SCORE_LABELS[result.scoreLevel]}
                </div>
                <p className="text-xs text-[#9AA5A2]">基于您的健康档案综合评估</p>
              </div>
            </div>
          </div>

          {/* Food List */}
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-serif text-base font-semibold text-[#1A1F1C] mb-3">
              食物识别
            </h2>
            <div className="space-y-2">
              {result.foods.map((food, i) => {
                const style = RISK_STYLES[food.riskLevel] || RISK_STYLES.ok;
                return (
                  <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-[#F4F1EC] last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1A1F1C]">{food.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#9AA5A2]">{food.amount}</span>
                        {food.riskReason && (
                          <span className="text-xs text-[#5A6360]">· {food.riskReason}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="bg-white rounded-2xl p-5">
              <h2 className="font-serif text-base font-semibold text-[#1A1F1C] mb-3">
                AI 替代建议
              </h2>
              <div className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="bg-[#F4F1EC] rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-[#C94F42] line-through">{s.original}</span>
                      <svg className="w-4 h-4 text-[#9AA5A2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm text-[#3A8C5C] font-medium">{s.replacement}</span>
                    </div>
                    <p className="text-xs text-[#9AA5A2]">{s.benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutrients */}
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-serif text-base font-semibold text-[#1A1F1C] mb-4">
              营养素摄入
            </h2>
            <div className="space-y-3">
              <NutrientBar
                label="热量"
                value={result.nutrients.calories.value}
                unit="kcal"
                percentage={result.nutrients.calories.percentage}
                color="#D97B3A"
              />
              <NutrientBar
                label="钠"
                value={result.nutrients.sodium.value}
                unit="mg"
                percentage={result.nutrients.sodium.percentage}
                color={result.nutrients.sodium.percentage > 70 ? '#C94F42' : '#1A6B5C'}
              />
              <NutrientBar
                label="蛋白质"
                value={result.nutrients.protein.value}
                unit="g"
                percentage={result.nutrients.protein.percentage}
                color="#3A8C5C"
              />
              <NutrientBar
                label="碳水化合物"
                value={result.nutrients.carbs.value}
                unit="g"
                percentage={result.nutrients.carbs.percentage}
                color="#1A6B5C"
              />
            </div>
          </div>

          {/* Re-analyze */}
          <button
            onClick={() => {
              setImagePreview(null);
              setImageBase64(null);
              setResult(null);
            }}
            className="w-full py-3 rounded-2xl border-2 border-[#1A6B5C] text-[#1A6B5C] font-medium text-sm"
          >
            重新分析
          </button>
        </div>
      )}
    </div>
  );
}
