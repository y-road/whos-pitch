import type { MetadataRoute } from 'next'

/** 홈 화면에 앱처럼 설치할 때 쓰는 정보 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '나 오늘 어디 뛰어?',
    short_name: '어디 뛰어?',
    description: '터치 몇 번으로 1~4쿼터 포메이션 뚝딱! 링크 하나로 팀원들에게 바로 공유하세요.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: '#0e1511',
    theme_color: '#0e1511',
    lang: 'ko',
    icons: [
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    ],
  }
}
