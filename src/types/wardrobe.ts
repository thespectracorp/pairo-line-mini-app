export type Category = 'shirts' | 'jackets' | 'pants' | 'shoes' | 'outfits';

export interface WardrobeItem {
  id: string;
  category: Category;
  image_url: string;
  created_at: string;
}

export const categoryLabels: Record<Category, string> = {
  shirts: 'Shirts',
  jackets: 'Jackets',
  pants: 'Pants',
  shoes: 'Shoes',
  outfits: 'Outfits',
};
