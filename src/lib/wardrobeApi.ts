import { supabase } from './supabase';
import type { Category, WardrobeItem } from '../types/wardrobe';

const extensionByType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function uploadWardrobeItem(file: File, category: Category, profileId: string): Promise<WardrobeItem> {
  const extension = extensionByType[file.type];
  if (!extension) throw new Error('Unsupported image type');
  const path = `${profileId}/${crypto.randomUUID()}.${extension}`;
  const storage = supabase.storage.from('wardrobe-images');
  const uploaded = await storage.upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) throw uploaded.error;

  const { data: publicData } = storage.getPublicUrl(path);
  const inserted = await supabase
    .from('wardrobe_items')
    .insert({ category, image_url: publicData.publicUrl, customer_key: profileId })
    .select('id, category, image_url, created_at')
    .single();
  if (inserted.error || !inserted.data) {
    await storage.remove([path]);
    throw inserted.error ?? new Error('Could not save wardrobe item');
  }
  return inserted.data as WardrobeItem;
}

export async function deleteWardrobeItem(item: WardrobeItem, profileId: string): Promise<void> {
  const deleted = await supabase.from('wardrobe_items').delete().eq('id', item.id).eq('customer_key', profileId);
  if (deleted.error) throw deleted.error;
  const marker = '/wardrobe-images/';
  const markerIndex = item.image_url.indexOf(marker);
  if (markerIndex >= 0) {
    await supabase.storage.from('wardrobe-images').remove([decodeURIComponent(item.image_url.slice(markerIndex + marker.length))]);
  }
}
