const DESIGN_PACKS = {
  'salt-bakery': {
    id: 'salt-bakery',
    label: 'Editorial Bakery',
    KoreanLabel: '에디토리얼 베이커리',
    defaultFont: 'serif',
    thumb: 'paper-stack',
    signature: 'masthead|daily-shelf|maker-story|visit-note',
    sections: ['오늘의 빵', '시그니처 선반', '제빵 이야기', '방문 안내'],
    traits: ['종이 편집면', '세리프 타이틀', '제품 선반', '따뜻한 비정형 카드']
  },
  'noon-barber': {
    id: 'noon-barber',
    label: 'Brutalist Barber',
    KoreanLabel: '브루탈리스트 바버숍',
    defaultFont: 'sans',
    thumb: 'poster-cut',
    signature: 'ticker|poster-hero|price-board|style-strip|booking-band',
    sections: ['가격 보드', '스타일 스트립', '예약 시간', '매장 위치'],
    traits: ['두꺼운 보더', '압축 타이포', '대각선 포스터', '강한 예약 CTA']
  },
  'table7-restaurant': {
    id: 'table7-restaurant',
    label: 'Cinematic Dining',
    KoreanLabel: '시네마틱 파인다이닝',
    defaultFont: 'serif',
    thumb: 'dining-arch',
    signature: 'dark-intro|course-chapters|chef-note|pairing|reservation',
    sections: ['시즌 코스', '셰프 노트', '와인 페어링', '예약'],
    traits: ['다크 시네마', '아치형 플레이트', '코스 챕터', '넓은 고급 여백']
  },
  'dal-hanok-stay': {
    id: 'dal-hanok-stay',
    label: 'Quiet Hanok',
    KoreanLabel: '여백 중심 한옥스테이',
    defaultFont: 'serif',
    thumb: 'hanok-courtyard',
    signature: 'quiet-hero|room-courtyard|day-itinerary|neighborhood|stay-booking',
    sections: ['객실', '하루의 흐름', '주변 산책', '예약 정보'],
    traits: ['한지 여백', '중정 프레임', '느린 수평 리듬', '여행 일정']
  },
  'compile-bootcamp': {
    id: 'compile-bootcamp',
    label: 'Learning Dashboard',
    KoreanLabel: '교육 대시보드',
    defaultFont: 'mono',
    thumb: 'dashboard-grid',
    signature: 'dashboard-shell|metrics|learning-tracks|curriculum|project-board|consultation',
    sections: ['성과 지표', '교육 트랙', '커리큘럼', '프로젝트 보드'],
    traits: ['대시보드', '코드 그리드', '단계형 로드맵', '학습 성과']
  },
  'harbor-law': {
    id: 'harbor-law',
    label: 'Institutional Law',
    KoreanLabel: '신뢰형 법률 코퍼레이트',
    defaultFont: 'serif',
    thumb: 'legal-dossier',
    signature: 'institutional-header|trust-statement|practice-matrix|response-process|counsel|consultation',
    sections: ['전문 분야', '대응 절차', '담당 변호사', '상담 접수'],
    traits: ['문서 질서', '절제된 네이비', '전문 분야 매트릭스', '절차 중심']
  },
  'void-architecture': {
    id: 'void-architecture',
    label: 'Architectural Index',
    KoreanLabel: '미니멀 건축 포트폴리오',
    defaultFont: 'sans',
    thumb: 'blueprint-index',
    signature: 'index-header|project-masonry|manifesto|blueprint-process|coordinates|inquiry',
    sections: ['선정 프로젝트', '설계 철학', '도면 프로세스', '프로젝트 의뢰'],
    traits: ['흑백 인덱스', '도면 좌표', '프로젝트 우선', '과감한 여백']
  },
  'mint-clinic': {
    id: 'mint-clinic',
    label: 'Friendly Clinic',
    KoreanLabel: '친절한 의료 안내',
    defaultFont: 'rounded',
    thumb: 'care-orbit',
    signature: 'friendly-header|care-hero|treatments|care-journey|doctor-assurance|appointment',
    sections: ['진료 항목', '진료 여정', '의료진과 안심 기준', '예약'],
    traits: ['라운드 카드', '밝은 민트', '설명 중심', '안심 프로세스']
  },
  'endpoint-api': {
    id: 'endpoint-api',
    label: 'Product Console',
    KoreanLabel: '제품 중심 API SaaS',
    defaultFont: 'mono',
    thumb: 'console-bento',
    signature: 'product-nav|terminal-hero|live-metrics|feature-bento|code-example|pricing-status|faq',
    sections: ['실시간 지표', '기능 벤토', '코드 예제', '가격과 상태'],
    traits: ['터미널 히어로', '데이터 지표', '기능 벤토', '개발자 코드']
  },
  'desktop-cv': {
    id: 'desktop-cv',
    label: 'Desktop Portfolio',
    KoreanLabel: '데스크톱 UI 포트폴리오',
    defaultFont: 'mono',
    thumb: 'desktop-windows',
    signature: 'os-bar|profile-window|project-windows|skills-terminal|career-timeline|contact-command',
    sections: ['프로필 윈도', '프로젝트 앱', '기술 터미널', '경력 타임라인'],
    traits: ['운영체제 UI', '겹친 창', '커맨드 인터페이스', '개인 브랜드']
  }
};

const PACK_IDS = Object.freeze(Object.keys(DESIGN_PACKS));

function designPackFor(templateId) {
  return DESIGN_PACKS[templateId] || DESIGN_PACKS['salt-bakery'];
}

export { DESIGN_PACKS, PACK_IDS, designPackFor };
