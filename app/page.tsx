'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadProfile } from '@/lib/storage';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const profile = loadProfile();
    if (profile) {
      router.replace('/dashboard');
    } else {
      router.replace('/onboarding');
    }
  }, [router]);

  return (
    <div className="app-container min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#E5E0D9] border-t-[#1A6B5C] animate-spin"
        />
        <p className="text-sm text-[#9AA5A2]">慢护启动中...</p>
      </div>
    </div>
  );
}
