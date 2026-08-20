import { n, s, money, percent, safeDivide, lines, unique, slugify, parsePipeRows, parseCSV, csvEscape, result, interpolate, forbiddenRules } from './core.js';

export function runProduct(tool, values) {
  switch (tool.operation) {
    case 'productTitle': {
      const parts=[s(values,'brand'),s(values,'keyword'),s(values,'target'),s(values,'spec'),s(values,'benefit')].filter(Boolean);
      const candidates=[
        [parts[0],parts[1],parts[3],parts[4]].filter(Boolean).join(' '),
        [parts[2],parts[1],parts[4],parts[3]].filter(Boolean).join(' '),
        [parts[0],parts[4],parts[1],parts[3]].filter(Boolean).join(' '),
        [parts[1],parts[2],parts[3],parts[4]].filter(Boolean).join(' ')
      ];
      return result({title:'상품명 후보',rows:unique(candidates).map((x,i)=>[`후보 ${i+1}`,x,`${[...x].length}자`]),text:'브랜드·핵심 키워드·규격을 우선 배치하고 같은 단어를 반복하지 않는 방향으로 검토하세요.'});
    }
    case 'titleLength': {
      const title=s(values,'title');
      const words=title.toLowerCase().split(/\s+/).filter(Boolean);
      const duplicates=[...new Set(words.filter((word,index)=>words.indexOf(word)!==index))];
      const specials=title.match(/[^\p{L}\p{N}\s%+\-×x]/gu)||[];
      const warnings=[];
      if ([...title].length>60) warnings.push('60자를 초과했습니다. 모바일 검색 결과에서 핵심 정보가 잘릴 수 있습니다.');
      if (duplicates.length) warnings.push(`중복 단어: ${duplicates.join(', ')}`);
      if (specials.length) warnings.push(`검토할 특수문자: ${unique(specials).join(' ')}`);
      return result({title:'상품명 검사 결과',metrics:[['글자 수',`${[...title].length}자`],['단어 수',`${words.length}개`],['중복 단어',duplicates.length?duplicates.join(', '):'없음'],['검토 항목',`${warnings.length}개`]],text:warnings.length?warnings.map((x,i)=>`${i+1}. ${x}`).join('\n'):'눈에 띄는 길이·중복·특수문자 문제를 찾지 못했습니다.'});
    }
    case 'phraseCheck': {
      const content=s(values,'content');
      const hits=[];
      for (const rule of forbiddenRules) {
        const matches=content.match(rule.pattern);
        if(matches) hits.push([rule.label,unique(matches).join(', '),'근거 자료·표현 범위·상품군 규정 확인 필요']);
      }
      return result({title:'표현 자가 점검',summary:hits.length?'추가 검토가 필요한 표현이 발견됐습니다.':'등록된 자가 점검 규칙에서 주의 표현을 찾지 못했습니다.',metrics:[['주의 표현 유형',`${hits.length}개`],['전체 글자 수',`${[...content].length}자`]],rows:hits,text:hits.length?'열 순서: 유형 | 발견 표현 | 권장 조치':'표현 근거와 실제 상품 정보를 별도로 확인하세요.'});
    }
    case 'featureBenefit': {
      const featureLines=lines(values.features);
      const rows=featureLines.map((feature,index)=>[
        feature,
        `${s(values,'target') || '고객'}이 ${feature} 덕분에 겪는 시간·불편·위험을 줄일 수 있습니다.`,
        index%3===0?'실제 사용 장면 사진':index%3===1?'구조 근접 사진·설명':'수치·비교·테스트 결과'
      ]);
      return result({title:`${s(values,'product')} 기능→이점 정리`,rows,text:'열 순서: 기능 | 고객 이점 문장 초안 | 함께 보여줄 근거'});
    }
    case 'template':
      return result({title:`${tool.title} 결과`,text:interpolate(tool.template,values),downloadName:`${tool.slug}.txt`});
    case 'checklist': {
      const included=s(values,'included').toLowerCase();
      const rows=(tool.checklist||[]).map((item)=>[included.includes(item.toLowerCase())?'포함 가능':'확인 필요',item]);
      const missing=rows.filter((row)=>row[0]==='확인 필요').length;
      return result({title:'체크리스트',metrics:[['전체 항목',`${rows.length}개`],['확인 필요',`${missing}개`],['포함 가능',`${rows.length-missing}개`]],rows,text:'자동 판정은 입력 문구 포함 여부를 기준으로 한 1차 점검입니다.'});
    }
    case 'compareTable': {
      const rows=[['항목',s(values,'nameA'),s(values,'nameB'),s(values,'nameC')],['가격',s(values,'priceA'),s(values,'priceB'),s(values,'priceC')]];
      const featureSets=[lines(values.featuresA),lines(values.featuresB),lines(values.featuresC)];
      const max=Math.max(...featureSets.map(x=>x.length));
      for(let i=0;i<max;i++) rows.push([`특징 ${i+1}`,featureSets[0][i]||'-',featureSets[1][i]||'-',featureSets[2][i]||'-']);
      const markdown=rows.map((row,index)=>`| ${row.join(' | ')} |${index===0?`\n| ${row.map(()=> '---').join(' | ')} |`:''}`).join('\n');
      return result({title:'상품 비교표',rows,text:markdown,downloadName:'product-comparison.md'});
    }
    case 'specTable': {
      const specs=parsePipeRows(lines(values.specs).map(line=>line.replace(':','|')).join('\n'),2);
      return result({title:`${s(values,'product')} 규격표`,rows:specs,text:['| 항목 | 내용 |','| --- | --- |',...specs.map(row=>`| ${row[0]} | ${row.slice(1).join(' | ')} |`)].join('\n')});
    }
    case 'faq': {
      const questions=lines(values.concerns);
      const features=lines(values.features);
      const text=questions.map((question,index)=>`Q${index+1}. ${question}\nA. ${features[index%Math.max(1,features.length)] || '상품 정보와 판매 정책을 확인해 정확한 답변을 작성하세요.'} 관련 정보를 먼저 안내하고, 적용 조건과 제한사항을 함께 명시하세요.`).join('\n\n');
      return result({title:`${s(values,'product')} FAQ`,text,downloadName:'product-faq.txt'});
    }
    case 'combinations': {
      const groups=[lines(values.option1),lines(values.option2),lines(values.option3)].filter(group=>group.length);
      let combos=[[]];
      for(const group of groups) combos=combos.flatMap(base=>group.map(item=>[...base,item]));
      return result({title:'옵션 조합',metrics:[['생성 조합',`${combos.length}개`]],rows:combos.map((combo,index)=>[index+1,combo.join(' / ')]),text:combos.map(combo=>combo.join(' | ')).join('\n')});
    }
    case 'sku': {
      const separator=s(values,'separator');
      const prefix=[s(values,'brand'),s(values,'categoryCode'),s(values,'productCode')].map(slugify).filter(Boolean).join(separator).toUpperCase();
      const rows=lines(values.options).map((line,index)=>{
        const option=line.split('|').map(x=>slugify(x).slice(0,5).toUpperCase()).filter(Boolean).join(separator);
        return [line,`${prefix}${separator}${String(index+1).padStart(2,'0')}${option?separator+option:''}`];
      });
      return result({title:'SKU 코드',rows,text:rows.map(row=>row.join(',')).join('\n'),downloadName:'sku-codes.csv'});
    }
    case 'normalizeOptions': {
      const separator=s(values,'separator');
      const mode=s(values,'caseMode');
      const rows=lines(values.options).map((line)=>{
        let parts=line.split(/[\/_|\-]+/).map(x=>x.trim().replace(/\s+/g,' ')).filter(Boolean);
        parts=parts.map(part=>mode==='upper'?part.toUpperCase():mode==='lower'?part.toLowerCase():part);
        return [line,parts.join(separator)];
      });
      return result({title:'옵션명 정리 결과',rows,text:rows.map(row=>row[1]).join('\n')});
    }
    case 'duplicateValues': {
      const valuesList=lines(values.values);
      const count=new Map();
      valuesList.forEach(value=>count.set(value,(count.get(value)||0)+1));
      const rows=[...count.entries()].filter(([,c])=>c>1).sort((a,b)=>b[1]-a[1]);
      return result({title:'중복 검사 결과',metrics:[['전체 행',`${valuesList.length}개`],['고유 값',`${count.size}개`],['중복 값',`${rows.length}개`]],rows:rows.map(([value,c])=>[value,`${c}회`]),text:rows.length?'중복 상품코드는 등록·재고·정산 오류를 만들 수 있으므로 원본 행을 확인하세요.':'중복값을 찾지 못했습니다.'});
    }
    case 'labelData': {
      const products=parsePipeRows(values.products,4);
      const output=[['name','sku','price','barcode','copy']];
      for(const row of products) for(let copy=1;copy<=Math.max(1,n(values,'copies'));copy++) output.push([row[0],row[1],row[2],row[3],copy]);
      const csv=output.map(row=>row.map(csvEscape).join(',')).join('\n');
      return result({title:'라벨 데이터',metrics:[['상품 수',`${products.length}개`],['전체 라벨',`${output.length-1}매`]],rows:output.slice(1,11),text:csv,downloadName:'barcode-labels.csv'});
    }
    case 'csvTemplate': {
      const rows=[['sku','title','category','price','stock','status'],[s(values,'sku'),s(values,'product'),s(values,'category'),n(values,'price'),n(values,'stock'),'판매중']];
      return result({title:'상품 CSV 템플릿',rows,text:rows.map(row=>row.map(csvEscape).join(',')).join('\n'),downloadName:'product-upload-template.csv'});
    }
    case 'categoryMapping': {
      const rows=parsePipeRows(values.rows,4);
      return result({title:'카테고리 매핑표',rows,text:['internal,channel_a,channel_b,channel_c',...rows.map(row=>row.map(csvEscape).join(','))].join('\n'),downloadName:'category-mapping.csv'});
    }
    case 'tagCleaner': {
      const raw=String(values.tags??'').split(/[\n,]+/).map(x=>x.trim().replace(/^#+/,'').replace(/\s+/g,' ')).filter(x=>[...x].length>=n(values,'minLength'));
      const cleaned=unique(raw.map(x=>x.toLowerCase())).slice(0,Math.max(1,n(values,'maxTags')));
      return result({title:'정리된 상품 태그',metrics:[['입력 태그',`${raw.length}개`],['최종 태그',`${cleaned.length}개`]],rows:cleaned.map((tag,index)=>[index+1,tag]),text:cleaned.join(', ')});
    }
    case 'optionCost': {
      const rows=parsePipeRows(values.rows,4).map(row=>{
        const price=Number(row[1]), cost=Number(row[2]), stock=Number(row[3]);
        const fee=price*n(values,'feeRate')/100, profit=price-cost-fee-n(values,'fixedCost');
        return [row[0],money(price),money(cost),stock.toLocaleString('ko-KR'),money(profit),percent(safeDivide(profit,price)*100),money(profit*stock)];
      }).sort((a,b)=>Number(String(b[4]).replace(/[^\d-]/g,''))-Number(String(a[4]).replace(/[^\d-]/g,'')));
      return result({title:'옵션별 원가·마진표',rows,text:'열 순서: 옵션 | 판매가 | 원가 | 재고 | 주문당 순이익 | 순마진율 | 현재고 잠재이익'});
    }
    case 'dataQuality': {
      const csv=parseCSV(values.csv);
      if(csv.length<2) return result({title:'데이터 검사',warning:'헤더와 데이터 행이 필요합니다.'});
      const headers=csv[0].map(x=>x.trim().toLowerCase());
      const skuIndex=headers.indexOf('sku'), titleIndex=headers.indexOf('title'), priceIndex=headers.indexOf('price'), stockIndex=headers.indexOf('stock');
      const seen=new Set(), issues=[];
      csv.slice(1).forEach((row,index)=>{
        const line=index+2, sku=(row[skuIndex]||'').trim(), title=(row[titleIndex]||'').trim(), price=Number(row[priceIndex]), stock=Number(row[stockIndex]);
        if(!sku) issues.push([line,'SKU 누락','관리 코드 입력']);
        else if(seen.has(sku)) issues.push([line,'SKU 중복',sku]);
        seen.add(sku);
        if(!title) issues.push([line,'상품명 누락','상품명 입력']);
        if(!Number.isFinite(price)||price<=0) issues.push([line,'가격 오류',row[priceIndex]||'빈 값']);
        if(!Number.isFinite(stock)||stock<0) issues.push([line,'재고 오류',row[stockIndex]||'빈 값']);
      });
      return result({title:'상품 데이터 품질 검사',metrics:[['데이터 행',`${csv.length-1}개`],['문제 항목',`${issues.length}개`],['고유 SKU',`${seen.size}개`]],rows:issues,text:issues.length?'열 순서: CSV 행 번호 | 문제 | 현재 값·조치':'기본 검사에서 문제를 찾지 못했습니다.'});
    }
    case 'filename': {
      const options=lines(values.options), shots=lines(values.shots), ext=s(values,'extension');
      const prefix=[s(values,'sku'),s(values,'product')].map(slugify).filter(Boolean).join('-');
      const rows=[];
      options.forEach((option)=>shots.forEach((shot,si)=>rows.push([option,shot,`${prefix}-${slugify(option)}-${String(si+1).padStart(2,'0')}-${slugify(shot)}.${ext}`])));
      return result({title:'이미지 파일명',metrics:[['생성 파일명',`${rows.length}개`]],rows,text:rows.map(row=>row[2]).join('\n'),downloadName:'image-filenames.txt'});
    }
    case 'imageResize':
    case 'imageSquare':
    case 'imageCompress':
    case 'imageConvert':
      return result({ title:'이미지 처리 준비', warning:'이미지 도구는 브라우저 Canvas에서 처리됩니다.' });
    default:
      return null;
  }
}
