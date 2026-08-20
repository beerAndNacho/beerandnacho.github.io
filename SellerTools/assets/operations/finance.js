import { n, s, money, number, percent, safeDivide, roundUp, result, contribution, channelRow } from './core.js';

export function runFinance(tool, values) {
  switch (tool.operation) {
    case 'netProfit': {
      const salePrice = n(values, 'salePrice');
      const totalFeeRate = n(values, 'platformFeeRate') + n(values, 'paymentFeeRate');
      const fixed = n(values, 'shippingCost') + n(values, 'packagingCost') + n(values, 'adCost');
      const c = contribution(salePrice, n(values, 'cost'), totalFeeRate, fixed);
      return result({
        title: '주문당 순이익',
        summary: c.profit >= 0 ? '현재 입력 조건에서는 주문이 발생할 때 이익이 남습니다.' : '현재 입력 조건에서는 주문당 손실이 발생합니다.',
        metrics: [['순이익', money(c.profit)], ['순마진율', percent(c.marginRate)], ['총 수수료', money(c.fee)], ['총 변동비', money(n(values,'cost') + fixed + c.fee)]],
        rows: [['판매가', money(salePrice)], ['상품 원가', money(n(values,'cost'))], ['판매·결제 수수료', money(c.fee)], ['배송·포장·광고비', money(fixed)], ['최종 순이익', money(c.profit)]]
      });
    }
    case 'targetMarginPrice': {
      const denominator = 1 - n(values,'feeRate') / 100 - n(values,'targetMarginRate') / 100;
      const price = denominator <= 0 ? 0 : (n(values,'cost') + n(values,'fixedCost')) / denominator;
      return result({ title:'목표 마진 판매가', summary:'수수료와 목표 순마진을 동시에 반영한 최소 판매가입니다.', metrics:[['최소 판매가',money(Math.ceil(price))],['권장 100원 단위',money(roundUp(price,100))],['목표 순마진율',percent(n(values,'targetMarginRate'))]], warning: denominator <= 0 ? '수수료율과 목표 마진율 합계가 100% 이상이라 계산할 수 없습니다.' : '' });
    }
    case 'marketplaceFee': {
      const salePrice=n(values,'salePrice');
      const salesFee=salePrice*n(values,'salesFeeRate')/100;
      const paymentFee=salePrice*n(values,'paymentFeeRate')/100;
      const total=salesFee+paymentFee+n(values,'extraFee');
      return result({title:`${s(values,'marketName') || '판매 채널'} 예상 정산`,metrics:[['총 공제액',money(total)],['예상 정산액',money(salePrice-total)],['실효 공제율',percent(safeDivide(total,salePrice)*100)]],rows:[['판매 수수료',money(salesFee)],['결제 수수료',money(paymentFee)],['기타 비용',money(n(values,'extraFee'))]]});
    }
    case 'channelCompare': {
      const sale=n(values,'salePrice'), cost=n(values,'cost'), pack=n(values,'packagingCost');
      const channels=[
        channelRow(s(values,'channelA'),sale,cost,pack,n(values,'feeA'),n(values,'adA'),n(values,'shippingA')),
        channelRow(s(values,'channelB'),sale,cost,pack,n(values,'feeB'),n(values,'adB'),n(values,'shippingB')),
        channelRow(s(values,'channelC'),sale,cost,pack,n(values,'feeC'),n(values,'adC'),n(values,'shippingC'))
      ].sort((a,b)=>b.profit-a.profit);
      return result({title:'채널별 순이익 비교',summary:`현재 입력 조건에서는 ${channels[0].name || '상위 채널'}의 주문당 순이익이 가장 높습니다.`,metrics:[['최고 순이익',money(channels[0].profit)],['최저 순이익',money(channels.at(-1).profit)],['격차',money(channels[0].profit-channels.at(-1).profit)]],rows:channels.map(c=>[c.name||'채널',money(c.fee),money(c.ad),money(c.shipping),money(c.profit),percent(c.marginRate)]),text:'열 순서: 채널 | 수수료 | 주문당 광고비 | 배송부담 | 순이익 | 순마진율'});
    }
    case 'discountMargin': {
      const sale=n(values,'listPrice')*(1-n(values,'discountRate')/100);
      const c=contribution(sale,n(values,'cost'),n(values,'feeRate'),n(values,'fixedCost'));
      return result({title:'할인 후 손익',metrics:[['할인 판매가',money(sale)],['주문당 순이익',money(c.profit)],['순마진율',percent(c.marginRate)],['할인액',money(n(values,'listPrice')-sale)]]});
    }
    case 'couponShare': {
      const sale=n(values,'salePrice'), coupon=sale*n(values,'couponRate')/100, sellerShare=coupon*n(values,'sellerShareRate')/100;
      const customerPay=sale-coupon;
      const fee=customerPay*n(values,'feeRate')/100;
      const profit=sale-sellerShare-n(values,'cost')-fee-n(values,'fixedCost');
      return result({title:'쿠폰 분담 후 순이익',metrics:[['고객 결제금액',money(customerPay)],['총 쿠폰 할인액',money(coupon)],['판매자 분담금',money(sellerShare)],['예상 순이익',money(profit)]]});
    }
    case 'freeShippingPrice': {
      const denominator=1-n(values,'feeRate')/100-n(values,'targetMarginRate')/100;
      const price=denominator<=0?0:(n(values,'cost')+n(values,'shippingCost')+n(values,'packagingCost'))/denominator;
      return result({title:'무료배송 최소 판매가',metrics:[['최소 판매가',money(Math.ceil(price))],['권장 100원 단위',money(roundUp(price,100))],['배송·포장 원가',money(n(values,'shippingCost')+n(values,'packagingCost'))]],warning:denominator<=0?'수수료율과 목표 마진율 합계가 100% 이상입니다.':''});
    }
    case 'bundlePrice': {
      const gross=n(values,'unitPrice')*n(values,'quantity');
      const bundle=gross*(1-n(values,'bundleDiscountRate')/100);
      const totalCost=n(values,'unitCost')*n(values,'quantity');
      const fee=bundle*n(values,'feeRate')/100;
      const profit=bundle-totalCost-fee-n(values,'shippingCost')-n(values,'packagingCost');
      return result({title:'묶음상품 손익',metrics:[['묶음 판매가',money(bundle)],['고객 할인액',money(gross-bundle)],['주문당 순이익',money(profit)],['순마진율',percent(safeDivide(profit,bundle)*100)],['개당 실판매가',money(safeDivide(bundle,n(values,'quantity')))]]});
    }
    case 'optionSurcharge': {
      const costGap=n(values,'optionCost')-n(values,'baseCost');
      const denominator=1-n(values,'feeRate')/100-n(values,'targetMarginRate')/100;
      const surcharge=denominator<=0?0:costGap/denominator;
      return result({title:'옵션 추가금',metrics:[['원가 차이',money(costGap)],['최소 추가금',money(Math.ceil(surcharge))],['권장 추가금',money(roundUp(surcharge,n(values,'roundUnit')))]],warning:denominator<=0?'수수료율과 목표 마진율 합계가 100% 이상입니다.':''});
    }
    case 'vatSplit': {
      const rate=n(values,'vatRate')/100, amount=n(values,'amount');
      const supply=s(values,'direction')==='inclusive'?amount/(1+rate):amount;
      const vat=supply*rate;
      return result({title:'부가세 계산 결과',metrics:[['공급가액',money(supply)],['부가세',money(vat)],['합계',money(supply+vat)]]});
    }
    case 'breakEvenRoas': {
      const sale=n(values,'salePrice');
      const fee=sale*n(values,'feeRate')/100;
      const adBefore=sale-n(values,'cost')-fee;
      const roas=adBefore<=0?0:sale/adBefore*100;
      return result({title:'손익분기 ROAS',summary:'광고비가 주문당 기여이익을 초과하면 적자가 발생합니다.',metrics:[['광고 전 주문당 기여이익',money(adBefore)],['손익분기 ROAS',percent(roas)],['허용 주문당 광고비',money(Math.max(0,adBefore))]],warning:adBefore<=0?'광고비를 쓰기 전부터 주문당 이익이 남지 않습니다. 원가·수수료·판매가를 먼저 조정하세요.':''});
    }
    case 'targetRoasBudget': {
      const budget=n(values,'targetRevenue')/Math.max(0.01,n(values,'targetRoas')/100);
      return result({title:'목표 ROAS 광고비',metrics:[['최대 광고비',money(budget)],['목표 매출',money(n(values,'targetRevenue'))],['목표 ROAS',percent(n(values,'targetRoas'))]]});
    }
    case 'adCpa': {
      const spend=n(values,'adSpend'), clicks=n(values,'clicks'), orders=n(values,'orders');
      return result({title:'광고 효율',metrics:[['CPC',money(safeDivide(spend,clicks))],['주문당 광고비 CPA',money(safeDivide(spend,orders))],['클릭→주문 전환율',percent(safeDivide(orders,clicks)*100)],['주문 100건 예상 광고비',money(safeDivide(spend,orders)*100)]]});
    }
    case 'clickProfit': {
      const expectedContribution=n(values,'contributionPerOrder')*n(values,'conversionRate')/100;
      const expectedProfit=expectedContribution-n(values,'cpc');
      return result({title:'클릭당 기대 손익',metrics:[['클릭당 기대 기여이익',money(expectedContribution)],['현재 CPC',money(n(values,'cpc'))],['클릭당 기대 순이익',money(expectedProfit)],['손익분기 CPC',money(expectedContribution)]],summary:expectedProfit>=0?'현재 CPC가 손익분기 기준 아래입니다.':'현재 CPC가 손익분기 기준을 초과합니다.'});
    }
    case 'promoCompare': {
      const list=n(values,'listPrice'), cost=n(values,'cost'), feeRate=n(values,'feeRate');
      const strategies=[
        ['정가',list,n(values,'baseShipping')],
        ['할인',list*(1-n(values,'discountRate')/100),n(values,'baseShipping')],
        ['쿠폰',list-list*n(values,'couponRate')/100*n(values,'couponSellerShare')/100,n(values,'baseShipping')],
        ['무료배송',list,n(values,'freeShippingCost')]
      ].map(([name,revenue,ship])=>{const c=contribution(revenue,cost,feeRate,ship);return{name,revenue,profit:c.profit,margin:c.marginRate};}).sort((a,b)=>b.profit-a.profit);
      return result({title:'프로모션 손익 비교',summary:`주문당 순이익 기준 1위는 ${strategies[0].name} 전략입니다.`,rows:strategies.map(x=>[x.name,money(x.revenue),money(x.profit),percent(x.margin)]),text:'열 순서: 전략 | 판매자 수취 기준 금액 | 순이익 | 순마진율'});
    }
    case 'bogoProfit': {
      const paid=n(values,'paidQuantity'), free=n(values,'freeQuantity'), totalQty=paid+free, revenue=paid*n(values,'unitPrice');
      const fee=revenue*n(values,'feeRate')/100, cost=totalQty*n(values,'unitCost'), profit=revenue-fee-cost-n(values,'shippingCost');
      const normalValue=totalQty*n(values,'unitPrice');
      return result({title:'증정 행사 손익',metrics:[['고객 체감 할인율',percent((1-safeDivide(revenue,normalValue))*100)],['총 상품 원가',money(cost)],['주문당 순이익',money(profit)],['순마진율',percent(safeDivide(profit,revenue)*100)],['개당 실판매가',money(safeDivide(revenue,totalQty))]]});
    }
    case 'flashSale': {
      const revenue=n(values,'salePrice')*n(values,'targetOrders');
      const fee=revenue*n(values,'feeRate')/100;
      const variable=(n(values,'cost')+n(values,'shippingCost'))*n(values,'targetOrders');
      const profit=revenue-fee-variable-n(values,'adBudget');
      return result({title:'타임세일 예상 손익',metrics:[['예상 매출',money(revenue)],['예상 총이익',money(profit)],['주문당 순이익',money(safeDivide(profit,n(values,'targetOrders')))],['정상가 대비 할인액 합계',money((n(values,'regularPrice')-n(values,'salePrice'))*n(values,'targetOrders'))]]});
    }
    case 'samplingCost': {
      const per=n(values,'unitCost')+n(values,'shippingCost')+n(values,'creatorFee');
      const total=per*n(values,'participants')+n(values,'managementFee');
      return result({title:'체험단 총비용',metrics:[['1인 변동비',money(per)],['총 집행비용',money(total)],['고정 운영비',money(n(values,'managementFee'))],['비용 100만원당 참여자',number(safeDivide(1000000,total)*n(values,'participants'),1)+'명']]});
    }
    case 'influencerPerformance': {
      return result({title:'인플루언서 성과',metrics:[['ROAS',percent(safeDivide(n(values,'revenue'),n(values,'totalCost'))*100)],['주문당 비용 CPA',money(safeDivide(n(values,'totalCost'),n(values,'orders')))],['클릭당 비용 CPC',money(safeDivide(n(values,'totalCost'),n(values,'clicks')))],['전환율',percent(safeDivide(n(values,'orders'),n(values,'clicks'))*100)],['객단가',money(safeDivide(n(values,'revenue'),n(values,'orders')))]]});
    }
    case 'liveCommerceProfit': {
      const revenue=n(values,'salePrice')*n(values,'orders'), fee=revenue*n(values,'feeRate')/100;
      const profit=revenue-fee-(n(values,'cost')+n(values,'shippingCost'))*n(values,'orders')-n(values,'fixedBroadcastCost');
      const breakEven=Math.ceil(safeDivide(n(values,'fixedBroadcastCost'),n(values,'salePrice')-n(values,'cost')-n(values,'shippingCost')-n(values,'salePrice')*n(values,'feeRate')/100));
      return result({title:'라이브커머스 예상 손익',metrics:[['예상 매출',money(revenue)],['예상 순이익',money(profit)],['주문당 순이익',money(safeDivide(profit,n(values,'orders')))],['고정비 회수 주문 수',`${Math.max(0,breakEven).toLocaleString('ko-KR')}건`]]});
    }
    default:
      return null;
  }
}
