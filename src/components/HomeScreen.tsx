import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { LoaderCircle, Trash2, Upload, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { supabase } from '../lib/supabase';
import { getCustomerKey } from '../lib/customer';
import { deleteWardrobeItem, uploadWardrobeItem } from '../lib/wardrobeApi';
import { categoryLabels, type Category, type WardrobeItem } from '../types/wardrobe';

type CategoryFilter = 'All' | Category;
const categories: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'All', label: 'All' }, { id: 'shirts', label: 'Shirts' }, { id: 'jackets', label: 'Jackets' }, { id: 'pants', label: 'Pants' }, { id: 'shoes', label: 'Shoes' },
];
const uploadCategories: Category[] = ['shirts', 'jackets', 'pants', 'shoes'];

export function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customerKey, setCustomerKey] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const selectedFileUrl = useMemo(() => selectedFile ? URL.createObjectURL(selectedFile) : '', [selectedFile]);

  useEffect(() => () => {
    if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
  }, [selectedFileUrl]);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const key = await getCustomerKey();
        setCustomerKey(key);
        const { data, error } = await supabase.from('wardrobe_items').select('id, category, image_url, created_at').eq('customer_key', key).neq('category', 'outfits').order('created_at', { ascending: false });
        if (error) throw error;
        setItems((data ?? []) as WardrobeItem[]);
      } catch (error) {
        console.error('wardrobe load failed', error);
        setErrorMessage('Could not load your wardrobe. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadItems();
  }, []);

  const filteredItems = useMemo(() => activeCategory === 'All' ? items : items.filter((item) => item.category === activeCategory), [activeCategory, items]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrorMessage('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setSelectedFile(null);
      setErrorMessage('Please choose a JPG, PNG, or WebP image under 5 MB.');
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleUploadDialogChange = (open: boolean) => {
    setIsUploadOpen(open);
    if (!open) {
      clearSelectedFile();
      setSelectedCategory(null);
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedCategory) {
      setErrorMessage('Please choose an outfit type before uploading');
      return;
    }
    if (!selectedFile) {
      setErrorMessage('Choose or take an image first.');
      return;
    }
    setIsUploading(true);
    setErrorMessage('');
    try {
      const profileId = customerKey || await getCustomerKey();
      const item = await uploadWardrobeItem(selectedFile, selectedCategory, profileId);
      setCustomerKey(profileId);
      setItems((currentItems) => [item, ...currentItems]);
      setActiveCategory('All');
      handleUploadDialogChange(false);
    } catch (error) {
      console.error('wardrobe upload failed', error);
      setErrorMessage('Could not upload this image. Please try again.');
    } finally {
      setIsUploading(false);
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
      console.error('wardrobe delete failed', error);
      setErrorMessage('Could not delete this image. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openItemActions = (item: WardrobeItem) => { setSelectedItem(item); setIsActionOpen(true); };

  return (
    <div className="wardrobe-screen screen">
      <header className="wardrobe-header"><h1 className="screen-title">Wardrobe</h1></header>
      <div className="wardrobe-tabs" role="tablist">{categories.map((category) => <button key={category.id} role="tab" aria-selected={activeCategory === category.id} onClick={() => setActiveCategory(category.id)} className={`wardrobe-tab ${activeCategory === category.id ? 'active' : ''}`}>{category.label}</button>)}</div>
      <div className="content-scroll">
        {isLoading ? <div className="empty-state"><LoaderCircle className="animate-spin" size={24} /><span>Loading wardrobe</span></div> : filteredItems.length === 0 ? <div className="empty-state"><span>{activeCategory === 'All' ? 'Your wardrobe is empty.' : `No ${categoryLabels[activeCategory]} yet.`}</span></div> : <div className="wardrobe-grid">{filteredItems.map((item) => <button className="wardrobe-card" key={item.id} onClick={() => openItemActions(item)} aria-label={`Open ${categoryLabels[item.category]} item`}><ImageWithFallback src={item.image_url} alt={`${categoryLabels[item.category]} item`} /></button>)}</div>}
      </div>
      {errorMessage && <p className="screen-error" role="alert">{errorMessage}</p>}
      <div className="bottom-action"><Dialog open={isUploadOpen} onOpenChange={handleUploadDialogChange}><DialogTrigger asChild><Button className="pink-button"><Upload size={16} /> <span>Upload outfit</span></Button></DialogTrigger><DialogContent className="upload-dialog"><DialogHeader><DialogTitle>Upload Your Clothes</DialogTitle><DialogDescription>Choose an outfit type and add a photo of your clothes.</DialogDescription></DialogHeader><div className="upload-form"><fieldset><legend>Select outfit type <span className="required-mark">*</span>:</legend><RadioGroup value={selectedCategory ?? ''} onValueChange={(value) => setSelectedCategory(value as Category)}>{uploadCategories.map((category) => <div className="upload-option" key={category}><RadioGroupItem value={category} id={`upload-${category}`} /><Label htmlFor={`upload-${category}`}>{categoryLabels[category]}</Label></div>)}</RadioGroup></fieldset>{selectedFile ? <div className="selected-upload"><img src={selectedFileUrl} alt="Selected clothing preview" /><div className="selected-upload-info"><strong>Ready to upload</strong><span>{selectedFile.name}</span><small>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</small></div><button type="button" className="selected-upload-remove" onClick={clearSelectedFile} aria-label="Remove selected image"><X size={16} /></button></div> : <button type="button" className="single-upload-trigger" onClick={() => photoInputRef.current?.click()}><Upload size={30} /><span>Add a photo</span><small>Choose a photo from your device</small></button>}<input ref={photoInputRef} type="file" accept="image/*" onChange={handleFileChange} />{errorMessage && <p className="upload-error" role="alert">{errorMessage}</p>}<Button type="button" className="pink-button upload-submit" onClick={() => void handleUpload()} disabled={isUploading || !selectedFile}>{isUploading ? 'Uploading…' : 'Upload'}</Button></div></DialogContent></Dialog></div>

      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}><DialogContent className="item-action-dialog"><DialogHeader><DialogTitle>What would you like to do?</DialogTitle><DialogDescription>Preview this wardrobe item or remove it from your collection.</DialogDescription></DialogHeader><div className="item-action-buttons"><Button className="pink-button" onClick={() => { setIsActionOpen(false); setIsPreviewOpen(true); }}>Preview</Button><Button variant="outline" className="delete-button" onClick={() => { setIsActionOpen(false); setIsDeleteOpen(true); }}><Trash2 size={16} /> Delete</Button></div></DialogContent></Dialog>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}><DialogContent className="confirm-dialog"><DialogHeader><DialogTitle>Delete this item?</DialogTitle><DialogDescription>This photo will be permanently removed from your wardrobe.</DialogDescription></DialogHeader><div className="confirm-actions"><Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button><Button className="confirm-delete" onClick={() => void handleDelete()} disabled={isDeleting}>{isDeleting ? 'Deleting…' : 'Delete'}</Button></div></DialogContent></Dialog>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}><DialogContent className="preview-dialog"><DialogHeader><DialogTitle>Preview</DialogTitle></DialogHeader>{selectedItem && <div className="preview-image"><ImageWithFallback src={selectedItem.image_url} alt="Wardrobe preview" /></div>}</DialogContent></Dialog>
    </div>
  );
}
