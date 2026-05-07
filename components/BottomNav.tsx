'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/dashboard',
    label: '首页',
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-[#1A6B5C]' : 'text-[#9AA5A2]'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/report',
    label: '报告',
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-[#1A6B5C]' : 'text-[#9AA5A2]'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Don't show on onboarding
  if (pathname === '/onboarding') return null;

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-0 bg-white border-t border-[#E5E0D9] flex items-center justify-around px-4 h-[65px]">
        {/* Home */}
        <Link href="/dashboard" className="flex flex-col items-center gap-1 py-1 flex-1">
          {navItems[0].icon(pathname === '/dashboard')}
          <span className={`text-[10px] font-medium ${pathname === '/dashboard' ? 'text-[#1A6B5C]' : 'text-[#9AA5A2]'}`}>
            首页
          </span>
        </Link>

        {/* FAB - Camera */}
        <Link
          href="/analyze"
          className="flex flex-col items-center -mt-6 flex-shrink-0"
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              pathname === '/analyze' ? 'bg-[#1A6B5C]' : 'bg-[#1A6B5C]'
            }`}
            style={{ boxShadow: '0 4px 20px rgba(26,107,92,0.4)' }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className={`text-[10px] font-medium mt-1 ${pathname === '/analyze' ? 'text-[#1A6B5C]' : 'text-[#9AA5A2]'}`}>
            拍照
          </span>
        </Link>

        {/* Report */}
        <Link href="/report" className="flex flex-col items-center gap-1 py-1 flex-1">
          {navItems[1].icon(pathname === '/report')}
          <span className={`text-[10px] font-medium ${pathname === '/report' ? 'text-[#1A6B5C]' : 'text-[#9AA5A2]'}`}>
            报告
          </span>
        </Link>
      </div>
    </div>
  );
}
