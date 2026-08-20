export const tools01 = [
  {
    "id": 1,
    "slug": "net-profit-calculator",
    "title": "판매 순이익 계산기",
    "category": "가격·마진",
    "description": "판매가에서 원가·수수료·배송·포장·광고비를 제외한 주문당 순이익을 계산합니다.",
    "mode": "calculator",
    "operation": "netProfit",
    "fields": [
      {"key":"salePrice","label":"판매가","type":"number","sample":39000,"min":0,"step":"any","suffix":"원"},
      {"key":"cost","label":"상품 원가","type":"number","sample":14500,"min":0,"step":"any","suffix":"원"},
      {"key":"platformFeeRate","label":"판매 수수료율","type":"number","sample":8,"min":0,"step":"any","suffix":"%"},
      {"key":"paymentFeeRate","label":"결제 수수료율","type":"number","sample":2.5,"min":0,"step":"any","suffix":"%"},
      {"key":"shippingCost","label":"판매자 부담 배송비","type":"number","sample":3000,"min":0,"step":"any","suffix":"원"},
      {"key":"packagingCost","label":"포장 원가","type":"number","sample":700,"min":0,"step":"any","suffix":"원"},
      {"key":"adCost","label":"주문당 광고비","type":"number","sample":2500,"min":0,"step":"any","suffix":"원"}
    ],
    "notice": "판매 채널·카테고리·결제수단에 따라 요율이 달라질 수 있습니다. 실제 적용 요율을 직접 입력해 계산하세요.",
    "tags": ["순이익","마진","수수료"]
  },
  {
    "id": 2,
    "slug": "target-margin-price",
    "title": "목표 마진 판매가 계산기",
    "category": "가격·마진",
    "description": "원가와 판매비용을 입력하면 목표 마진율을 달성하는 최소 판매가를 역산합니다.",
    "mode": "calculator",
    "operation": "targetMarginPrice",
    "fields": [
      {"key":"cost","label":"상품 원가","type":"number","sample":14500,"min":0,"step":"any","suffix":"원"},
      {"key":"fixedCost","label":"주문당 고정비용","type":"number","sample":3700,"min":0,"step":"any","suffix":"원"},
      {"key":"feeRate","label":"판매·결제 수수료율 합계","type":"number","sample":10.5,"min":0,"step":"any","suffix":"%"},
      {"key":"targetMarginRate","label":"목표 순마진율","type":"number","sample":25,"min":0,"step":"any","suffix":"%"}
    ],
    "notice": "판매 채널·카테고리·결제수단에 따라 요율이 달라질 수 있습니다. 실제 적용 요율을 직접 입력해 계산하세요.",
    "tags": ["판매가","목표마진"]
  },
  {
    "id": 3,
    "slug": "marketplace-fee-calculator",
    "title": "오픈마켓 수수료 계산기",
    "category": "가격·마진",
    "description": "판매가와 직접 입력한 수수료율을 기준으로 공제액과 예상 정산액을 계산합니다.",
    "mode": "calculator",
    "operation": "marketplaceFee",
    "fields": [
      {"key":"marketName","label":"판매 채널명","type":"text","sample":"판매 채널 A","placeholder":"판매 채널 A"},
      {"key":"salePrice","label":"판매가","type":"number","sample":39000,"min":0,"step":"any","suffix":"원"},
      {"key":"salesFeeRate","label":"판매 수수료율","type":"number","sample":8,"min":0,"step":"any","suffix":"%"},
      {"key":"paymentFeeRate","label":"결제 수수료율","type":"number","sample":2.5,"min":0,"step":"any","suffix":"%"},
      {"key":"extraFee","label":"기타 건당 비용","type":"number","sample":0,"min":0,"step":"any","suffix":"원"}
    ],
    "notice": "판매 채널·카테고리·결제수단에 따라 요율이 달라질 수 있습니다. 실제 적용 요율을 직접 입력해 계산하세요.",
    "tags": ["마켓","정산"]
  },
  {
    "id": 4,
    "slug": "channel-profit-compare",
    "title": "마켓별 순이익 비교기",
    "category": "가격·마진",
    "description": "세 판매 채널의 수수료·광고비·배송 부담을 같은 조건에서 비교합니다.",
    "mode": "calculator",
    "operation": "channelCompare",
    "fields": [
      {"key":"salePrice","label":"판매가","type":"number","sample":39000,"min":0,"step":"any","suffix":"원"},
      {"key":"cost","label":"상품 원가","type":"number","sample":14500,"min":0,"step":"any","suffix":"원"},
      {"key":"packagingCost","label":"공통 포장비","type":"number","sample":700,"min":0,"step":"any","suffix":"원"},
      {"key":"channelA","label":"채널 A","type":"text","sample":"채널 A","placeholder":"채널 A"},
      {"key":"feeA","label":"A 수수료율","type":"number","sample":6,"min":0,"step":"any","suffix":"%"},
      {"key":"adA","label":"A 주문당 광고비","type":"number","sample":1800,"min":0,"step":"any","suffix":"원"},
      {"key":"shippingA","label":"A 판매자 배송부담","type":"number","sample":3000,"min":0,"step":"any","suffix":"원"},
      {"key":"channelB","label":"채널 B","type":"text","sample":"채널 B","placeholder":"채널 B"},
      {"key":"feeB","label":"B 수수료율","type":"number","sample":10,"min":0,"step":"any","suffix":"%"},
      {"key":"adB","label":"B 주문당 광고비","type":"number","sample":1200,"min":0,"step":"any","suffix":"원"},
      {"key":"shippingB","label":"B 판매자 배송부담","type":"number","sample":2500,"min":0,"step":"any","suffix":"원"},
      {"key":"channelC","label":"채널 C","type":"text","sample":"채널 C","placeholder":"채널 C"},
      {"key":"feeC","label":"C 수수료율","type":"number","sample":13,"min":0,"step":"any","suffix":"%"},
      {"key":"adC","label":"C 주문당 광고비","type":"number","sample":800,"min":0,"step":"any","suffix":"원"},
      {"key":"shippingC","label":"C 판매자 배송부담","type":"number","sample":0,"min":0,"step":"any","suffix":"원"}
    ],
    "notice": "판매 채널·카테고리·결제수단에 따라 요율이 달라질 수 있습니다. 실제 적용 요율을 직접 입력해 계산하세요.",
    "tags": ["채널비교","순이익"]
  },
  {
    "id": 5,
    "slug": "discount-margin-calculator",
    "title": "할인 후 마진 계산기",
    "category": "가격·마진",
    "description": "정가와 할인율을 적용한 실제 판매가·순이익·마진율을 계산합니다.",
    "mode": "calculator",
    "operation": "discountMargin",
    "fields": [
      {"key":"listPrice","label":"정가","type":"number","sample":49000,"min":0,"step":"any","suffix":"원"},
      {"key":"discountRate","label":"할인율","type":"number","sample":20,"min":0,"step":"any","suffix":"%"},
      {"key":"cost","label":"상품 원가","type":"number","sample":14500,"min":0,"step":"any","suffix":"원"},
      {"key":"feeRate","label":"수수료율","type":"number","sample":10.5,"min":0,"step":"any","suffix":"%"},
      {"key":"fixedCost","label":"배송·포장·광고 고정비","type":"number","sample":5200,"min":0,"step":"any","suffix":"원"}
    ],
    "notice": "판매 채널·카테고리·결제수단에 따라 요율이 달라질 수 있습니다. 실제 적용 요율을 직접 입력해 계산하세요.",
    "tags": ["할인","마진"]
  },
  {
    "id": 6,
    "slug": "coupon-share-calculator",
    "title": "쿠폰 분담금 계산기",
    "category": "가격·마진",
    "description": "쿠폰 할인액 중 판매자 부담분과 쿠폰 적용 후 순이익을 계산합니다.",
    "mode": "calculator",
    "operation": "couponShare",
    "fields": [
      {"key":"salePrice","label":"쿠폰 적용 전 판매가","type":"number","sample":39000,"min":0,"step":"any","suffix":"원"},
      {"key":"couponRate","label":"쿠폰 할인율","type":"number","sample":10,"min":0,"step":"any","suffix":"%"},
      {"key":"sellerShareRate","label":"판매자 분담 비율","type":"number","sample":50,"min":0,"step":"any","suffix":"%"},
      {"key":"cost","label":"상품 원가","type":"number","sample":14500,"min":0,"step":"any","suffix":"원"},
      {"key":"feeRate","label":"수수료율","type":"number","sample":10.5,"min":0,"step":"any","suffix":"%"},
      {"key":"fixedCost","label":"기타 주문비용","type":"number","sample":3700,"min":0,"step":"any","suffix":"원"}
    ],
    "notice": "판매 채널·카테고리·결제수단에 따라 요율이 달라질 수 있습니다. 실제 적용 요율을 직접 입력해 계산하세요.",
    "tags": ["쿠폰","분담금"]
  },
  {
    "id": 7,
    "slug": "free-shipping-break-even",
    "title": "무료배송 손익 계산기",
    "category": "가격·마진",
    "description": "무료배송을 제공하면서 목표 마진을 지키기 위한 최소 판매가를 계산합니다.",
    "mode": "calculator",
    "operation": "freeShippingPrice",
    "fields": [
      {"key":"cost","label":"상품 원가","type":"number","sample":14500,"min":0,"step":"any","suffix":"원"},
      {"key":"shippingCost","label":"판매자 배송비","type":"number","sample":3500,"min":0,"step":"any","suffix":"원"},
      {"key":"packagingCost","label":"포장비","type":"number","sample":700,"min":0,"step":"any","suffix":"원"},
      {"key":"feeRate","label":"수수료율","type":"number","sample":10.5,"min":0,"step":"any","suffix":"%"},
      {"key":"targetMarginRate","label":"목표 순마진율","type":"number","sample":20,"min":0,"step":"any","suffix":"%"}
    ],
    "notice": "판매 채널·카테고리·결제수단에 따라 요율이 달라질 수 있습니다. 실제 적용 요율을 직접 입력해 계산하세요.",
    "tags": ["무료배송","손익"]
  },
  {
    "id": 8,
    "slug": "bundle-price-calculator",
    "title": "묶음상품 가격 계산기",
    "category": "가격·마진",
    "description": "단품 수량·묶음 할인·추가 포장비를 반영해 세트 가격과 순이익을 계산합니다.",
    "mode": "calculator",
    "operation": "bundlePrice",
    "fields": [
      {"key":"unitPrice","label":"단품 판매가","type":"number","sample":19000,"min":0,"step":"any","suffix":"원"},
      {"key":"unitCost","label":"단품 원가","type":"number","sample":7500,"min":0,"step":"any","suffix":"원"},
      {"key":"quantity","label":"묶음 수량","type":"number","sample":3,"min":1,"step":1,"suffix":"개"},
      {"key":"bundleDiscountRate","label":"묶음 할인율","type":"number","sample":12,"min":0,"step":"any","suffix":"%"},
      {"key":"feeRate","label":"수수료율","type":"number","sample":10.5,"min":0,"step":"any","suffix":"%"},
      {"key":"shippingCost","label":"묶음 배송비","type":"number","sample":3500,"min":0,"step":"any","suffix":"원"},
      {"key":"packagingCost","label":"묶음 포장비","type":"number","sample":1000,"min":0,"step":"any","suffix":"원"}
    ],
    "notice": "판매 채널·카테고리·결제수단에 따라 요율이 달라질 수 있습니다. 실제 적용 요율을 직접 입력해 계산하세요.",
    "tags": ["세트","묶음"]
  },
  {
    "id": 9,
    "slug": "option-surcharge-calculator",
    "title": "옵션 추가금 계산기",
    "category": "가격·마진",
    "description": "기본 옵션과 상위 옵션의 원가 차이를 목표 마진 기준 추가금으로 환산합니다.",
    "mode": "calculator",
    "operation": "optionSurcharge",
    "fields": [
      {"key":"baseCost","label":"기본 옵션 원가","type":"number","sample":10000,"min":0,"step":"any","suffix":"원"},
      {"key":"optionCost","label":"상위 옵션 원가","type":"number","sample":14500,"min":0,"step":"any","suffix":"원"},
      {"key":"feeRate","label":"수수료율","type":"number","sample":10.5,"min":0,"step":"any","suffix":"%"},
      {"key":"targetMarginRate","label":"목표 마진율","type":"number","sample":25,"min":0,"step":"any","suffix":"%"},
      {"key":"roundUnit","label":"추가금 반올림 단위","type":"number","sample":100,"min":1,"step":1,"suffix":"원"}
    ],
    "notice": "판매 채널·카테고리·결제수단에 따라 요율이 달라질 수 있습니다. 실제 적용 요율을 직접 입력해 계산하세요.",
    "tags": ["옵션","추가금"]
  },
  {
    "id": 10,
    "slug": "vat-split-calculator",
    "title": "부가세 포함·제외 계산기",
    "category": "가격·마진",
    "description": "부가세 포함 금액에서 공급가액과 세액을 분리하거나 공급가액에서 합계를 계산합니다.",
    "mode": "calculator",
    "operation": "vatSplit",
    "fields": [
      {"key":"direction","label":"계산 방향","type":"select","options":[{"label":"부가세 포함 금액 → 공급가액·세액","value":"inclusive"},{"label":"공급가액 → 부가세 포함 합계","value":"exclusive"}],"sample":"inclusive"},
      {"key":"amount","label":"기준 금액","type":"number","sample":110000,"min":0,"step":"any","suffix":"원"},
      {"key":"vatRate","label":"부가세율","type":"number","sample":10,"min":0,"step":"any","suffix":"%"}
    ],
    "tags": ["부가세","공급가액"]
  }
];
