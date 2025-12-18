export interface Deal {
  id?: number; // może być undefined zanim zapisane
  name: string;
  store: string;
  category: string;
  description?: string | null;
  price?: number | null;
  discountPercentage?: number | null;
  imageUrl?: string | null;
}
