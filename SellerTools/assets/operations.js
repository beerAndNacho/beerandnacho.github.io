import { runFinance } from './operations/finance.js';
import { runProduct } from './operations/product.js';
import { runInventory } from './operations/inventory.js';
import { runShipping } from './operations/shipping.js';
import { runCrm } from './operations/crm.js';
import { runAnalytics } from './operations/analytics.js';

export const SUPPORTED_OPERATIONS = [
  'netProfit','targetMarginPrice','marketplaceFee','channelCompare','discountMargin','couponShare','freeShippingPrice','bundlePrice','optionSurcharge','vatSplit',
  'breakEvenRoas','targetRoasBudget','adCpa','clickProfit','promoCompare','bogoProfit','flashSale','samplingCost','influencerPerformance','liveCommerceProfit',
  'productTitle','titleLength','phraseCheck','featureBenefit','template','checklist','compareTable','specTable','faq','combinations','sku','normalizeOptions','duplicateValues','labelData','csvTemplate','categoryMapping','tagCleaner','optionCost','dataQuality',
  'imageResize','imageSquare','imageCompress','imageConvert','filename','safetyStock','reorderPoint','stockoutDate','inventoryTurnover','slowMoving','purchaseQty','supplierCompare','inventoryValue','stockAllocation','combinedShipping','shippingCost','packagingCost','boxRecommend','weightTier','waybillClean','addressCheck','pickingList','packingSlip','returnFee','inquiryClassifier','reviewClassifier','keywordCount','ratingGoal','repurchaseDate','dormantCustomers','customerTier','ltv','dailyDashboard','monthlyCompare','contributionProfit','concentration','abcClassification','channelPerformance','targetSales','cashFlow','sellerHealth'
];

export function runOperation(tool, values) {
  for (const runner of [runFinance, runProduct, runInventory, runShipping, runCrm, runAnalytics]) {
    const output = runner(tool, values);
    if (output) return output;
  }
  throw new Error(`지원하지 않는 연산입니다: ${tool.operation}`);
}
