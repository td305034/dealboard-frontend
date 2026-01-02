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
}
