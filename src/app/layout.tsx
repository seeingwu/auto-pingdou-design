import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '拼豆设计图生成器',
  description: '上传图片自动生成拼豆（Perler/Hama/Artkal）方案，支持交互编辑、采购清单、多格式导出',
  keywords: '拼豆,珠子,Perler,Hama,Artkal,像素画,设计图,自动生成',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '拼豆设计',
  },
};

export const viewport = {
  themeColor: '#1e293b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
