import { useEffect, useState } from 'react';
import { HelpCircle, Pencil, Share2, User } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { supabase } from '../lib/supabase';
import { getCustomerKey } from '../lib/customer';

interface ProfileData {
  user_id: string;
  display_name: string;
  email: string;
  age: number | null;
  gender: string;
  height_cm: number | null;
  weight_kg: number | null;
  terms_accepted: boolean;
  personalization_consent: boolean;
}

const emptyProfile: ProfileData = {
  user_id: '',
  display_name: 'Fashion Lover',
  email: '',
  age: null,
  gender: '',
  height_cm: null,
  weight_kg: null,
  terms_accepted: false,
  personalization_consent: false,
};

const menuItems = [
  { label: 'Share App', subtitle: 'Tell your friends', icon: Share2 },
  { label: 'Help & Support', subtitle: 'Get assistance', icon: HelpCircle },
];

const shareTargets = [
  { label: 'LINE Chat', href: `https://line.me/R/msg/text/?${encodeURIComponent('xxxxxx')}` },
  { label: 'Instagram Chat', href: 'https://www.instagram.com/direct/inbox/' },
  { label: 'Facebook Chat', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('xxxxxx')}` },
];

interface ProfileScreenProps {
  openEditOnMount?: boolean;
  onProfileSaved?: () => void;
}

export function ProfileScreen({ openEditOnMount = false, onProfileSaved }: ProfileScreenProps) {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [outfitCount, setOutfitCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [editName, setEditName] = useState('Fashion Lover');
  const [editEmail, setEditEmail] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [personalizationConsent, setPersonalizationConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customerKey, setCustomerKey] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const key = await getCustomerKey();
        setCustomerKey(key);
        const [{ data: profileData, error: profileError }, { data: items, error: itemsError }] = await Promise.all([
          supabase.from('app_profile').select('id, display_name, email, age, gender, height_cm, weight_kg, terms_accepted, personalization_consent').eq('id', key).maybeSingle(),
          supabase.from('wardrobe_items').select('category').eq('customer_key', key),
        ]);
        if (profileError || itemsError) throw profileError ?? itemsError;
        const nextProfile = profileData as (Omit<ProfileData, 'user_id'> & { id: string }) | null;
        const displayName = nextProfile?.display_name || 'Fashion Lover';
        const email = nextProfile?.email || '';
        setProfile(nextProfile ? { user_id: nextProfile.id, display_name: displayName, email, age: nextProfile.age ?? null, gender: nextProfile.gender || '', height_cm: nextProfile.height_cm ?? null, weight_kg: nextProfile.weight_kg ?? null, terms_accepted: Boolean(nextProfile.terms_accepted), personalization_consent: Boolean(nextProfile.personalization_consent) } : { ...emptyProfile, user_id: key });
        setEditName(displayName);
        setEditEmail(email);
        setEditAge(nextProfile?.age?.toString() || '');
        setEditGender(nextProfile?.gender || '');
        setEditHeight(nextProfile?.height_cm?.toString() || '');
        setEditWeight(nextProfile?.weight_kg?.toString() || '');
        setTermsAccepted(Boolean(nextProfile?.terms_accepted));
        setPersonalizationConsent(Boolean(nextProfile?.personalization_consent));
        setOutfitCount((items ?? []).filter((item) => item.category === 'outfits').length);
        setItemCount((items ?? []).filter((item) => item.category !== 'outfits').length);
      } catch (error) {
        console.error('profile load failed', error);
        setErrorMessage('Could not load your profile.');
      } finally {
        setProfileLoaded(true);
      }
    };
    void loadProfile();
  }, []);

  useEffect(() => {
    if (openEditOnMount && profileLoaded) {
      setErrorMessage('');
      setIsEditOpen(true);
    }
  }, [openEditOnMount, profileLoaded]);

  const openEditProfile = () => {
    setErrorMessage('');
    setEditName(profile.display_name);
    setEditEmail(profile.email);
    setEditAge(profile.age?.toString() || '');
    setEditGender(profile.gender);
    setEditHeight(profile.height_cm?.toString() || '');
    setEditWeight(profile.weight_kg?.toString() || '');
    setTermsAccepted(profile.terms_accepted);
    setPersonalizationConsent(profile.personalization_consent);
    setIsEditOpen(true);
  };

  const handleSaveProfile = async () => {
    const displayName = editName.trim();
    const email = editEmail.trim();
    const age = Number(editAge);
    const height = editHeight.trim() ? Number(editHeight) : null;
    const weight = editWeight.trim() ? Number(editWeight) : null;
    if (!displayName) return setErrorMessage('Please enter your name.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErrorMessage('Please enter a valid email address.');
    if (!editAge.trim() || !Number.isInteger(age) || age < 1 || age > 120) return setErrorMessage('Please enter a valid age.');
    if (!editGender) return setErrorMessage('Please select your gender.');
    if (height !== null && (!Number.isFinite(height) || height <= 0)) return setErrorMessage('Please enter a valid height.');
    if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) return setErrorMessage('Please enter a valid weight.');
    if (!termsAccepted) return setErrorMessage('Please accept the Terms of Service and Privacy Policy.');
    if (!personalizationConsent) return setErrorMessage('Please accept the personalization consent.');

    setIsSaving(true);
    setErrorMessage('');
    try {
      const key = customerKey || await getCustomerKey();
      const savedAt = new Date().toISOString();
      const { error } = await supabase.from('app_profile').upsert({ id: key, display_name: displayName, email, age, gender: editGender, height_cm: height, weight_kg: weight, terms_accepted: true, personalization_consent: true, consent_recorded_at: savedAt, updated_at: savedAt });
      if (error) throw error;
      setCustomerKey(key);
      setProfile({ user_id: key, display_name: displayName, email, age, gender: editGender, height_cm: height, weight_kg: weight, terms_accepted: true, personalization_consent: true });
      setIsEditOpen(false);
      onProfileSaved?.();
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
          <div className="profile-info"><div className="profile-avatar"><User size={23} aria-hidden="true" /></div><div><p className="profile-name">{profile.display_name}</p><p className="profile-email">{profile.email || 'Add your email address'}</p></div><button className="profile-edit" onClick={openEditProfile}><Pencil size={13} /> Edit</button></div>
          <div className="profile-stats"><div><p className="profile-stat-value">{outfitCount}</p><p className="profile-stat-label">Outfits Created</p></div><div><p className="profile-stat-value">{itemCount}</p><p className="profile-stat-label">Items Uploaded</p></div></div>
        </section>
        <div className="profile-menu">{menuItems.map(({ label, subtitle, icon: Icon }) => <button className="profile-menu-item" key={label} onClick={() => label === 'Share App' ? setIsShareOpen(true) : setIsHelpOpen(true)}><span className="profile-menu-icon"><Icon size={18} /></span><span><p className="profile-menu-label">{label}</p><p className="profile-menu-subtitle">{subtitle}</p></span></button>)}</div>
        {errorMessage && <p className="screen-error" role="alert">{errorMessage}</p>}
        <p className="version">Pairo by Spectra v.1.2.1</p>
      </div>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="profile-edit-dialog">
          <DialogHeader><DialogTitle>Edit profile</DialogTitle><DialogDescription>Update your profile details and consent preferences.</DialogDescription></DialogHeader>
          <div className="profile-edit-form">
            <label htmlFor="profile-name">Name <span className="required-mark">*</span></label>
            <input id="profile-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
            <label htmlFor="profile-email">Email <span className="required-mark">*</span></label>
            <input id="profile-email" type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
            <label htmlFor="profile-age">Age <span className="required-mark">*</span></label>
            <input id="profile-age" type="number" min="1" max="120" value={editAge} onChange={(event) => setEditAge(event.target.value)} />
            <label htmlFor="profile-gender">Gender <span className="required-mark">*</span></label>
            <select id="profile-gender" value={editGender} onChange={(event) => setEditGender(event.target.value)}><option value="">Select gender</option><option value="female">Female</option><option value="male">Male</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select>
            <label htmlFor="profile-height">Height (cm) <span className="optional-mark">Optional</span></label>
            <input id="profile-height" type="number" min="1" step="0.1" value={editHeight} onChange={(event) => setEditHeight(event.target.value)} />
            <label htmlFor="profile-weight">Weight (kg) <span className="optional-mark">Optional</span></label>
            <input id="profile-weight" type="number" min="1" step="0.1" value={editWeight} onChange={(event) => setEditWeight(event.target.value)} />
          </div>
          <div className="profile-consents">
            <label className="consent-option"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><span>I accept <button type="button" className="terms-link" onClick={() => setIsTermsOpen(true)}>the Terms of Service and Privacy Policy</button> to save my profile and use the application. <span className="required-mark">*</span></span></label>
            <label className="consent-option"><input type="checkbox" checked={personalizationConsent} onChange={(event) => setPersonalizationConsent(event.target.checked)} /><span>I consent to the application collecting and using my profile information, such as style preferences and birthday, for personalized styling recommendations, benefits, articles, and special promotions through LINE. <span className="required-mark">*</span></span></label>
          </div>
          {errorMessage && <p className="upload-error" role="alert">{errorMessage}</p>}
          <div className="confirm-actions"><Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button className="pink-button" onClick={() => void handleSaveProfile()} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button></div>
        </DialogContent>
      </Dialog>
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}><DialogContent className="support-dialog"><DialogHeader><DialogTitle>Help & Support</DialogTitle><DialogDescription>We are here to help.</DialogDescription></DialogHeader><div className="support-contact"><span>Email</span><a href="mailto:thespectracorp@gmail.com">thespectracorp@gmail.com</a></div></DialogContent></Dialog>
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}><DialogContent className="share-dialog"><DialogHeader><DialogTitle>Share App</DialogTitle><DialogDescription>Choose a platform to share Pairo.</DialogDescription></DialogHeader><div className="share-link-preview">xxxxxx</div><div className="share-target-list">{shareTargets.map((target) => <button type="button" key={target.label} onClick={() => window.open(target.href, '_blank', 'noopener,noreferrer')}><Share2 size={17} /><span>{target.label}</span></button>)}</div></DialogContent></Dialog>
      <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DialogContent className="terms-dialog"><DialogHeader><DialogTitle>Terms of Service and Privacy Policy</DialogTitle><DialogDescription>Effective date: 9 October 2026 · The Spectra Corp</DialogDescription></DialogHeader><div className="terms-content"><h3>1. Terms of Service</h3><h4>Acceptance</h4><p>By accessing and using this application, you confirm that you have read, understood, and agreed to these terms. If you do not agree, please stop using the application.</p><h4>Service scope</h4><p>This application provides tools for storing personal clothing images, matching outfits, and styling recommendations.</p><h4>User content</h4><p>You retain ownership of your photos and personal information. You allow us to process them only to display, categorize, and provide features within the application.</p><h3>2. Privacy Policy</h3><p>We may collect profile information, style preferences, clothing photos, usage information, and LINE User ID to provide and improve the service.</p><p>When you provide marketing consent, we may use your information to send personalized styling recommendations, benefits, articles, and promotions through LINE.</p><h3>3. Your rights</h3><p>You may withdraw consent, access or request a copy of your personal information, request deletion, and ask us to correct inaccurate information.</p><h3>4. Contact</h3><p>For questions or PDPA requests, contact thespectracorp@gmail.com</p></div></DialogContent>
      </Dialog>
    </div>
  );
}
