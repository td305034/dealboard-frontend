export interface Deal {
  id?: number; // może być undefined zanim zapisane
  name: string;
  store: string;
  category: string;
  promoNotes?: string | null;
  priceValue?: number | null;
  priceAlt?: string | null;
  discountPercentage?: number | null;
  imageUrl?: string | null;
  unit?: string | null;
  hasNotification?: boolean;
  validUntil?: string | null;
  validSince?: string | null;
  appRequired?: boolean | null;
}

export interface GroupedDeal {
  keyword: string;
  deal: Deal;
  isPrimary: boolean;
  isCheapest: boolean;
}
