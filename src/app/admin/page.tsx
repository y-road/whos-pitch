import type { Metadata } from 'next'
import AdminFunnel from '@/components/AdminFunnel'

export const metadata: Metadata = { title: '이탈 현황', robots: { index: false, follow: false } }

export default function AdminPage() {
  return <AdminFunnel />
}
