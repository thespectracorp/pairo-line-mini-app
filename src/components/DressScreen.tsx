import { useEffect, useMemo, useState } from 'react';
import { Eye, LoaderCircle, Palette, Save, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { supabase } from '../lib/supabase';
import { getCustomerKey } from '../lib/customer';
import { deleteWardrobeItem, uploadWardrobeItem } from '../lib/wardrobeApi';
import { categoryLabels, type WardrobeItem } from '../types/wardrobe';
import { combineImagesVertically, imageBlobToDataUrl } from '../lib/combineImages';

type OutfitSlot = 'shirts' | 'pants' | 'shoes';
const outfitSlots: OutfitSlot[] = ['shirts', 'pants', 'shoes'];

interface DressScreenProps {
  profileComplete: boolean;
  onNeedProfile: () => void;
}

const formatOutfitDate = (value: string) => {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month}. ${year} ${hours}:${minutes}`;
};

export function DressScreen({ profileComplete, onNeedProfile }: DressScreenProps) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isRegisterPromptOpen, setIsRegisterPromptOpen] = useState(false);
  const [selectionSlot, setSelectionSlot] = useState<OutfitSlot | null>(null);
  const [selected, setSelected] = useState<Partial<Record<OutfitSlot, WardrobeItem>>>({});
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [customerKey, setCustomerKey] = useState('');

  useEffect(() => {
    const loadItems = async () => {
      try {
        const key = await getCustomerKey();
        setCustomerKey(key);
        const { data, error } = await supabase.from('wardrobe_items').select('id, category, image_url, created_at').eq('customer_key', key).order('created_at', { ascending: false });
        if (error) throw error;
        setItems((data ?? []) as WardrobeItem[]);
      } catch (error) {
        console.error('saved outfits load failed', error);
        setErrorMessage('Could not load saved outfits.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadItems();
  }, []);

  const savedOutfits = useMemo(() => items.filter((item) => item.category === 'outfits'), [items]);
  const hasCompleteSelection = outfitSlots.every((slot) => Boolean(selected[slot]));

  const selectItem = (item: WardrobeItem) => {
    if (!selectionSlot) return;
    setSelected((current) => ({ ...current, [selectionSlot]: item }));
    setSelectionSlot(null);
  };

  const createCombinedBlob = async () => combineImagesVertically(outfitSlots.map((slot) => selected[slot]!.image_url));

  const handlePreview = async () => {
    if (!hasCompleteSelection) return;
    setErrorMessage('');
    try {
      const blob = await createCombinedBlob();
      setPreviewSource(await imageBlobToDataUrl(blob));
      setIsCustomizeOpen(false);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('outfit preview failed', error);
      setErrorMessage('Could not create the outfit preview.');
    }
  };

  const handleSave = async () => {
    if (!hasCompleteSelection) return;
    setIsSaving(true);
    setErrorMessage('');
    try {
      const blob = await createCombinedBlob();
      const profileId = customerKey || await getCustomerKey();
      const item = await uploadWardrobeItem(new File([blob], 'saved-outfit.jpg', { type: 'image/jpeg' }), 'outfits', profileId);
      setCustomerKey(profileId);
      setItems((currentItems) => [item, ...currentItems]);
      setIsCustomizeOpen(false);
      setPreviewSource(item.image_url);
      setIsPreviewOpen(true);
      setSelected({});
    } catch (error) {
      console.error('outfit save failed', error);
      setErrorMessage('Could not save this outfit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    setErrorMessage('');
    try {
      const profileId = customerKey || await getCustomerKey();
      await deleteWardrobeItem(selectedItem, profileId);
      setItems((currentItems) => currentItems.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
      setIsDeleteOpen(false);
    } catch (error) {
      console.error('outfit delete failed', error);
      setErrorMessage('Could not delete this outfit. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderSlot = (slot: OutfitSlot, label: string, step: string) => {
    const item = selected[slot];
    return <div className="outfit-slot-group" key={slot}><h3>{step}. {label}</h3><button className="outfit-slot" onClick={() => setSelectionSlot(slot)}>{item ? <><ImageWithFallback src={item.image_url} alt={`${label} selection`} /><span className="outfit-slot-remove" onClick={(event) => { event.stopPropagation(); setSelected((current) => ({ ...current, [slot]: undefined })); }}><X size={14} /></span></> : <><Palette size={28} /><span>Select {label.toLowerCase()}</span></>}</button></div>;
  };

  return (
    <div className="history-screen screen">
      <header className="history-header"><h1 className="screen-title">History</h1></header>
      <div className="history-content">
        {isLoading ? <div className="empty-state"><LoaderCircle className="animate-spin" size={24} /><span>Loading saved outfits</span></div> : savedOutfits.length === 0 ? <div className="history-empty"><span>Your saved outfits will appear here.</span></div> : <div className="history-grid">{savedOutfits.map((item) => <button className="history-card" key={item.id} onClick={() => { setSelectedItem(item); setIsActionOpen(true); }}><div className="history-image outfit-history-image"><ImageWithFallback src={item.image_url} alt="Saved outfit" /></div><h3>{formatOutfitDate(item.created_at)}</h3><p>Shirt, pants and shoes</p></button>)}</div>}
      </div>
      {errorMessage && <p className="screen-error" role="alert">{errorMessage}</p>}
      <div className="bottom-action"><Button className="pink-button" onClick={() => { setErrorMessage(''); if (!profileComplete) { setIsRegisterPromptOpen(true); } else { setIsCustomizeOpen(true); } }}><Palette size={15} /><span>Customize</span></Button></div>

      <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}><DialogContent className="customize-dialog"><DialogHeader><DialogTitle>Create Custom Outfit</DialogTitle><DialogDescription>Select shirt, pants, and shoes to create your perfect outfit combination.</DialogDescription></DialogHeader><div className="outfit-form">{renderSlot('shirts', 'Shirt', '1')}{renderSlot('pants', 'Pants', '2')}{renderSlot('shoes', 'Shoes', '3')}</div>{errorMessage && <p className="upload-error" role="alert">{errorMessage}</p>}<div className="customize-actions"><Button variant="outline" className="preview-button" onClick={() => void handlePreview()} disabled={!hasCompleteSelection}><Eye size={16} /> Preview</Button><Button className="pink-button" onClick={() => void handleSave()} disabled={!hasCompleteSelection || isSaving}><Save size={16} /> {isSaving ? 'Saving…' : 'Save'}</Button></div></DialogContent></Dialog>
      <Dialog open={selectionSlot !== null} onOpenChange={(open) => { if (!open) setSelectionSlot(null); }}><DialogContent className="selection-dialog"><DialogHeader><DialogTitle>Select {selectionSlot === 'shirts' ? 'shirt or jacket' : selectionSlot ? categoryLabels[selectionSlot] : 'item'}</DialogTitle><DialogDescription>Choose one item from your wardrobe.</DialogDescription></DialogHeader><div className="selection-grid">{items.filter((item) => selectionSlot === 'shirts' ? item.category === 'shirts' || item.category === 'jackets' : item.category === selectionSlot).map((item) => <button className="selection-card" key={item.id} onClick={() => selectItem(item)}><ImageWithFallback src={item.image_url} alt={`${categoryLabels[item.category]} item`} /><span>{categoryLabels[item.category]}</span></button>)}{selectionSlot && items.every((item) => selectionSlot === 'shirts' ? item.category !== 'shirts' && item.category !== 'jackets' : item.category !== selectionSlot) && <p className="selection-empty">No {selectionSlot === 'shirts' ? 'shirts or jackets' : categoryLabels[selectionSlot].toLowerCase()} uploaded yet.</p>}</div></DialogContent></Dialog>
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}><DialogContent className="item-action-dialog"><DialogHeader><DialogTitle>Saved outfit</DialogTitle><DialogDescription>Preview this combined outfit image or remove it from your history.</DialogDescription></DialogHeader><div className="item-action-buttons"><Button className="pink-button" onClick={() => { if (selectedItem) setPreviewSource(selectedItem.image_url); setIsActionOpen(false); setIsPreviewOpen(true); }}>Preview</Button><Button variant="outline" className="delete-button" onClick={() => { setIsActionOpen(false); setIsDeleteOpen(true); }}><Trash2 size={16} /> Delete</Button></div></DialogContent></Dialog>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}><DialogContent className="confirm-dialog"><DialogHeader><DialogTitle>Delete this outfit?</DialogTitle><DialogDescription>This combined image will be permanently removed from your history.</DialogDescription></DialogHeader><div className="confirm-actions"><Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button><Button className="confirm-delete" onClick={() => void handleDelete()} disabled={isDeleting}>{isDeleting ? 'Deleting…' : 'Delete'}</Button></div></DialogContent></Dialog>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}><DialogContent className="outfit-preview-dialog"><DialogHeader><DialogTitle>Outfit Preview</DialogTitle><DialogDescription>Your shirt, pants, and shoes combined into one image.</DialogDescription></DialogHeader>{previewSource && <div className="outfit-preview-single"><ImageWithFallback src={previewSource} alt="Combined outfit preview" /></div>}</DialogContent></Dialog>
      <Dialog open={isRegisterPromptOpen} onOpenChange={setIsRegisterPromptOpen}><DialogContent className="register-prompt-dialog"><DialogHeader><DialogTitle>กรุณาลงทะเบียนก่อนใช้งาน</DialogTitle><DialogDescription>ฟีเจอร์ Customize จำเป็นต้องมีโปรไฟล์ที่ครบถ้วน<br />กรุณากรอกข้อมูลเพื่อเริ่มใช้งาน</DialogDescription></DialogHeader><Button className="pink-button register-prompt-cta" onClick={() => { setIsRegisterPromptOpen(false); onNeedProfile(); }}>Add profile</Button></DialogContent></Dialog>
    </div>
  );
}
