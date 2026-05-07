'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProfile, UserProfile } from '@/lib/storage';

const DISEASES = [
  { id: 'hypertension', label: '高血压', icon: '🩺' },
  { id: 'diabetes', label: '2型糖尿病', icon: '🩸' },
  { id: 'hyperuricemia', label: '高尿酸血症', icon: '💊' },
  { id: 'hyperlipidemia', label: '高血脂', icon: '🫀' },
];

const ALLERGIES = ['花生', '虾贝', '麸质', '乳制品', '鸡蛋'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [diseases, setDiseases] = useState<string[]>([]);
  const [metrics, setMetrics] = useState({ fastingBloodSugar: '', bloodPressure: '' });
  const [allergies, setAllergies] = useState<string[]>([]);

  const toggleDisease = (id: string) => {
    setDiseases((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleAllergy = (a: string) => {
    setAllergies((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleFinish = () => {
    const profile: UserProfile = { diseases, metrics, allergies };
    saveProfile(profile);
    router.push('/dashboard');
  };

  return (
    <div className="app-container min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <h1 className="font-serif text-2xl font-bold text-[#1A1F1C]">慢护</h1>
        <p className="text-sm text-[#9AA5A2] mt-1">AI 慢病饮食管家</p>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  s <= step
                    ? 'bg-[#1A6B5C] text-white'
                    : 'bg-white border-2 border-[#9AA5A2] text-[#9AA5A2]'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 rounded transition-all ${
                    s < step ? 'bg-[#1A6B5C]' : 'bg-[#E5E0D9]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-[#5A6360]">选择病种</span>
          <span className="text-xs text-[#5A6360]">关键指标</span>
          <span className="text-xs text-[#5A6360]">过敏禁忌</span>
        </div>
      </div>

      <div className="flex-1 px-6">
        {step === 1 && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-2">
              您患有哪些慢性病？
            </h2>
            <p className="text-sm text-[#9AA5A2] mb-6">可多选，帮助我们为您定制饮食建议</p>
            <div className="grid grid-cols-2 gap-3">
              {DISEASES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => toggleDisease(d.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    diseases.includes(d.id)
                      ? 'border-[#1A6B5C] bg-[#1A6B5C]/10'
                      : 'border-[#E5E0D9] bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2">{d.icon}</div>
                  <div
                    className={`text-sm font-medium ${
                      diseases.includes(d.id) ? 'text-[#1A6B5C]' : 'text-[#1A1F1C]'
                    }`}
                  >
                    {d.label}
                  </div>
                  {diseases.includes(d.id) && (
                    <div className="w-4 h-4 rounded-full bg-[#1A6B5C] flex items-center justify-center mt-2">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-2">
              您的关键指标
            </h2>
            <p className="text-sm text-[#9AA5A2] mb-6">选填，帮助更精准评估</p>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4">
                <label className="text-sm font-medium text-[#5A6360] mb-2 block">
                  空腹血糖 (mmol/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="例：5.6"
                  value={metrics.fastingBloodSugar}
                  onChange={(e) =>
                    setMetrics((prev) => ({ ...prev, fastingBloodSugar: e.target.value }))
                  }
                  className="w-full text-[#1A1F1C] text-lg outline-none placeholder:text-[#C8C3BC]"
                />
              </div>
              <div className="bg-white rounded-2xl p-4">
                <label className="text-sm font-medium text-[#5A6360] mb-2 block">
                  血压值 (mmHg)
                </label>
                <input
                  type="text"
                  placeholder="例：130/85"
                  value={metrics.bloodPressure}
                  onChange={(e) =>
                    setMetrics((prev) => ({ ...prev, bloodPressure: e.target.value }))
                  }
                  className="w-full text-[#1A1F1C] text-lg outline-none placeholder:text-[#C8C3BC]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-2">
              过敏或饮食禁忌
            </h2>
            <p className="text-sm text-[#9AA5A2] mb-6">点击选择，可多选</p>
            <div className="flex flex-wrap gap-3">
              {ALLERGIES.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAllergy(a)}
                  className={`px-5 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                    allergies.includes(a)
                      ? 'border-[#1A6B5C] bg-[#1A6B5C] text-white'
                      : 'border-[#E5E0D9] bg-white text-[#5A6360]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="mt-8 bg-[#1A6B5C]/10 rounded-2xl p-4">
              <p className="text-xs text-[#1A6B5C] font-medium">您的健康档案</p>
              <p className="text-sm text-[#5A6360] mt-1">
                病种：{diseases.length > 0 ? DISEASES.filter(d => diseases.includes(d.id)).map(d => d.label).join('、') : '未选择'}
              </p>
              {allergies.length > 0 && (
                <p className="text-sm text-[#5A6360]">禁忌：{allergies.join('、')}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div className="px-6 py-8">
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && diseases.length === 0}
            className="w-full py-4 rounded-2xl bg-[#1A6B5C] text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="w-full py-4 rounded-2xl bg-[#1A6B5C] text-white font-semibold text-base transition-all active:scale-[0.98]"
          >
            开始使用慢护
          </button>
        )}
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full py-3 mt-2 text-sm text-[#9AA5A2]"
          >
            返回上一步
          </button>
        )}
      </div>
    </div>
  );
}
