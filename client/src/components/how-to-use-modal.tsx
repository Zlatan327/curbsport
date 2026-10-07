'use client';

import { X, ShieldCheck, Trophy, AlertTriangle, Users, MapPin } from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToUseModal({ isOpen, onClose }: HowToUseModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(5px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#121212',
        border: '1px solid #222',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.5rem',
        color: '#fff',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: '#222',
            border: 'none',
            color: '#aaa',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <p className="eyebrow" style={{ color: '#00f076', marginBottom: '4px' }}>THE GROUND CODE</p>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          HOW TO PLAY ON INSIDE LIFE
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Rule 1 */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: '#1c281e', color: '#00f076', padding: '8px', borderRadius: '10px' }}>
              <MapPin size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px 0' }}>1. Find Your Campus Ground</h4>
              <p style={{ fontSize: '0.82rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
                Switch your school on your profile. See verified pitches, basketball courts, and live game statuses (<strong style={{ color: '#00f076' }}>LIVE</strong>, <strong style={{ color: '#eab308' }}>BUILDING</strong>, or <strong style={{ color: '#ef4444' }}>DRY</strong>).
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: '#1c281e', color: '#00f076', padding: '8px', borderRadius: '10px' }}>
              <Users size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px 0' }}>2. Rally or Join a Set</h4>
              <p style={{ fontSize: '0.82rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
                Never show up to an empty pitch. Create or join a Match Lobby with a live headcount so your squad knows when ball is flying.
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: '#1c281e', color: '#00f076', padding: '8px', borderRadius: '10px' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px 0' }}>3. Peer-Confirmed Stats</h4>
              <p style={{ fontSize: '0.82rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
                After 30+ minutes of ball, submit match results. To prevent fake numbers, <strong style={{ color: '#fff' }}>at least 2 opposing players</strong> must confirm the score before stats hit your permanent card.
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: '#1c281e', color: '#00f076', padding: '8px', borderRadius: '10px' }}>
              <Trophy size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px 0' }}>4. King of the Ground 👑</h4>
              <p style={{ fontSize: '0.82rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
                Dominate your home turf. The player with the highest confirmed position score is crowned <strong style={{ color: '#00f076' }}>King of the Ground</strong> on that pitch.
              </p>
            </div>
          </div>

          {/* Rule 5 */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: '#261214', padding: '0.85rem', borderRadius: '12px', border: '1px solid #4a1d21' }}>
            <div style={{ color: '#ef4444', padding: '4px' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px 0', color: '#ef4444' }}>5. The Slashing Law (Anti-Cheat)</h4>
              <p style={{ fontSize: '0.82rem', color: '#fca5a5', margin: 0, lineHeight: 1.4 }}>
                Submit fake goals or phantom games? 2 opponents can dispute and <strong style={{ textDecoration: 'underline' }}>SLASH</strong> you: <strong>-30 REP penalty</strong>, <strong>2x stat deduction</strong>, and a <strong>14-day Crown Ban</strong>!
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '1.5rem',
            padding: '0.75rem',
            background: '#00f076',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.85rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          I UNDERSTAND • ENTER THE GROUND
        </button>
      </div>
    </div>
  );
}
