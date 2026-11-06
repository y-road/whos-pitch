import type { Metadata, Viewport } from 'next'
import './globals.css'
import BgmPlayer from '@/components/BgmPlayer'
import { SITE_URL } from '@/lib/site'

const TITLE = '나 오늘 어디 뛰어?'
const DESC = '터치 몇 번으로 1~4쿼터 포메이션 뚝딱! 링크 하나로 팀원들에게 바로 공유하세요.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESC,
  // 카카오톡·메신저 링크 미리보기
  openGraph: {
    type: 'website',
    siteName: TITLE,
    locale: 'ko_KR',
    title: TITLE,
    description: DESC,
    images: [{ url: '/og/home.png', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: ['/og/home.png'] },
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
