'use client';

import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { ArrowUpRight, Camera, UserRound } from 'lucide-react';
import { updateProfile } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { AsyncButton } from '@/components/async-button';
import { Notice } from '@/components/notice';

export function EditProfile() {
  const { user, setSession, token } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [medicalInfo, setMedicalInfo] = useState(user?.medicalInfo || '');
  const [heightCm, setHeightCm] = useState(user?.heightCm?.toString() || '');
  const [weightKg, setWeightKg] = useState(user?.weightKg?.toString() || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image to lightweight base64
  function handleAvatarFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file from your gallery.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setAvatarPreview(compressed);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess(false);

    try {
      const payload: any = {};
      if (heightCm) payload.heightCm = parseInt(heightCm, 10);
      if (weightKg) payload.weightKg = parseInt(weightKg, 10);
      if (medicalInfo) payload.medicalInfo = medicalInfo;
      if (avatarPreview && avatarPreview !== user?.avatarUrl) {
        payload.avatarUrl = avatarPreview;
      }

      const result = await updateProfile(payload);
      if (token) setSession(token, { ...user, ...result.user });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="profile-settings" onSubmit={onSubmit}>
      <div className="form-section-heading">
        <span>02</span>
        <div>
          <p className="eyebrow">PLAYER IDENTITY & BIOMETRICS</p>
          <h2>AVATAR & STATS</h2>
        </div>
      </div>
      
      {error && <Notice tone="warning">{error}</Notice>}
      {success && <Notice tone="success">Profile & biometrics updated successfully.</Notice>}

      {/* Avatar Gallery Upload */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', padding: '1rem', background: '#111', borderRadius: '12px' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #00f076', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', flexShrink: 0 }}>
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <UserRound size={32} color="#00f076" />
          )}
        </div>
        <div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleAvatarFile}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <Camera size={14} /> CHOOSE FROM GALLERY
          </button>
          <p style={{ fontSize: '0.72rem', color: '#888', marginTop: '4px' }}>Upload your baller picture (JPEG/PNG)</p>
        </div>
      </div>

      <div className="form-stack">
        <label className="field">
          <span>HEIGHT (CM)</span>
          <input 
            type="number" 
            min="100" max="250" 
            value={heightCm} 
            onChange={(e) => setHeightCm(e.target.value)} 
            placeholder="e.g. 180" 
          />
        </label>
        
        <label className="field">
          <span>WEIGHT (KG)</span>
          <input 
            type="number" 
            min="30" max="200" 
            value={weightKg} 
            onChange={(e) => setWeightKg(e.target.value)} 
            placeholder="e.g. 75" 
          />
        </label>

        <label className="field">
          <span>MEDICAL / INJURY HISTORY (OPTIONAL)</span>
          <textarea 
            rows={3}
            value={medicalInfo} 
            onChange={(e) => setMedicalInfo(e.target.value)} 
            placeholder="e.g. Recovering from ACL tear, asthmatic... (Only visible on your card)"
          />
        </label>
        
        <AsyncButton type="submit" variant="outline" busy={busy}>
          SAVE IDENTITY & BIOMETRICS <ArrowUpRight size={16} />
        </AsyncButton>
      </div>

      {user?.physicalHistory && user.physicalHistory.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>UPDATE HISTORY</p>
          <ul style={{ fontSize: '0.85rem', color: '#666', listStyle: 'none', padding: 0 }}>
            {user.physicalHistory.map((entry: any, i: number) => (
              <li key={i} style={{ borderBottom: '1px solid #eaeaea', padding: '0.5rem 0' }}>
                <strong>{new Date(entry.createdAt).toLocaleDateString()}</strong> - 
                Height: {entry.heightCm || '?'}cm, Weight: {entry.weightKg || '?'}kg
                {entry.medicalInfo && ` | Medical: ${entry.medicalInfo}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
