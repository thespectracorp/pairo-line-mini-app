import { useEffect, useState } from 'react';
import { HelpCircle, Pencil, Settings, Share2, User } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ensureSession, supabase } from '../lib/supabase';

interface ProfileData {
  user_id: string;
  display_name: string;
  email: string;
}

const menuItems = [
  { label: 'Settings', subtitle: 'Preferences and account', icon: Settings },
  { label: 'Share App', subtitle: 'Tell your friends', icon: Share2 },
  { label: 'Help & Support', subtitle: 'Get assistance', icon: HelpCircle },
];

export function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData>({ user_id: '', display_name: 'Fashion Lover', email: '' });
  const [outfitCount, setOutfitCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('Fashion Lover');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await ensureSession();
        const user = await supabase.auth.getUser();
        if (user.error || !user.data.user) throw user.error ?? new Error('Could not identify user');
        const [{ data: profileData, error: profileError }, { data: items, error: itemsError }] = await Promise.all([
          supabase.from('profiles').select('user_id, display_name, email').eq('user_id', user.data.user.id).maybeSingle(),
          supabase.from('wardrobe_items').select('category'),
        ]);
        if (profileError || itemsError) throw profileError ?? itemsError;
        const nextProfile = profileData as ProfileData | null;
        const displayName = nextProfile?.display_name || 'Fashion Lover';
        const email = nextProfile?.email || '';
        setProfile(nextProfile ?? { user_id: user.data.user.id, display_name: displayName, email });
        setEditName(displayName);
        setEditEmail(email);
        setOutfitCount((items ?? []).filter((item) => item.category === 'outfits').length);
        setItemCount((items ?? []).filter((item) => item.category !== 'outfits').length);
      } catch (error) {
        console.error('profile load failed', error);
        setErrorMessage('Could not load your profile.');
      }
    };
    void loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    const displayName = editName.trim();
    const email = editEmail.trim();
    if (!displayName) {
      setErrorMessage('Please enter a name.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    try {
      const user = await supabase.auth.getUser();
      if (user.error || !user.data.user) throw user.error ?? new Error('Could not identify user');
      const { data, error } = await supabase.from('profiles').upsert({ user_id: user.data.user.id, display_name: displayName, email, updated_at: new Date().toISOString() }).select('user_id, display_name, email').maybeSingle();
      if (error || !data) throw error ?? new Error('Could not save profile');
      setProfile(data as ProfileData);
      setIsEditOpen(false);
    } catch (error) {
      console.error('profile save failed', error);
      setErrorMessage('Could not save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-screen screen">
      <header className="profile-header"><div><h1 className="screen-title">Profile</h1><p className="screen-subtitle">Manage your account and preferences</p></div></header>
      <div className="profile-content">
        <section className="profile-card">
          <div className="profile-info"><div className="profile-avatar"><User size={23} aria-hidden="true" /></div><div><p className="profile-name">{profile.display_name}</p><p className="profile-email">{profile.email || 'Add your email address'}</p></div><button className="profile-edit" onClick={() => { setErrorMessage(''); setIsEditOpen(true); }}><Pencil size={13} /> Edit</button></div>
          <div className="profile-stats"><div><p className="profile-stat-value">{outfitCount}</p><p className="profile-stat-label">Outfits Created</p></div><div><p className="profile-stat-value">{itemCount}</p><p className="profile-stat-label">Items Uploaded</p></div></div>
        </section>
        <div className="profile-menu">{menuItems.map(({ label, subtitle, icon: Icon }) => <button className="profile-menu-item" key={label}><span className="profile-menu-icon"><Icon size={18} /></span><span><p className="profile-menu-label">{label}</p><p className="profile-menu-subtitle">{subtitle}</p></span></button>)}</div>
        {errorMessage && <p className="screen-error" role="alert">{errorMessage}</p>}
        <p className="version">Pairo by Spectra v1.0.5</p>
      </div>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}><DialogContent className="profile-edit-dialog"><DialogHeader><DialogTitle>Edit profile</DialogTitle><DialogDescription>Update the name and email shown on your profile.</DialogDescription></DialogHeader><div className="profile-edit-form"><label htmlFor="profile-name">Name</label><input id="profile-name" value={editName} onChange={(event) => setEditName(event.target.value)} /><label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} /></div>{errorMessage && <p className="upload-error" role="alert">{errorMessage}</p>}<div className="confirm-actions"><Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button className="pink-button" onClick={() => void handleSaveProfile()} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button></div></DialogContent></Dialog>
    </div>
  );
}
