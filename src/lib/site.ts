/** 서비스 공통 정보. 약관·개인정보처리방침 페이지에서 쓴다. */
export const SERVICE_NAME = '나 오늘 어디 뛰어?'
export const SERVICE_NAME_EN = 'WhosPitch'
export const SITE_URL = 'https://www.whospitch.live'

/** 운영자 표기와 문의 이메일은 Vercel 환경변수로 넣는다 (소스에 개인정보를 남기지 않기 위해). */
export const OPERATOR_NAME = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || '서비스 운영자'
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || ''

/** 데이터가 저장되는 국가·지역. Supabase 프로젝트를 만들 때 고른 리전에 맞게 바꾸세요. */
export const DATA_REGION = process.env.NEXT_PUBLIC_DATA_REGION?.trim() || 'Supabase가 운영하는 해외 데이터센터'

/** 약관·방침 시행일 */
export const EFFECTIVE_DATE = '2026년 11월 5일'
