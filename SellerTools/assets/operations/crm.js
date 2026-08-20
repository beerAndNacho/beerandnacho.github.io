import { n, s, money, number, percent, safeDivide, lines, daysBetween, addDays, parsePipeRows, result, inquiryRules, reviewRules, positiveWords, negativeWords, stopWords } from './core.js';

export function runCrm(tool, values) {
  switch (tool.operation) {
    case 'inquiryClassifier': {
      const rows=lines(values.messages).map((message)=>{
        const matched=inquiryRules.find(([,pattern])=>pattern.test(message));
        const category=matched?.[0] || '기타';
        const priority=/(불량|파손|깨졌|누수|환불|취소|도착 안|배송 안)/.test(message)?'높음':'보통';
        return [category,priority,message];
      });
      return result({title:'고객 문의 분류',rows,text:'열 순서: 유형 | 우선순위 | 원문'});
    }
    case 'reviewClassifier': {
      const rows=lines(values.reviews).map((review)=>{
        const matched=reviewRules.find(([,pattern])=>pattern.test(review));
        return [matched?.[0] || '기타',review];
      });
      return result({title:'리뷰 유형 분류',rows});
    }
    case 'keywordCount': {
      const words=s(values,'reviews').toLowerCase().match(/[가-힣a-z0-9]{2,}/g) || [];
      const counts=new Map();
      for(const word of words) if(!stopWords.has(word)) counts.set(word,(counts.get(word)||0)+1);
      const top=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,Math.max(1,n(values,'topN')));
      const positive=words.filter((word)=>positiveWords.has(word)).length;
      const negative=words.filter((word)=>negativeWords.has(word)).length;
      return result({title:'리뷰 키워드 집계',metrics:[['분석 단어',`${words.length}개`],['긍정 힌트',`${positive}회`],['부정 힌트',`${negative}회`]],rows:top.map(([word,count])=>[word,`${count}회`])});
    }
    case 'ratingGoal': {
      const current=n(values,'currentRating'), count=n(values,'reviewCount'), target=n(values,'targetRating'), incoming=n(values,'newRating');
      const needed=incoming<=target?Infinity:Math.ceil((target*count-current*count)/(incoming-target));
      return result({title:'목표 평점 도달 계산',metrics:[['필요 추가 리뷰',Number.isFinite(needed)?`${Math.max(0,needed).toLocaleString('ko-KR')}개`:'도달 불가'],['현재 총점',number(current*count,1)],['목표 평점',number(target,2)]],warning:!Number.isFinite(needed)?'추가 리뷰 예상 평점이 목표 평점보다 높아야 합니다.':''});
    }
    case 'repurchaseDate': {
      const expected=addDays(s(values,'lastPurchase'),n(values,'cycleDays'));
      const messageDate=addDays(expected,-n(values,'messageLeadDays'));
      return result({title:'재구매 예상 일정',metrics:[['재구매 예상일',expected],['메시지 권장일',messageDate],['구매 후 주기',`${n(values,'cycleDays')}일`]]});
    }
    case 'dormantCustomers': {
      const today=s(values,'today');
      const rows=parsePipeRows(values.customers,4).map((row)=>{const days=daysBetween(row[1],today);const status=days>=n(values,'dormantDays')?'휴면':days>=n(values,'warningDays')?'주의':'최근';return[row[0],row[1],`${days}일`,row[2],money(Number(row[3])),status];});
      return result({title:'휴면 고객 분류',metrics:[['휴면',`${rows.filter((row)=>row.at(-1)==='휴면').length}명`],['주의',`${rows.filter((row)=>row.at(-1)==='주의').length}명`],['최근',`${rows.filter((row)=>row.at(-1)==='최근').length}명`]],rows});
    }
    case 'customerTier': {
      const today=s(values,'today');
      const rows=parsePipeRows(values.customers,4).map((row)=>{const days=daysBetween(row[1],today),orders=Number(row[2]),revenue=Number(row[3]);let tier='일반';if(revenue>=n(values,'vipRevenue')&&orders>=n(values,'vipOrders'))tier='VIP';else if(days<=n(values,'activeDays'))tier='활성';else tier='휴면주의';return[row[0],row[1],`${orders}회`,money(revenue),`${days}일`,tier];});
      return result({title:'고객 등급',rows});
    }
    case 'ltv': {
      const revenue=n(values,'averageOrderValue')*n(values,'purchaseFrequency')*n(values,'retentionYears');
      const gross=revenue*n(values,'grossMarginRate')/100;
      const net=gross-n(values,'acquisitionCost');
      return result({title:'고객 생애가치',metrics:[['매출 기준 LTV',money(revenue)],['이익 기준 LTV',money(gross)],['CAC 차감 순가치',money(net)],['LTV/CAC',`${number(safeDivide(gross,n(values,'acquisitionCost')),2)}배`]]});
    }
    default:
      return null;
  }
}
