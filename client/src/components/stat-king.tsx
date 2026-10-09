'use client';

import { useEffect, useState } from 'react';
import { Crown, AlertTriangle } from 'lucide-react';
import { getLeaderboard } from '@/lib/api';
import type { LeaderboardEntry, SportType } from '@/lib/types';

interface StatKingProps {
  pitchId: string;
  isDemo?: boolean;
  sportType?: SportType;
}

export function StatKing({ pitchId, isDemo, sportType }: StatKingProps) {
  const [sport, setSport] = useState<SportType>(sportType || 'FOOTBALL');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sportType) {
      setSport(sportType);
    }
  }, [sportType]);

  useEffect(() => {
    if (isDemo || !pitchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    getLeaderboard(pitchId, sport)
      .then(setLeaderboard)
      .catch((err) => setError(err.message || 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [pitchId, sport, isDemo]);

  const king = leaderboard.find((entry) => entry.isKing);
  const isBball = sport === 'BASKETBALL';

  return (
    <div className="stat-king-section">
      {/* Only show manual toggle if pitch does not have a dedicated sport type */}
      {!sportType && (
        <div className="stat-king__sport-toggle">
          <button
            type="button"
            className={sport === 'FOOTBALL' ? 'is-active' : ''}
            onClick={() => setSport('FOOTBALL')}
          >
            ⚽ Football
          </button>
          <button
            type="button"
            className={sport === 'BASKETBALL' ? 'is-active' : ''}
            onClick={() => setSport('BASKETBALL')}
          >
            🏀 Basketball
          </button>
        </div>
      )}

      {loading && <div className="stat-king__loading">Checking the throne...</div>}
      {error && <div className="stat-king__error">{error}</div>}

      {!loading && !error && king && (
        <div className="stat-king__banner">
          <div className="stat-king__crown">👑</div>
          <div className="stat-king__info">
            <p className="eyebrow">{isBball ? 'KING OF THE COURT' : 'KING OF THE GROUND'}</p>
            <h3>{king.alias}</h3>
            <p className="stat-king__position">
              {king.position || (isBball ? 'Baller' : 'All-rounder')} •{' '}
              {isBball
                ? `${king.points || 0}PTS ${king.rebounds || 0}REB`
                : `${king.goals || 0}G ${king.assists || 0}A`}
            </p>
            {king.isBanned && (
              <span className="stat-king__slashed">
                <AlertTriangle size={14} /> DEY LIE 🏴
              </span>
            )}
          </div>
        </div>
      )}

      {!loading && !error && !king && (
        <div className="stat-king__empty">
          <span>👑</span>
          <p>
            {isBball
              ? 'No court king yet. Run a pickup set and log your buckets to claim the throne.'
              : 'No ground king yet. Play and log your stats to claim the throne.'}
          </p>
        </div>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <div className="stat-king__leaderboard">
          <p className="eyebrow">{isBball ? 'TOP BALLERS ON THIS COURT' : 'TOP PLAYERS AT THIS GROUND'}</p>
          <ol>
            {leaderboard.slice(0, 5).map((entry, index) => (
              <li key={entry.userId} className={index === 0 ? 'is-king' : ''}>
                <span className="rank">{index === 0 ? '👑' : `#${index + 1}`}</span>
                <span className="alias">{entry.alias}</span>
                <span className="position">{entry.position || '—'}</span>
                <span className="score">{entry.score}</span>
                {entry.isBanned && <span className="slash-badge">🏴</span>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {isDemo && (
        <div className="stat-king__empty">
          <span>👑</span>
          <p>Stat King is available on live pitches. Connect the API to see the leaderboard.</p>
        </div>
      )}
    </div>
  );
}
