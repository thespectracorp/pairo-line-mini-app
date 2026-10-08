import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Camera, FileImage, LoaderCircle, Trash2, Upload, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { supabase } from '../lib/supabase';
import { getCustomerKey } from '../lib/customer';
import { categoryLabels, type Category, type WardrobeItem } from '../types/wardrobe';

type CategoryFilter = 'All' | Category;
const categories: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'All', label: 'All' }, { id: 'shirts', label: 'Shirts' }, { id: 'jackets', label: 'Jackets' }, { id: 'pants', label: 'Pants' }, { id: 'shoes', label: 'Shoes' },
];
const uploadCategories: Category[] = ['shirts', 'jackets', 'pants', 'shoes'];

export function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [selectedCategory, setSelectedCategory] = useState<Category>('shirts');
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const browseInputRef = useRef<HTMLInputElement>(null);

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
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (browseInputRef.current) browseInputRef.current.value = '';
  };

  const handleUploadDialogChange = (open: boolean) => {
    setIsUploadOpen(open);
    if (!open) {
      clearSelectedFile();
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Choose or take an image first.');
      return;
    }
    setIsUploading(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', selectedCategory);
      formData.append('customer_key', customerKey || await getCustomerKey());
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-wardrobe-image`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('upload failed');
      const result = await response.json() as { item?: WardrobeItem };
      if (!result.item) throw new Error('invalid response');
      setItems((currentItems) => [result.item!, ...currentItems]);
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-wardrobe-image`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedItem.id, customer_key: customerKey || await getCustomerKey() }) });
      if (!response.ok) throw new Error('delete failed');
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
      <div className="bottom-action"><Dialog open={isUploadOpen} onOpenChange={handleUploadDialogChange}><DialogTrigger asChild><Button className="pink-button"><Upload size={16} /> <span>Upload outfit</span></Button></DialogTrigger><DialogContent className="upload-dialog"><DialogHeader><DialogTitle>Upload Your Clothes</DialogTitle><DialogDescription>Choose how you want to add a photo of your clothes.</DialogDescription></DialogHeader><div className="upload-form"><fieldset><legend>Select outfit type:</legend><RadioGroup value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Category)}>{uploadCategories.map((category) => <div className="upload-option" key={category}><RadioGroupItem value={category} id={`upload-${category}`} /><Label htmlFor={`upload-${category}`}>{categoryLabels[category]}</Label></div>)}</RadioGroup></fieldset>{selectedFile ? <div className="selected-upload"><img src={selectedFileUrl} alt="Selected clothing preview" /><div className="selected-upload-info"><strong>Ready to upload</strong><span>{selectedFile.name}</span><small>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</small></div><button type="button" className="selected-upload-remove" onClick={clearSelectedFile} aria-label="Remove selected image"><X size={16} /></button></div> : <div className="upload-methods"><button type="button" className="upload-method" onClick={() => cameraInputRef.current?.click()}><Camera size={24} /><span>Take photo</span><small>Use your camera</small></button><button type="button" className="upload-method" onClick={() => fileInputRef.current?.click()}><Upload size={24} /><span>Upload photo</span><small>Choose from Photos</small></button><button type="button" className="upload-method" onClick={() => browseInputRef.current?.click()}><FileImage size={24} /><span>Browse files</span><small>Search Files</small></button><input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} /><input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} /><input ref={browseInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} /></div>}{errorMessage && <p className="upload-error" role="alert">{errorMessage}</p>}<Button type="button" className="pink-button upload-submit" onClick={() => void handleUpload()} disabled={isUploading || !selectedFile}>{isUploading ? 'Uploading…' : selectedFile ? 'Upload this photo' : 'Select a photo first'}</Button></div></DialogContent></Dialog></div>

      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}><DialogContent className="item-action-dialog"><DialogHeader><DialogTitle>What would you like to do?</DialogTitle><DialogDescription>Preview this wardrobe item or remove it from your collection.</DialogDescription></DialogHeader><div className="item-action-buttons"><Button className="pink-button" onClick={() => { setIsActionOpen(false); setIsPreviewOpen(true); }}>Preview</Button><Button variant="outline" className="delete-button" onClick={() => { setIsActionOpen(false); setIsDeleteOpen(true); }}><Trash2 size={16} /> Delete</Button></div></DialogContent></Dialog>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}><DialogContent className="confirm-dialog"><DialogHeader><DialogTitle>Delete this item?</DialogTitle><DialogDescription>This photo will be permanently removed from your wardrobe.</DialogDescription></DialogHeader><div className="confirm-actions"><Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button><Button className="confirm-delete" onClick={() => void handleDelete()} disabled={isDeleting}>{isDeleting ? 'Deleting…' : 'Delete'}</Button></div></DialogContent></Dialog>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}><DialogContent className="preview-dialog"><DialogHeader><DialogTitle>Preview</DialogTitle></DialogHeader>{selectedItem && <div className="preview-image"><ImageWithFallback src={selectedItem.image_url} alt="Wardrobe preview" /></div>}</DialogContent></Dialog>
    </div>
  );
}
