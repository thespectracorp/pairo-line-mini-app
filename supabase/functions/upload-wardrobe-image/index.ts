import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const allowedCategories = new Set(['shirts', 'jackets', 'pants', 'shoes', 'outfits']);
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxFileSize = 5 * 1024 * 1024;

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (request.method === 'DELETE') {
      const body = await request.json() as { id?: string; customer_key?: string };
      if (!body.id || !body.customer_key || body.customer_key.length > 200) return new Response(JSON.stringify({ error: 'Invalid item' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const existing = await supabase.from('wardrobe_items').select('image_url').eq('id', body.id).eq('customer_key', body.customer_key).maybeSingle();
      if (existing.error || !existing.data) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const marker = '/wardrobe-images/';
      const markerIndex = existing.data.image_url.indexOf(marker);
      if (markerIndex >= 0) await supabase.storage.from('wardrobe-images').remove([existing.data.image_url.slice(markerIndex + marker.length)]);
      const deleted = await supabase.from('wardrobe_items').delete().eq('id', body.id).eq('customer_key', body.customer_key);
      if (deleted.error) throw deleted.error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category');
    const customerKey = formData.get('customer_key');
    if (!(file instanceof File) || typeof category !== 'string' || !allowedCategories.has(category) || typeof customerKey !== 'string' || customerKey.length < 1 || customerKey.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid upload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!allowedTypes.has(file.type) || file.size > maxFileSize) {
      return new Response(JSON.stringify({ error: 'Unsupported image' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const extension = file.type.split('/')[1];
    const path = `${crypto.randomUUID()}.${extension}`;
    const upload = await supabase.storage.from('wardrobe-images').upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) throw upload.error;
    const imageUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/wardrobe-images/${path}`;
    const insert = await supabase.from('wardrobe_items').insert({ category, image_url: imageUrl, customer_key: customerKey }).select('id, category, image_url, created_at').single();
    if (insert.error) throw insert.error;
    return new Response(JSON.stringify({ item: insert.data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('wardrobe image upload failed', error);
    return new Response(JSON.stringify({ error: 'Could not upload image' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
