import { n, s, money, number, percent, safeDivide, roundUp, addDays, daysBetween, parsePipeRows, result } from './core.js';

export function runInventory(tool, values) {
  switch (tool.operation) {
    case 'safetyStock': {
      const z = Number(values.serviceLevel) || 1.65;
      const stock = z * n(values,'dailySalesStd') * Math.sqrt(n(values,'leadTimeDays'));
      return result({title:'권장 안전재고',metrics:[['안전재고',`${Math.ceil(stock).toLocaleString('ko-KR')}개`],['조달기간 평균수요',`${Math.ceil(n(values,'averageDailySales')*n(values,'leadTimeDays')).toLocaleString('ko-KR')}개`],['서비스 수준 계수',number(z,2)]]});
    }
    case 'reorderPoint': {
      const leadDemand = n(values,'averageDailySales') * n(values,'leadTimeDays');
      const point = Math.ceil(leadDemand + n(values,'safetyStock'));
      return result({title:'재주문 시점',metrics:[['발주 시작 재고',`${point.toLocaleString('ko-KR')}개`],['조달기간 예상 판매',`${Math.ceil(leadDemand).toLocaleString('ko-KR')}개`],['안전재고',`${n(values,'safetyStock').toLocaleString('ko-KR')}개`]]});
    }
    case 'stockoutDate': {
      const start=s(values,'startDate'), incomingDate=s(values,'incomingDate');
      const daily=n(values,'averageDailySales'), daysToIncoming=Math.max(0,daysBetween(start,incomingDate));
      const stockAtIncoming=n(values,'currentStock')-daily*daysToIncoming;
      const total=Math.max(0,stockAtIncoming)+n(values,'incomingStock');
      const remainingDays=daysToIncoming+safeDivide(total,daily);
      return result({title:'품절 예상',metrics:[['예상 품절일',addDays(start,Math.floor(remainingDays))],['판매 가능 일수',`${number(remainingDays,1)}일`],['입고 직전 예상재고',`${Math.floor(stockAtIncoming).toLocaleString('ko-KR')}개`]],warning:stockAtIncoming<0?'입고 예정일 전에 현재 재고가 먼저 소진될 가능성이 있습니다.':''});
    }
    case 'inventoryTurnover': {
      const average=(n(values,'openingInventory')+n(values,'closingInventory'))/2;
      const turnover=safeDivide(n(values,'cogs'),average);
      return result({title:'재고 회전',metrics:[['재고 회전율',`${number(turnover,2)}회`],['평균 보유일수',`${number(safeDivide(n(values,'periodDays'),turnover),1)}일`],['평균 재고금액',money(average)]]});
    }
    case 'slowMoving': {
      const today=s(values,'today');
      const rows=parsePipeRows(values.rows,4).map((row)=>{
        const stock=Number(row[1]), sales=Number(row[2]), days=daysBetween(row[3],today);
        const rate=safeDivide(sales,stock+sales)*100;
        const status=days>=n(values,'daysThreshold') || rate<n(values,'sellThroughThreshold') ? '장기재고 후보' : '관찰';
        return [row[0],stock.toLocaleString('ko-KR'),sales.toLocaleString('ko-KR'),row[3],`${days}일`,percent(rate),status];
      });
      const slow=rows.filter((row)=>row.at(-1)==='장기재고 후보');
      return result({title:'장기재고 탐지',metrics:[['전체 SKU',`${rows.length}개`],['장기재고 후보',`${slow.length}개`]],rows,text:'열 순서: SKU | 현재고 | 최근 판매 | 마지막 판매일 | 경과일 | 판매율 | 상태'});
    }
    case 'purchaseQty': {
      const raw=Math.max(0,n(values,'forecastDemand')+n(values,'safetyStock')-n(values,'currentStock')-n(values,'incomingStock'));
      const rounded=roundUp(Math.max(raw,n(values,'moq')||0),n(values,'packSize')||1);
      return result({title:'권장 발주 수량',metrics:[['순수 필요 수량',`${Math.ceil(raw).toLocaleString('ko-KR')}개`],['MOQ·입수 반영 발주량',`${rounded.toLocaleString('ko-KR')}개`],['발주 후 예상 기말재고',`${(n(values,'currentStock')+n(values,'incomingStock')+rounded-n(values,'forecastDemand')).toLocaleString('ko-KR')}개`]]});
    }
    case 'supplierCompare': {
      const required=n(values,'requiredQty');
      const rows=['A','B','C'].map((key)=>{
        const qty=Math.max(required,n(values,`moq${key}`));
        const total=qty*n(values,`unit${key}`)+n(values,`shipping${key}`);
        const good=qty*(1-n(values,`defect${key}`)/100);
        return {name:s(values,`supplier${key}`),qty,total,effective:safeDivide(total,good),lead:n(values,`lead${key}`),defect:n(values,`defect${key}`)};
      }).sort((a,b)=>a.effective-b.effective);
      return result({title:'공급처 비교',summary:`불량 가능성을 반영한 유효 단가 기준으로 ${rows[0].name}가 가장 낮습니다.`,rows:rows.map((row)=>[row.name,`${row.qty.toLocaleString('ko-KR')}개`,money(row.total),money(row.effective),`${row.lead}일`,percent(row.defect)]),text:'열 순서: 공급처 | 주문 수량 | 총비용 | 정상 1개당 유효단가 | 조달기간 | 불량률'});
    }
    case 'inventoryValue': {
      const rows=parsePipeRows(values.rows,4).map((row)=>({sku:row[0],name:row[1],qty:Number(row[2]),unit:Number(row[3]),value:Number(row[2])*Number(row[3])})).sort((a,b)=>b.value-a.value);
      const total=rows.reduce((sum,row)=>sum+row.value,0);
      return result({title:'재고 자산',metrics:[['총 재고 원가',money(total)],['SKU 수',`${rows.length}개`],['최대 비중 SKU',rows[0]?.sku||'-']],rows:rows.map((row)=>[row.sku,row.name,row.qty.toLocaleString('ko-KR'),money(row.unit),money(row.value),percent(safeDivide(row.value,total)*100)])});
    }
    case 'stockAllocation': {
      const total=n(values,'totalStock');
      const source=parsePipeRows(values.rows,3).map((row)=>({name:row[0],share:Number(row[1]),min:Number(row[2])}));
      const minimum=source.reduce((sum,row)=>sum+row.min,0);
      const remainder=Math.max(0,total-minimum);
      const shareTotal=source.reduce((sum,row)=>sum+Math.max(0,row.share),0);
      let allocations=source.map((row)=>row.min+Math.floor(remainder*safeDivide(row.share,shareTotal)));
      let assigned=allocations.reduce((a,b)=>a+b,0), index=0;
      while(assigned<total && source.length){allocations[index%source.length]++;assigned++;index++;}
      return result({title:'옵션별 재고 배분',metrics:[['전체 입고량',`${total.toLocaleString('ko-KR')}개`],['최소 배분 합계',`${minimum.toLocaleString('ko-KR')}개`]],rows:source.map((row,i)=>[row.name,percent(row.share,1),`${row.min}개`,`${allocations[i]}개`])});
    }
    default:
      return null;
  }
}
