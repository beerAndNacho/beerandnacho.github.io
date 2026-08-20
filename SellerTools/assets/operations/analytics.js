import { n, money, number, percent, safeDivide, clamp, parsePipeRows, result } from './core.js';

export function runAnalytics(tool, values) {
  switch (tool.operation) {
    case 'dailyDashboard': {
      const netRevenue=n(values,'revenue')-n(values,'refunds');
      const profit=netRevenue-n(values,'cogs')-n(values,'fees')-n(values,'shippingPackaging')-n(values,'adSpend');
      return result({title:'일일 매출 요약',metrics:[['순매출',money(netRevenue)],['예상 순이익',money(profit)],['객단가',money(safeDivide(netRevenue,n(values,'orders')))],['방문→주문 전환율',percent(safeDivide(n(values,'orders'),n(values,'visitors'))*100)],['광고 ROAS',percent(safeDivide(netRevenue,n(values,'adSpend'))*100)],['취소·반품 매출 비율',percent(safeDivide(n(values,'refunds'),n(values,'revenue'))*100)]]});
    }
    case 'monthlyCompare': {
      const change=(current,previous)=>safeDivide(current-previous,previous)*100;
      return result({title:'월별 성과 비교',rows:[['매출',money(n(values,'currentRevenue')),percent(change(n(values,'currentRevenue'),n(values,'previousRevenue'))),percent(change(n(values,'currentRevenue'),n(values,'yearAgoRevenue')))],['주문',`${n(values,'currentOrders').toLocaleString('ko-KR')}건`,percent(change(n(values,'currentOrders'),n(values,'previousOrders'))),'-'],['순이익',money(n(values,'currentProfit')),percent(change(n(values,'currentProfit'),n(values,'previousProfit'))),'-'],['광고비',money(n(values,'currentAd')),percent(change(n(values,'currentAd'),n(values,'previousAd'))),'-']],text:'열 순서: 지표 | 이번 달 | 전월 대비 | 전년 동월 대비'});
    }
    case 'contributionProfit': {
      const rows=parsePipeRows(values.rows,7).map((row)=>{const nums=row.slice(1).map(Number);const profit=nums[0]-nums.slice(1).reduce((a,b)=>a+b,0);return[row[0],money(nums[0]),money(profit),percent(safeDivide(profit,nums[0])*100)];}).sort((a,b)=>Number(String(b[2]).replace(/[^\d-]/g,''))-Number(String(a[2]).replace(/[^\d-]/g,'')));
      return result({title:'상품별 기여이익',rows,text:'열 순서: 상품 | 매출 | 기여이익 | 기여이익률'});
    }
    case 'concentration': {
      const rows=parsePipeRows(values.rows,2).map((row)=>({name:row[0],sales:Number(row[1])})).sort((a,b)=>b.sales-a.sales);
      const total=rows.reduce((sum,row)=>sum+row.sales,0);
      const top20Count=Math.max(1,Math.ceil(rows.length*.2));
      return result({title:'매출 집중도',metrics:[['상위 1개 비중',percent(safeDivide(rows[0]?.sales,total)*100)],['상위 3개 비중',percent(safeDivide(rows.slice(0,3).reduce((s,r)=>s+r.sales,0),total)*100)],['상위 20% 상품 비중',percent(safeDivide(rows.slice(0,top20Count).reduce((s,r)=>s+r.sales,0),total)*100)],['전체 상품',`${rows.length}개`]],rows:rows.map((row)=>[row.name,money(row.sales),percent(safeDivide(row.sales,total)*100)])});
    }
    case 'abcClassification': {
      const rows=parsePipeRows(values.rows,2).map((row)=>({name:row[0],sales:Number(row[1])})).sort((a,b)=>b.sales-a.sales);
      const total=rows.reduce((sum,row)=>sum+row.sales,0);let cumulative=0;
      const output=rows.map((row)=>{cumulative+=row.sales;const share=safeDivide(cumulative,total)*100;const grade=share<=n(values,'aThreshold')?'A':share<=n(values,'bThreshold')?'B':'C';return[row.name,money(row.sales),percent(safeDivide(row.sales,total)*100),percent(share),grade];});
      return result({title:'ABC 상품 분류',rows:output,text:'열 순서: 상품 | 매출 | 개별 비중 | 누적 비중 | 등급'});
    }
    case 'channelPerformance': {
      const rows=parsePipeRows(values.rows,6).map((row)=>{const revenue=Number(row[1]),orders=Number(row[2]),fees=Number(row[3]),ad=Number(row[4]),returns=Number(row[5]);const contribution=revenue-fees-ad-returns;return[row[0],money(revenue),orders.toLocaleString('ko-KR'),money(contribution),percent(safeDivide(ad?revenue:0,ad)*100),percent(safeDivide(returns,revenue)*100),money(safeDivide(revenue,orders))];}).sort((a,b)=>Number(String(b[3]).replace(/[^\d-]/g,''))-Number(String(a[3]).replace(/[^\d-]/g,'')));
      return result({title:'채널별 성과',rows,text:'열 순서: 채널 | 매출 | 주문 | 수수료·광고·반품 차감 기여이익 | ROAS | 반품매출률 | 객단가'});
    }
    case 'targetSales': {
      const orders=Math.ceil(safeDivide(n(values,'targetRevenue'),n(values,'averageOrderValue')));
      const visitors=Math.ceil(safeDivide(orders,n(values,'siteConversionRate')/100));
      const adClicks=Math.ceil(visitors*n(values,'adClickShare')/100);
      const impressions=Math.ceil(safeDivide(adClicks,n(values,'ctr')/100));
      return result({title:'목표 매출 역산',metrics:[['필요 주문',`${orders.toLocaleString('ko-KR')}건`],['필요 방문',`${visitors.toLocaleString('ko-KR')}명`],['필요 광고 클릭',`${adClicks.toLocaleString('ko-KR')}회`],['필요 광고 노출',`${impressions.toLocaleString('ko-KR')}회`]]});
    }
    case 'cashFlow': {
      let balance=n(values,'openingCash');
      const rows=parsePipeRows(values.rows,6).map((row)=>{const income=Number(row[1]);const out=row.slice(2).map(Number).reduce((a,b)=>a+b,0);const net=income-out;balance+=net;return[row[0],money(income),money(out),money(net),money(balance),balance<0?'현금 부족':'정상'];});
      const minimum=Math.min(n(values,'openingCash'),...rows.map((row)=>Number(String(row[4]).replace(/[^\d-]/g,''))));
      return result({title:'현금흐름 예상',metrics:[['기초 현금',money(n(values,'openingCash'))],['기말 예상 잔액',money(balance)],['최저 예상 잔액',money(minimum)]],rows,text:'열 순서: 주차 | 입금 | 지출 | 순현금흐름 | 기말 잔액 | 상태'});
    }
    case 'sellerHealth': {
      const scores=[
        ['순마진',clamp(n(values,'netMarginRate')/25*100,0,100),n(values,'netMarginRate')>=15?'양호':'판매가·원가·수수료 재검토'],
        ['광고',clamp(n(values,'roas')/450*100,0,100),n(values,'roas')>=300?'양호':'캠페인별 기여이익 확인'],
        ['품절',clamp(100-n(values,'stockoutRate')*12,0,100),n(values,'stockoutRate')<=5?'양호':'핵심 SKU 재주문 시점 개선'],
        ['장기재고',clamp(100-n(values,'slowStockRate')*4,0,100),n(values,'slowStockRate')<=15?'양호':'저회전 SKU 정리'],
        ['반품',clamp(100-n(values,'returnRate')*10,0,100),n(values,'returnRate')<=5?'양호':'상품정보·포장·배송 원인 분석'],
        ['재구매',clamp(n(values,'repurchaseRate')/35*100,0,100),n(values,'repurchaseRate')>=20?'양호':'재구매 주기·메시지 개선'],
        ['현금',clamp(n(values,'cashRunwayMonths')/6*100,0,100),n(values,'cashRunwayMonths')>=3?'양호':'발주·광고·고정비 현금계획'],
        ['출고',clamp(100-n(values,'lateShippingRate')*15,0,100),n(values,'lateShippingRate')<=2?'양호':'마감시간·재고·피킹 흐름 개선']
      ];
      const total=scores.reduce((sum,row)=>sum+row[1],0)/scores.length;
      const sorted=[...scores].sort((a,b)=>a[1]-b[1]);
      return result({title:'셀러 사업 건강도',summary:`종합 ${number(total,1)}점. 가장 먼저 개선할 영역은 ${sorted[0][0]}입니다.`,metrics:[['종합 점수',`${number(total,1)} / 100`],['우선 개선 1',sorted[0][0]],['우선 개선 2',sorted[1][0]],['가장 안정적',sorted.at(-1)[0]]],rows:scores.map((row)=>[row[0],`${number(row[1],1)}점`,row[2]])});
    }
    default:
      return null;
  }
}
