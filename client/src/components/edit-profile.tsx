'use client';

import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { ArrowUpRight, Camera, UserRound } from 'lucide-react';
import { updateProfile } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { AsyncButton } from '@/components/async-button';
import { Notice } from '@/components/notice';
import type { FootballPosition, BasketballPosition, SportType } from '@/lib/types';

const FOOTBALL_POSITIONS: FootballPosition[] = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
const BASKETBALL_POSITIONS: BasketballPosition[] = ['GUARD', 'FORWARD', 'CENTER'];

export function EditProfile() {
  const { user, setSession, token } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Primary Sport & Positions
  const [primarySport, setPrimarySport] = useState<SportType>((user?.primarySport as SportType) || 'FOOTBALL');
  const [footballPos, setFootballPos] = useState<FootballPosition | ''>((user?.footballPosition as FootballPosition) || '');
  const [basketballPos, setBasketballPos] = useState<BasketballPosition | ''>((user?.basketballPosition as BasketballPosition) || '');

  // Height (supports CM or FT/IN)
  const initialCm = user?.heightCm || 0;
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightCm, setHeightCm] = useState(initialCm ? initialCm.toString() : '');
  const [heightFeet, setHeightFeet] = useState(initialCm ? Math.floor(initialCm / 30.48).toString() : '5');
  const [heightInches, setHeightInches] = useState(initialCm ? Math.round((initialCm % 30.48) / 2.54).toString() : '10');

  // Weight & Medical
  const [weightKg, setWeightKg] = useState(user?.weightKg?.toString() || '');
  const [medicalInfo, setMedicalInfo] = useState(user?.medicalInfo || '');

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image from gallery to lightweight base64
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

  // Handle Height Unit Change
  function handleHeightUnitToggle(unit: 'cm' | 'ft') {
    if (unit === 'ft' && heightCm) {
      const cmVal = parseFloat(heightCm);
      if (!isNaN(cmVal) && cmVal > 0) {
        const totalInches = cmVal / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        setHeightFeet(ft.toString());
        setHeightInches(inch.toString());
      }
    } else if (unit === 'cm' && heightFeet) {
      const ftVal = parseFloat(heightFeet) || 0;
      const inVal = parseFloat(heightInches) || 0;
      const computedCm = Math.round((ftVal * 12 + inVal) * 2.54);
      if (computedCm > 0) setHeightCm(computedCm.toString());
    }
    setHeightUnit(unit);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess(false);

    try {
      const payload: any = {
        primarySport,
      };

      if (footballPos) payload.footballPosition = footballPos;
      if (basketballPos) payload.basketballPosition = basketballPos;

      // Compute Height in CM
      let finalCm: number | undefined;
      if (heightUnit === 'cm' && heightCm) {
        finalCm = parseInt(heightCm, 10);
      } else if (heightUnit === 'ft' && heightFeet) {
        const ft = parseInt(heightFeet, 10) || 0;
        const inch = parseInt(heightInches, 10) || 0;
        finalCm = Math.round((ft * 12 + inch) * 2.54);
      }

      if (finalCm && !isNaN(finalCm)) {
        if (finalCm < 100 || finalCm > 250) {
          throw new Error('Height must be between 100cm (3ft 3in) and 250cm (8ft 2in).');
        }
        payload.heightCm = finalCm;
      }

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
          <h2>AVATAR, SPORT & STATS</h2>
        </div>
      </div>
      
      {error && <Notice tone="warning">{error}</Notice>}
      {success && <Notice tone="success">Profile & permanent positions saved!</Notice>}

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
        {/* Primary Sport Preference (Noise Filter) */}
        <label className="field">
          <span>PRIMARY SPORT (FILTERS OUT OTHER SPORTS NOISE)</span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setPrimarySport('FOOTBALL')}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '8px',
                border: primarySport === 'FOOTBALL' ? '2px solid #00f076' : '1px solid #333',
                background: primarySport === 'FOOTBALL' ? '#00381b' : '#1a1a1a',
                color: '#fff',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: primarySport === 'FOOTBALL' ? 700 : 400
              }}
            >
              ⚽ Football Only
            </button>
            <button
              type="button"
              onClick={() => setPrimarySport('BASKETBALL')}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '8px',
                border: primarySport === 'BASKETBALL' ? '2px solid #00f076' : '1px solid #333',
                background: primarySport === 'BASKETBALL' ? '#00381b' : '#1a1a1a',
                color: '#fff',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: primarySport === 'BASKETBALL' ? 700 : 400
              }}
            >
              🏀 Basketball Only
            </button>
          </div>
        </label>

        {/* Permanent Football Position */}
        <label className="field">
          <span>PERMANENT FOOTBALL POSITION</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '6px' }}>
            {FOOTBALL_POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setFootballPos(pos)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: footballPos === pos ? '1px solid #00f076' : '1px solid #333',
                  background: footballPos === pos ? '#004724' : '#1a1a1a',
                  color: '#fff',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {pos}
              </button>
            ))}
          </div>
        </label>

        {/* Permanent Basketball Position */}
        <label className="field">
          <span>PERMANENT BASKETBALL POSITION</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
            {BASKETBALL_POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setBasketballPos(pos)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: basketballPos === pos ? '1px solid #00f076' : '1px solid #333',
                  background: basketballPos === pos ? '#004724' : '#1a1a1a',
                  color: '#fff',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {pos}
              </button>
            ))}
          </div>
        </label>

        {/* Height (CM or FT/IN) */}
        <label className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>HEIGHT</span>
            <div style={{ display: 'flex', gap: '4px', background: '#222', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => handleHeightUnitToggle('cm')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: heightUnit === 'cm' ? '#00f076' : 'transparent',
                  color: heightUnit === 'cm' ? '#000' : '#888',
                  cursor: 'pointer'
                }}
              >
                CM
              </button>
              <button
                type="button"
                onClick={() => handleHeightUnitToggle('ft')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: heightUnit === 'ft' ? '#00f076' : 'transparent',
                  color: heightUnit === 'ft' ? '#000' : '#888',
                  cursor: 'pointer'
                }}
              >
                FT / IN
              </button>
            </div>
          </div>

          {heightUnit === 'cm' ? (
            <input 
              type="number" 
              min="100" max="250" 
              value={heightCm} 
              onChange={(e) => setHeightCm(e.target.value)} 
              placeholder="e.g. 183" 
            />
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="number" 
                  min="3" max="8" 
                  value={heightFeet} 
                  onChange={(e) => setHeightFeet(e.target.value)} 
                  placeholder="6" 
                />
                <span style={{ fontSize: '0.8rem', color: '#888' }}>FT</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="number" 
                  min="0" max="11" 
                  value={heightInches} 
                  onChange={(e) => setHeightInches(e.target.value)} 
                  placeholder="0" 
                />
                <span style={{ fontSize: '0.8rem', color: '#888' }}>IN</span>
              </div>
            </div>
          )}
        </label>
        
        {/* Weight */}
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

        {/* Medical / Injury */}
        <label className="field">
          <span>MEDICAL / INJURY HISTORY (OPTIONAL)</span>
          <textarea 
            rows={2}
            value={medicalInfo} 
            onChange={(e) => setMedicalInfo(e.target.value)} 
            placeholder="e.g. Recovering from ACL strain, asthmatic... (Private on your card)"
          />
        </label>
        
        <AsyncButton type="submit" variant="outline" busy={busy}>
          SAVE IDENTITY & POSITIONS <ArrowUpRight size={16} />
        </AsyncButton>
      </div>

      {user?.physicalHistory && user.physicalHistory.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>BIOMETRIC UPDATE HISTORY</p>
          <ul style={{ fontSize: '0.85rem', color: '#666', listStyle: 'none', padding: 0 }}>
            {user.physicalHistory.map((entry: any, i: number) => {
              const cm = entry.heightCm;
              const ft = cm ? Math.floor(cm / 30.48) : null;
              const inch = cm ? Math.round((cm % 30.48) / 2.54) : null;
              const ftStr = ft !== null ? `${ft}'${inch}"` : '';

              return (
                <li key={i} style={{ borderBottom: '1px solid #222', padding: '0.5rem 0' }}>
                  <strong style={{ color: '#aaa' }}>{new Date(entry.createdAt).toLocaleDateString()}</strong> —{' '}
                  Height: {cm ? `${cm}cm (${ftStr})` : '?'} • Weight: {entry.weightKg ? `${entry.weightKg}kg` : '?'}
                  {entry.medicalInfo && ` • Note: ${entry.medicalInfo}`}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </form>
  );
}
