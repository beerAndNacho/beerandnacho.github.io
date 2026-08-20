import { tools01 } from './catalog/tools01.js';
import { tools02 } from './catalog/tools02.js';
import { tools03 } from './catalog/tools03.js';
import { tools04 } from './catalog/tools04.js';
import { tools05 } from './catalog/tools05.js';
import { tools06 } from './catalog/tools06.js';
import { tools07 } from './catalog/tools07.js';
import { tools08 } from './catalog/tools08.js';
import { tools09 } from './catalog/tools09.js';
import { tools10 } from './catalog/tools10.js';

export const CATEGORIES = [
  '가격·마진',
  '광고·프로모션',
  '상품등록',
  '상품데이터',
  '이미지·콘텐츠',
  '재고·발주',
  '주문·배송',
  '교환·CS',
  '리뷰·고객',
  '매출·운영'
];

export const TOOLS = [
  ...tools01,
  ...tools02,
  ...tools03,
  ...tools04,
  ...tools05,
  ...tools06,
  ...tools07,
  ...tools08,
  ...tools09,
  ...tools10
];

export const TOOL_MAP = new Map(TOOLS.map((tool) => [tool.slug, tool]));
