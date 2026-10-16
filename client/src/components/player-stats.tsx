'use client';

import { useEffect, useState } from 'react';
import { Trophy, Swords, ShieldAlert } from 'lucide-react';
import { getUserStats } from '@/lib/api';
import type { UserStats } from '@/lib/types';

interface PlayerStatsProps {
  userId: string | number;
}

export function PlayerStats({ userId }: PlayerStatsProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    getUserStats(String(userId))
      .then(setStats)
      .catch((err) => setError(err.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="stats-loading">Loading your stats...</div>;
  if (error) return <div className="stats-error">{error}</div>;
  if (!stats) return null;

  return (
    <section className="player-stats">
      <div className="form-section-heading">
        <span>02</span>
        <div>
          <p className="eyebrow">YOUR NUMBERS</p>
          <h2>STAT CARD</h2>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-tile"><strong>{stats.totalMatches}</strong><span>MATCHES</span></div>
        <div className="stat-tile"><strong>{stats.crowns}</strong><span>CROWNS 👑</span></div>
        <div className="stat-tile"><strong>{stats.reputationScore}</strong><span>REP</span></div>
        {stats.slashCount > 0 && <div className="stat-tile stat-tile--warn"><strong>{stats.slashCount}</strong><span>SLASHES 🏴</span></div>}
      </div>

      {stats.isCrownBanned && (
        <div className="crown-ban-notice">
          <ShieldAlert size={16} />
          <span>Crown banned — you cannot claim King of the Ground during this period.</span>
        </div>
      )}

      <div className="stats-sport-section">
        <h3>⚽ Football</h3>
        <div className="stats-grid">
          <div><strong>{stats.football.goals}</strong><span>Goals</span></div>
          <div><strong>{stats.football.assists}</strong><span>Assists</span></div>
          <div><strong>{stats.football.cleanSheets}</strong><span>Clean Sheets</span></div>
          <div><strong>{stats.football.saves}</strong><span>Saves</span></div>
          <div><strong>{stats.football.tackles}</strong><span>Tackles</span></div>
        </div>
        {stats.footballPosition && <p className="stats-position">Position: {stats.footballPosition}</p>}
      </div>

      <div className="stats-sport-section">
        <h3>🏀 Basketball</h3>
        <div className="stats-grid">
          <div><strong>{stats.basketball.points}</strong><span>Points</span></div>
          <div><strong>{stats.basketball.rebounds}</strong><span>Rebounds</span></div>
          <div><strong>{stats.basketball.steals}</strong><span>Steals</span></div>
          <div><strong>{stats.basketball.blocks}</strong><span>Blocks</span></div>
          <div><strong>{stats.basketball.threePointers}</strong><span>3PT</span></div>
        </div>
        {stats.basketballPosition && <p className="stats-position">Position: {stats.basketballPosition}</p>}
      </div>
    </section>
  );
}
