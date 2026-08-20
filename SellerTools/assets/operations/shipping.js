import { n, s, money, percent, safeDivide, parsePipeRows, csvEscape, result } from './core.js';

export function runShipping(tool, values) {
  switch (tool.operation) {
    case 'combinedShipping': {
      const orders=parsePipeRows(values.orders,6).map((row)=>({order:row[0],customer:row[1],phone:row[2].replace(/\D/g,''),address:row[3].replace(/\s+/g,''),date:row[4],type:row[5]}));
      const groups=new Map();
      for(const order of orders){const key=[order.customer,order.phone,order.address,order.date,order.type].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(order.order);}
      const candidates=[...groups.entries()].filter(([,ids])=>ids.length>1).map(([key,ids])=>{const [customer,,,date,type]=key.split('|');return[ids.join(', '),customer,date,type,`${ids.length}건`];});
      return result({title:'합배송 후보',metrics:[['전체 주문',`${orders.length}건`],['후보 그룹',`${candidates.length}개`],['후보 주문',`${candidates.reduce((sum,row)=>sum+Number(row[4].replace(/\D/g,'')),0)}건`]],rows:candidates,text:candidates.length?'열 순서: 주문번호 | 수령인 | 출고일 | 배송유형 | 주문 수\n주소·연락처·출고일·배송유형이 모두 같은 후보입니다. 실제 포장 가능 여부를 확인하세요.':'동일 조건의 합배송 후보를 찾지 못했습니다.'});
    }
    case 'shippingCost': {
      const base=n(values,'orderAmount')>=n(values,'freeThreshold')?0:n(values,'baseShipping');
      const remote=values.isRemote?n(values,'remoteSurcharge'):0;
      const customer=s(values,'payer')==='customer'?base+remote:remote;
      const seller=s(values,'payer')==='seller'?base:0;
      return result({title:'배송비 부담',metrics:[['고객 부담',money(customer)],['판매자 부담',money(seller)],['도서산간 추가비',money(remote)],['무료배송까지 부족',money(Math.max(0,n(values,'freeThreshold')-n(values,'orderAmount')))]]});
    }
    case 'packagingCost': {
      const tape=safeDivide(n(values,'tapeCostPerRoll'),n(values,'ordersPerTapeRoll'));
      const labor=n(values,'hourlyLaborCost')/60*n(values,'laborMinutes');
      const material=n(values,'boxCost')+n(values,'cushionCost')+tape+n(values,'labelCost')+n(values,'insertCost');
      const total=material+labor;
      return result({title:'주문당 포장 원가',metrics:[['총 포장 원가',money(total)],['재료비',money(material)],['포장 인건비',money(labor)],['1,000건 예상',money(total*1000)]],rows:[['박스',money(n(values,'boxCost'))],['완충재',money(n(values,'cushionCost'))],['테이프 배부액',money(tape)],['라벨·송장',money(n(values,'labelCost'))],['동봉물',money(n(values,'insertCost'))],['인건비',money(labor)]]});
    }
    case 'boxRecommend': {
      const qty=Math.max(1,n(values,'quantity'));
      const product=[n(values,'productWidth'),n(values,'productDepth'),n(values,'productHeight')].sort((a,b)=>b-a);
      const required=[product[0]+n(values,'padding'),product[1]+n(values,'padding'),product[2]*qty+n(values,'padding')].sort((a,b)=>b-a);
      const boxes=parsePipeRows(values.boxes,4).map((row)=>({name:row[0],dims:[Number(row[1]),Number(row[2]),Number(row[3])].sort((a,b)=>b-a)})).map((box)=>({...box,fit:box.dims.every((dim,index)=>dim>=required[index]),volume:box.dims.reduce((a,b)=>a*b,1)})).sort((a,b)=>a.volume-b.volume);
      const choice=boxes.find((box)=>box.fit);
      return result({title:'박스 추천',metrics:[['필요 내부 공간',required.map((x)=>`${Math.ceil(x)}mm`).join(' × ')],['추천 박스',choice?.name||'일치 박스 없음'],['추천 규격',choice?`${choice.dims.join(' × ')}mm`:'새 박스 규격 필요']],rows:boxes.map((box)=>[box.name,`${box.dims.join(' × ')}mm`,box.fit?'적합':'부적합'])});
    }
    case 'weightTier': {
      const total=n(values,'unitWeight')*n(values,'quantity')+n(values,'packagingWeight');
      const tiers=parsePipeRows(values.tiers,3).map((row)=>({name:row[0],max:Number(row[1]),fee:Number(row[2])})).sort((a,b)=>a.max-b.max);
      const tier=tiers.find((item)=>total<=item.max);
      return result({title:'택배 중량 구간',metrics:[['예상 총중량',`${total.toLocaleString('ko-KR')}g`],['적용 구간',tier?.name||'입력 구간 초과'],['예상 요금',tier?money(tier.fee):'-'],['구간 여유',tier?`${(tier.max-total).toLocaleString('ko-KR')}g`:'-']],rows:tiers.map((item)=>[item.name,`${item.max.toLocaleString('ko-KR')}g 이하`,money(item.fee)])});
    }
    case 'waybillClean': {
      const rows=parsePipeRows(values.rows,4).map((row)=>{const digits=row[1].replace(/\D/g,'');const phone=digits.replace(/^(\d{3})(\d{3,4})(\d{4})$/,'$1-$2-$3');return[row[0].trim(),phone,row[2].replace(/\D/g,''),row[3].replace(/\s+/g,' ').trim()];});
      const text=rows.map((row)=>row.map(csvEscape).join(',')).join('\n');
      return result({title:'정리된 송장 데이터',rows,text,downloadName:'waybill-clean.csv'});
    }
    case 'addressCheck': {
      const issues=parsePipeRows(values.rows,5).flatMap((row)=>{const found=[];if(!row[1])found.push('수령인 누락');if(row[2].replace(/\D/g,'').length<10)found.push('전화번호 확인');if(!/^\d{5}$/.test(row[3].replace(/\D/g,'')))found.push('우편번호 확인');if(!/(시|도)/.test(row[4]))found.push('시·도 확인');if(!/(구|군|시)/.test(row[4]))found.push('시군구 확인');if(row[4].trim().split(/\s+/).length<3)found.push('상세주소 가능성');return found.length?[[row[0],row[1],found.join(', '),row[4]]]:[];});
      return result({title:'주소 오류 점검',metrics:[['문제 주문',`${issues.length}건`]],rows:issues,text:issues.length?'열 순서: 주문번호 | 수령인 | 확인 항목 | 주소':'기본 형식 검사에서 문제를 찾지 못했습니다.'});
    }
    case 'pickingList': {
      const source=parsePipeRows(values.orders,5), map=new Map();
      for(const row of source){const key=[row[1],row[2],row[4]].join('|');map.set(key,(map.get(key)||0)+Number(row[3]));}
      const rows=[...map.entries()].map(([key,qty])=>{const [sku,name,location]=key.split('|');return[location,sku,name,qty.toLocaleString('ko-KR')];}).sort((a,b)=>a[0].localeCompare(b[0]));
      return result({title:'피킹리스트',metrics:[['주문 행',`${source.length}개`],['피킹 SKU',`${rows.length}개`],['총 수량',`${rows.reduce((sum,row)=>sum+Number(row[3].replace(/,/g,'')),0).toLocaleString('ko-KR')}개`]],rows,text:'열 순서: 창고 위치 | SKU | 상품명 | 총 피킹 수량'});
    }
    case 'packingSlip': {
      const items=parsePipeRows(values.items,3);
      const text=`포장명세서\n\n주문번호: ${s(values,'orderId')}\n수령인: ${s(values,'customer')}\n출고일: ${s(values,'shipDate')}\n\n상품 목록\n${items.map((row,index)=>`${index+1}. ${row[0]} / ${row[1]} / ${row[2]}개`).join('\n')}\n\n안내\n${s(values,'note')}`;
      return result({title:'포장명세서',rows:items,text,downloadName:`packing-slip-${s(values,'orderId')}.txt`});
    }
    case 'returnFee': {
      const fee=s(values,'reason')==='seller'?0:n(values,'returnShipping')+n(values,'extraRemoteFee')+(values.wasFreeShipping?n(values,'initialShipping'):0);
      return result({title:'예상 고객 부담 반품비',metrics:[['고객 부담',money(fee)],['최초 배송비 반영',values.wasFreeShipping&&s(values,'reason')==='customer'?money(n(values,'initialShipping')):money(0)],['회수 배송비',s(values,'reason')==='seller'?money(0):money(n(values,'returnShipping')+n(values,'extraRemoteFee'))]],summary:s(values,'reason')==='seller'?'판매자 귀책으로 입력되어 고객 부담을 0원으로 계산했습니다.':'단순 변심과 무료배송 여부를 기준으로 계산했습니다.'});
    }
    default:
      return null;
  }
}
