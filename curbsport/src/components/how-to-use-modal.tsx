'use client';

import { X, ShieldCheck, Trophy, AlertTriangle, Users, MapPin, Swords, Sparkles, CheckCircle2 } from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToUseModal({ isOpen, onClose }: HowToUseModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#111411',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
          color: '#fff',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(34, 197, 94, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-use-title"
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.1rem',
            right: '1.1rem',
            background: '#1f241f',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#aaa',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <p className="eyebrow" style={{ color: '#22c55e', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} /> THE CAMPUS GROUND PLAYBOOK
        </p>
        <h2 id="how-to-use-title" style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          HOW PICKUP WORKS
        </h2>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
          Fast, stress-free, and community-verified. Here is everything you need to pull up and dominate your campus courts and pitches.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            <div style={{ background: '#142918', color: '#22c55e', padding: '9px', borderRadius: '10px', flexShrink: 0 }}>
              <MapPin size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 3px 0', textTransform: 'uppercase' }}>
                1. Ground Radar & Ball Beacon
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                Check if your spot is <strong style={{ color: '#22c55e' }}>LIVE</strong>, <strong style={{ color: '#eab308' }}>BUILDING</strong>, or <strong style={{ color: '#94a3b8' }}>DRY</strong>. Hold a ball? Tap <strong>&quot;I dey ground with ball&quot;</strong> on any pitch card to beacon the entire campus that match equipment is live (+10 REP).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            <div style={{ background: '#142918', color: '#22c55e', padding: '9px', borderRadius: '10px', flexShrink: 0 }}>
              <Swords size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 3px 0', textTransform: 'uppercase' }}>
                2. Rally Sets & Auto-Balance Lineups
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                Post or join match lobbies so nobody arrives to an empty spot. Avoid 20-minute picking arguments — tap <strong>⚡ Balance Squads</strong> to instantly split into fair Team A vs Team B lineups (Shirt vs No-Shirt or White vs Dark) and copy to WhatsApp with one click.
              </p>
            </div>
          </div>

          {/* Step 3 - THE KEY STRESS-FREE STAT HIGHLIGHT */}
          <div style={{
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'flex-start',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(17, 24, 17, 0.8) 100%)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(34, 197, 94, 0.35)',
          }}>
            <div style={{ background: '#22c55e', color: '#000', padding: '9px', borderRadius: '10px', flexShrink: 0 }}>
              <Trophy size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 3px 0', textTransform: 'uppercase', color: '#4ade80' }}>
                3. Stress-Free Stats (Takes 30 Seconds)
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#e2e8f0', margin: 0, lineHeight: 1.45 }}>
                <strong>Don&apos;t stress counting every play during the match!</strong> After the game, the host or any baller simply taps who scored goals/points, taps <strong>🛡️ CS</strong> for defenders/keepers, or selects <strong>MVP ⭐</strong>.
              </p>
              <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#86efac', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={13} />
                <span>Played a casual run with no score kept? Just submit the set and <strong>everyone earns +15 REP</strong>!</span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            <div style={{ background: '#142918', color: '#22c55e', padding: '9px', borderRadius: '10px', flexShrink: 0 }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 3px 0', textTransform: 'uppercase' }}>
                4. Peer Confirmation & King of the Ground 👑
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                At least 2 players from the set confirm the result before stats hit permanent cards. The baller with the highest confirmed position score is crowned <strong>King of the Ground</strong>. Positions reflect strikers, playmakers, defenders, keepers, guards, and centers.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', background: '#221113', padding: '10px 12px', borderRadius: '10px', border: '1px solid #4a1d21' }}>
            <div style={{ color: '#ef4444', padding: '2px', flexShrink: 0 }}>
              <AlertTriangle size={17} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 2px 0', color: '#f87171', textTransform: 'uppercase' }}>
                5. The Slashing Law (Zero Tolerance For Fake Stats)
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#fca5a5', margin: 0, lineHeight: 1.35 }}>
                Submit phantom sets or fake goals? Opponents can dispute and <strong>SLASH</strong> you: <strong>-30 REP penalty</strong>, <strong>2x stat deduction</strong>, and a <strong>14-day Crown Ban</strong>.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '1.25rem',
            padding: '0.85rem',
            background: '#22c55e',
            color: '#000',
            fontWeight: 900,
            fontSize: '0.88rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4ade80')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#22c55e')}
        >
          GOT IT • ENTER THE GROUND
        </button>
      </div>
    </div>
  );
}
