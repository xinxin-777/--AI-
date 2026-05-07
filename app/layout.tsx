import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: '慢护 · AI 慢病饮食管家',
  description: '专为慢性病患者设计的 AI 饮食风险评估与管理工具',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-[#F4F1EC]">
        <div className="relative min-h-full">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
