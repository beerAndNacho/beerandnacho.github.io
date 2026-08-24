# Launch100 v2 · Design Pack Specification

## 목표

10개 템플릿을 공통 와이어프레임의 색상 변형이 아니라 서로 다른 브랜드 경험으로 만듭니다. 각 팩은 고유한 Hero 구조, 섹션 순서, 카드 체계, 타이포그래피와 전환 행동을 갖습니다.

| ID | 디자인 팩 | DOM 구조 시그니처 |
|---|---|---|
| salt-bakery | Editorial Bakery | masthead · daily shelf · maker story · visit note |
| noon-barber | Brutalist Barber | ticker · poster hero · price board · style strip · booking band |
| table7-restaurant | Cinematic Dining | dark intro · course chapters · chef note · pairing · reservation |
| dal-hanok-stay | Quiet Hanok | quiet hero · rooms · day itinerary · neighborhood · booking |
| compile-bootcamp | Learning Dashboard | dashboard shell · metrics · tracks · curriculum · project board |
| harbor-law | Institutional Law | trust statement · practice matrix · response process · counsel · consultation |
| void-architecture | Architectural Index | project index · masonry · manifesto · blueprint process · inquiry |
| mint-clinic | Friendly Clinic | care hero · treatments · care journey · doctor assurance · appointment |
| endpoint-api | Product Console | terminal hero · live metrics · feature bento · code · pricing/status · FAQ |
| desktop-cv | Desktop Portfolio | OS bar · profile window · project apps · skills terminal · career · contact command |

## 공통으로 공유하는 것

- 사업 정보와 서비스 데이터 모델
- 5단계 편집 흐름
- 색상·글꼴 커스터마이징
- PC·태블릿·모바일 미리보기
- 로컬 저장
- 개인정보 제외 공유 URL
- 테스트 주문서
- 접근성과 반응형 최소 규칙

## 템플릿마다 분리한 것

- Hero DOM
- 내비게이션 표현
- 섹션 순서
- 서비스 표현 방식
- 시각 오브젝트
- 카드 형태
- 타이포그래피 기본값
- CTA 위치
- 모바일 재배치 규칙

## 검사 기준

`npm test`는 다음을 확인합니다.

1. 렌더러 10개와 팩 10개가 모두 존재합니다.
2. 구조 시그니처와 최종 HTML 해시가 10개 모두 다릅니다.
3. 각 팩의 필수 컴포넌트가 렌더링됩니다.
4. 1440×920, 768×1024, 390×844에서 모든 템플릿을 엽니다.
5. iframe 내부 가로 넘침과 콘솔 오류가 없어야 합니다.
6. 편집 반영, 모바일 폭, 개인정보 제외 공유, 주문서와 공유 미리보기가 동작해야 합니다.
