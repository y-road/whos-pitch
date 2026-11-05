/** Supabase 연결 정보가 없을 때(처음 배포 직후) 보여주는 안내 화면 */
export default function SetupNotice() {
  return (
    <main className="onb">
      <h1>설정이 아직 끝나지 않았어요</h1>
      <p>
        서비스는 배포됐지만 Supabase 연결 정보가 없습니다.
        <br />
        Vercel 프로젝트 설정의 Environment Variables 에 아래 두 값을 넣고 다시 배포해 주세요.
      </p>
      <div className="card" style={{ textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
        <code>NEXT_PUBLIC_SUPABASE_URL</code>
        <br />
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
      </div>
    </main>
  )
}
