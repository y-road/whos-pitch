import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_EMAIL, DATA_REGION, EFFECTIVE_DATE, OPERATOR_NAME, SERVICE_NAME, SERVICE_NAME_EN } from '@/lib/site'

export const metadata: Metadata = {
  title: `개인정보처리방침 | ${SERVICE_NAME}`,
  description: `${SERVICE_NAME}(${SERVICE_NAME_EN})의 개인정보처리방침입니다.`,
}

export default function PrivacyPage() {
  const contact = CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : '서비스 운영자'

  return (
    <main className="legal">
      <h1>개인정보처리방침</h1>
      <p className="meta">시행일: {EFFECTIVE_DATE}</p>

      <p>
        {SERVICE_NAME}({SERVICE_NAME_EN}, 이하 &ldquo;서비스&rdquo;)는 조기축구 팀의 쿼터별 포메이션을 만들고 팀원에게 공유하는 웹 서비스입니다.
        {' '}{OPERATOR_NAME}(이하 &ldquo;운영자&rdquo;)는 「개인정보 보호법」 등 관련 법령을 지키며, 이용자의 개인정보를 아래와 같이 처리합니다.
      </p>

      <h2>1. 수집하는 개인정보 항목</h2>
      <table>
        <thead>
          <tr><th>구분</th><th>항목</th><th>수집 방법</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>구글 로그인 시</td>
            <td>이메일 주소, 이름, 프로필 사진 주소(구글 계정이 제공하는 범위). 서비스 화면에는 이메일만 표시합니다.</td>
            <td>구글 로그인(Google Identity Services)</td>
          </tr>
          <tr>
            <td>서비스 이용 중 입력</td>
            <td>팀 이름, 선수(팀원) 이름, 참석 여부, 쿼터별 포메이션·라인업, 선수 칩 색상</td>
            <td>이용자가 직접 입력</td>
          </tr>
          <tr>
            <td>자동 수집</td>
            <td>로그인 유지를 위한 세션 쿠키, 접속 기록(IP 주소, 접속 일시, 브라우저 정보) 등 호스팅·인증 서비스가 남기는 기술 정보</td>
            <td>서비스 이용 과정에서 자동 생성</td>
          </tr>
        </tbody>
      </table>
      <p>서비스는 주민등록번호, 전화번호, 결제 정보를 수집하지 않습니다.</p>

      <h2>2. 이용 목적</h2>
      <ul>
        <li>구글 계정으로 본인을 확인하고, 이용자별로 팀 데이터를 저장·불러오기</li>
        <li>입력한 명단과 라인업을 팀원에게 링크로 공유하는 기능 제공</li>
        <li>서비스 오류 확인, 부정 이용 방지, 문의 응대</li>
      </ul>

      <h2>3. 보유 및 이용 기간</h2>
      <p>
        이용자가 삭제를 요청하거나 서비스 이용을 종료할 때까지 보유하고, 이후 지체 없이 파기합니다.
        다만 관련 법령에 따라 보존해야 하는 정보가 있으면 그 기간 동안 보관합니다.
      </p>

      <h2>4. 공유 링크에 대한 안내</h2>
      <p>
        이용자가 만든 공유 링크를 아는 사람은 로그인 없이 팀 이름, 선수 이름, 참석자와 쿼터별 라인업을 볼 수 있습니다.
        이메일 주소는 공유 화면에 표시되지 않습니다. 링크가 외부에 퍼졌다면 서비스의 &ldquo;공유&rdquo; 화면에서 링크를 새로 만들어 기존 링크를 폐기할 수 있습니다.
      </p>
      <p>
        선수(팀원)의 이름을 입력하는 이용자는 해당 팀원에게 이름을 서비스에 입력하고 공유한다는 사실을 알리고 동의를 받을 책임이 있습니다.
      </p>

      <h2>5. 제3자 제공</h2>
      <p>운영자는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 법령에 근거한 수사기관의 적법한 요청이 있는 경우는 예외입니다.</p>

      <h2>6. 처리 위탁 및 국외 이전</h2>
      <p>서비스 운영을 위해 아래 사업자의 서비스를 이용하며, 이 과정에서 개인정보가 국외로 이전·보관될 수 있습니다.</p>
      <table>
        <thead>
          <tr><th>이전받는 자</th><th>이전 국가·위치</th><th>항목</th><th>목적</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase Inc.</td>
            <td>{DATA_REGION}</td>
            <td>로그인 정보(이메일·이름·프로필 사진 주소), 팀 데이터</td>
            <td>인증 및 데이터 저장</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>미국 등 Vercel이 운영하는 데이터센터</td>
            <td>접속 기록, 서비스 요청 정보</td>
            <td>웹 호스팅</td>
          </tr>
          <tr>
            <td>Google LLC</td>
            <td>미국 등 Google이 운영하는 데이터센터</td>
            <td>구글 계정 인증 정보</td>
            <td>구글 로그인</td>
          </tr>
        </tbody>
      </table>
      <p>이전 시점과 방법은 이용자가 서비스에 로그인하고 정보를 입력할 때 네트워크를 통한 전송입니다. 보유 기간은 위 3항과 같습니다.</p>

      <h2>7. 쿠키와 저장소</h2>
      <p>
        로그인 상태를 유지하기 위해 쿠키를 사용합니다. 첫 화면에서 입력한 팀 이름은 로그인이 끝날 때까지 브라우저 저장소(localStorage)에 임시로 보관했다가
        팀을 만든 뒤 지웁니다. 광고·분석 목적의 쿠키는 사용하지 않습니다. 브라우저 설정에서 쿠키를 막으면 로그인이 유지되지 않을 수 있습니다.
      </p>

      <h2>8. 이용자의 권리</h2>
      <ul>
        <li>이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요청할 수 있습니다. 팀 이름과 명단은 서비스 안에서 직접 수정할 수 있습니다.</li>
        <li>계정과 모든 데이터의 삭제는 {contact}로 요청해 주세요. 지체 없이 처리합니다.</li>
        <li>
          구글 계정과의 연결은 구글 계정 설정의 <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">앱 및 서비스 연결 관리</a>에서 언제든지 해제할 수 있습니다.
        </li>
      </ul>

      <h2>9. 안전성 확보 조치</h2>
      <ul>
        <li>모든 통신은 HTTPS로 암호화됩니다.</li>
        <li>데이터베이스의 행 수준 보안(RLS)으로 이용자는 자신의 팀 데이터에만 접근할 수 있습니다.</li>
        <li>구글 로그인 시 일회용 값(nonce)을 사용해 로그인 정보의 재사용을 막습니다.</li>
      </ul>

      <h2>10. 만 14세 미만 아동</h2>
      <p>서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 만 14세 미만 아동의 개인정보를 알면서 수집하지 않습니다.</p>

      <h2>11. Google 사용자 데이터</h2>
      <p>
        서비스는 구글 로그인을 위해 계정의 기본 정보(이메일, 이름, 프로필 사진)만 사용하며, 구글 캘린더·드라이브·Gmail 등 다른 구글 데이터에는 접근하지 않습니다.
        서비스의 구글 사용자 데이터 사용과 다른 앱으로의 전송은 Limited Use 요구사항을 포함해{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API 서비스 사용자 데이터 정책</a>을 준수합니다.
        이 정보는 광고에 사용하거나 판매하지 않습니다.
      </p>

      <h2>12. 개인정보 보호책임자 및 문의</h2>
      <p>
        운영자: {OPERATOR_NAME}
        <br />
        문의: {contact}
      </p>

      <h2>13. 방침의 변경</h2>
      <p>이 방침이 바뀌면 시행일과 함께 이 페이지에 알립니다. 중요한 변경은 시행 전에 서비스 화면으로 안내합니다.</p>

      <Link className="back" href="/">← 처음으로</Link>
    </main>
  )
}
