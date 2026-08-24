# Launch100 v2 · Design Packs

Site100의 디자인을 고객이 고르고 사업 정보를 입력해 반응형 홈페이지 미리보기와 테스트 주문서를 만드는 정적 웹앱입니다.

## 공개 URL

- `https://beerandnacho.github.io/Launch100/?v=2`
- 템플릿 직접 열기: `?template=salt-bakery#builder`
- 공유 미리보기: 제작기 안의 **미리보기 공유 URL** 버튼

## v2 핵심 변경

v1의 공통 `Hero → 서비스 카드 → 연락처` 미리보기 구조를 제거했습니다. v2는 템플릿마다 독립 렌더러와 정보구조를 사용합니다.

| 템플릿 | 디자인 팩 | 고유 흐름 |
|---|---|---|
| 소금결 베이커리 | Editorial Bakery | 마스트헤드 → 오늘의 선반 → 제빵 이야기 → 방문 안내 |
| NOON BARBER | Brutalist Barber | 티커 → 포스터 히어로 → 가격 보드 → 스타일 스트립 → 예약 밴드 |
| TABLE 7 | Cinematic Dining | 다크 인트로 → 코스 챕터 → 셰프 노트 → 페어링 → 예약 |
| DAL 한옥스테이 | Quiet Hanok | 여백 히어로 → 객실 → 하루 일정 → 주변 산책 → 숙박 예약 |
| COMPILE | Learning Dashboard | 대시보드 → 지표 → 교육 트랙 → 커리큘럼 → 프로젝트 보드 |
| HARBOR | Institutional Law | 신뢰 문장 → 전문 분야 → 대응 절차 → 변호사 → 상담 |
| VOID | Architectural Index | 프로젝트 인덱스 → 작품 그리드 → 선언문 → 도면 과정 → 의뢰 |
| MINT | Friendly Clinic | 안심 히어로 → 진료 항목 → 진료 여정 → 의료진 → 예약 |
| ENDPOINT | Product Console | 터미널 히어로 → 지표 → 기능 벤토 → 코드 → 가격·상태 → FAQ |
| DESKTOP CV | Desktop Portfolio | OS 바 → 프로필 창 → 프로젝트 앱 → 기술 터미널 → 경력 → 연락 |

## 유지되는 제작 기능

- 10개 업종 디자인
- 5단계 제작 흐름
- 상호·소개·연락처·운영시간 편집
- 서비스 1–6개 편집
- 브랜드 색상·글꼴·이미지 분위기
- PC·태블릿·모바일 실시간 미리보기
- 브라우저 자동 저장
- 개인정보를 제외한 공유 URL
- Basic·Business·Pro 테스트 가격
- 주문 초안 복사·TXT·JSON 저장

## 구조

```text
assets/templates.js          사업·서비스 기본 데이터
assets/design-packs.js       10개 디자인 팩의 구조·타이포·특징
assets/preview-renderers.js  템플릿별 10개 전용 렌더러
assets/design-packs.css      갤러리·선택기 전용 썸네일 표현
assets/app.js                편집·미리보기·공유·주문 상태 관리
scripts/design-audit.mjs     10개 구조·HTML 고유성 검사
scripts/browser-audit.mjs    PC·태블릿·모바일과 기능 흐름 검사
```

## 검증

```bash
npm install
npx playwright install chromium
npm test
```

검사 범위:

- 렌더러 10개
- 고유 DOM 구조 10개
- 고유 렌더 결과 10개
- 1440×920, 768×1024, 390×844에서 30개 템플릿 검사
- 공유 미리보기 1개
- 편집 반영
- 모바일 미리보기 폭
- 개인정보 제외 공유
- 테스트 주문서 생성
- 가로 넘침·콘솔 오류

실제 결제, 회원 계정, 주문 서버 저장과 사용자 지정 도메인 자동 발행은 아직 연결하지 않았습니다.
