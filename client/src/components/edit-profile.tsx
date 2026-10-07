'use client';

import { useState, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
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
        <span>03</span>
        <div>
          <p className="eyebrow">PHYSICAL & MEDICAL</p>
          <h2>PLAYER BIOMETRICS</h2>
        </div>
      </div>
      
      {error && <Notice tone="warning">{error}</Notice>}
      {success && <Notice tone="success">Biometrics updated successfully.</Notice>}

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
          UPDATE BIOMETRICS <ArrowUpRight size={16} />
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
