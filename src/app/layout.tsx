import type { Metadata, Viewport } from 'next'
import './globals.css'
import BgmPlayer from '@/components/BgmPlayer'

export const metadata: Metadata = {
  title: '나 오늘 어디 뛰어?',
  description: '터치 몇 번으로 1~4쿼터 포메이션 뚝딱! 링크 하나로 팀원들에게 바로 공유하세요.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <BgmPlayer />
      </body>
    </html>
  )
}
