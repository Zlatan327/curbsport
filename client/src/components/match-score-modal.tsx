'use client';

import { useState } from 'react';
import { X, Trophy, Check, LoaderCircle, Plus, Minus, Star, Clock } from 'lucide-react';
import { submitMatchResult } from '@/lib/api';
import type { Lobby, LobbyPlayer, AuthUser } from '@/lib/types';

interface MatchScoreModalProps {
  lobby: Lobby;
  pitchName: string;
  sportType?: 'FOOTBALL' | 'BASKETBALL';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MatchScoreModal({
  lobby,
  pitchName,
  sportType = 'FOOTBALL',
  isOpen,
  onClose,
  onSuccess,
}: MatchScoreModalProps) {
  const isBball = sportType === 'BASKETBALL';

  // Gather players from lobby
  const rawPlayers = Array.isArray(lobby.players) ? lobby.players : [];
  const playerList: Array<{ id: number; alias: string }> = [];

  for (const p of rawPlayers) {
    if (typeof p === 'object' && p !== null) {
      const pid = Number(p.id);
      const alias = (p as any).alias || 'Player';
      if (!isNaN(pid) && pid > 0 && !playerList.some((x) => x.id === pid)) {
        playerList.push({ id: pid, alias });
      }
    }
  }

  // Include host if not already in player list
  if (lobby.host && typeof lobby.host === 'object') {
    const hostId = Number((lobby.host as any).id);
    const hostAlias = (lobby.host as any).alias || 'Host';
    if (!isNaN(hostId) && hostId > 0 && !playerList.some((x) => x.id === hostId)) {
      playerList.push({ id: hostId, alias: hostAlias });
    }
  }

  const [durationMins, setDurationMins] = useState<number>(30);
  const [mvpUserId, setMvpUserId] = useState<number | null>(null);
  const [stats, setStats] = useState<{
    [userId: number]: {
      goals: number;
      assists: number;
      cleanSheets: number;
      saves: number;
      points: number;
      rebounds: number;
    };
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const getPlayerStat = (userId: number) => {
    return (
      stats[userId] || {
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        saves: 0,
        points: 0,
        rebounds: 0,
      }
    );
  };

  const updateStat = (userId: number, field: string, delta: number) => {
    const current = getPlayerStat(userId);
    const newVal = Math.max(0, (current as any)[field] + delta);
    setStats((prev) => ({
      ...prev,
      [userId]: {
        ...current,
        [field]: newVal,
      },
    }));
  };

  const handleQuickMvp = (userId: number) => {
    setMvpUserId(mvpUserId === userId ? null : userId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playerList.length < 2) {
      setError('At least 2 players are needed in the set to record a match result.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formattedStats = playerList.map((p) => {
        const s = getPlayerStat(p.id);
        const isMvp = mvpUserId === p.id;
        return {
          userId: p.id,
          goals: s.goals,
          assists: s.assists,
          cleanSheets: s.cleanSheets || (isMvp && !isBball ? 1 : 0),
          saves: s.saves,
          tackles: 0,
          points: s.points,
          rebounds: s.rebounds,
          steals: 0,
          blocks: 0,
          threePointers: 0,
        };
      });

      await submitMatchResult({
        lobbyId: Number(lobby.id),
        durationMins,
        stats: formattedStats,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit match score. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalGoals = Object.values(stats).reduce((acc, curr) => acc + (curr.goals || 0), 0);
  const totalPoints = Object.values(stats).reduce((acc, curr) => acc + (curr.points || 0), 0);

  return (
    <div className="match-modal-backdrop" onClick={onClose}>
      <div
        className="match-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-score-title"
      >
        <div className="match-modal-header">
          <div>
            <span className="match-modal-eyebrow">
              {isBball ? '🏀 HOOPS SCORECARD' : '⚽ 5-A-SIDE MATCH REPORT'}
            </span>
            <h2 id="match-score-title">LOG MATCH RESULT</h2>
            <p className="match-modal-subtitle">
              Takes 30 seconds. Confirmed participants earn <strong>+15 REP</strong> on the pitch leaderboard.
            </p>
          </div>
          <button type="button" className="match-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            margin: '12px 16px 0',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#d1fae5',
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontSize: '15px' }}>⚡</span>
          <span>
            <strong>Stress-free stats:</strong> Don&apos;t stress counting every play! Tap scorers, toggle <strong>🛡️ CS</strong> for defense, or select <strong>MVP ⭐</strong>. Every baller in the set earns <strong>+15 REP</strong> just for playing!
          </span>
        </div>

        {error && <div className="match-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="match-modal-body">
          {/* Duration Chips */}
          <div className="match-duration-picker">
            <label className="picker-label">
              <Clock size={13} /> MATCH DURATION
            </label>
            <div className="duration-chips">
              {[15, 20, 30, 45, 60].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  className={`duration-chip ${durationMins === mins ? 'is-active' : ''}`}
                  onClick={() => setDurationMins(mins)}
                >
                  {mins} MINS
                </button>
              ))}
            </div>
          </div>

          {/* Quick Roster Stat Logger */}
          <div className="match-roster-stat-header">
            <span>SQUAD STAT SHEET ({playerList.length} Ballers)</span>
            <small>
              {isBball ? `Total Points: ${totalPoints}` : `Total Goals Logged: ${totalGoals}`}
            </small>
          </div>

          <div className="match-roster-stat-list">
            {playerList.map((player) => {
              const pStat = getPlayerStat(player.id);
              const isSelectedMvp = mvpUserId === player.id;

              return (
                <div
                  key={player.id}
                  className={`match-player-stat-row ${isSelectedMvp ? 'is-mvp' : ''}`}
                >
                  <div className="player-meta">
                    <span className="player-alias">{player.alias}</span>
                    <button
                      type="button"
                      className={`mvp-badge-btn ${isSelectedMvp ? 'is-active' : ''}`}
                      onClick={() => handleQuickMvp(player.id)}
                      title="Select as Man of the Match (MVP)"
                    >
                      <Star size={11} fill={isSelectedMvp ? '#facc15' : 'none'} />
                      <span>{isSelectedMvp ? 'MVP ⭐' : 'MVP'}</span>
                    </button>
                  </div>

                  <div className="player-stat-controls">
                    {!isBball ? (
                      <>
                        <div className="stat-stepper">
                          <span className="stat-label">GOALS</span>
                          <button
                            type="button"
                            className="stepper-btn"
                            disabled={pStat.goals <= 0}
                            onClick={() => updateStat(player.id, 'goals', -1)}
                          >
                            <Minus size={11} />
                          </button>
                          <span className="stepper-value">{pStat.goals}</span>
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => updateStat(player.id, 'goals', 1)}
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <div className="stat-stepper">
                          <span className="stat-label">ASSISTS</span>
                          <button
                            type="button"
                            className="stepper-btn"
                            disabled={pStat.assists <= 0}
                            onClick={() => updateStat(player.id, 'assists', -1)}
                          >
                            <Minus size={11} />
                          </button>
                          <span className="stepper-value">{pStat.assists}</span>
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => updateStat(player.id, 'assists', 1)}
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <button
                          type="button"
                          className={`cs-toggle-btn ${pStat.cleanSheets > 0 ? 'is-active' : ''}`}
                          onClick={() => updateStat(player.id, 'cleanSheets', pStat.cleanSheets > 0 ? -1 : 1)}
                          title="Clean Sheet (Defenders & Goalkeepers)"
                        >
                          🛡️ {pStat.cleanSheets > 0 ? 'CS ✓' : 'CS'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="stat-stepper stat-stepper--points">
                          <span className="stat-label">PTS</span>
                          <button
                            type="button"
                            className="stepper-btn"
                            disabled={pStat.points <= 0}
                            onClick={() => updateStat(player.id, 'points', -1)}
                            title="Undo point"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="stepper-value">{pStat.points}</span>
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => updateStat(player.id, 'points', 1)}
                            title="Free throw (+1 pt)"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            className="stepper-btn stepper-btn--accent"
                            onClick={() => updateStat(player.id, 'points', 2)}
                            title="Field goal (+2 pts)"
                          >
                            +2
                          </button>
                          <button
                            type="button"
                            className="stepper-btn stepper-btn--accent"
                            onClick={() => updateStat(player.id, 'points', 3)}
                            title="Three pointer (+3 pts)"
                          >
                            +3
                          </button>
                        </div>

                        <div className="stat-stepper">
                          <span className="stat-label">REB</span>
                          <button
                            type="button"
                            className="stepper-btn"
                            disabled={pStat.rebounds <= 0}
                            onClick={() => updateStat(player.id, 'rebounds', -1)}
                          >
                            <Minus size={11} />
                          </button>
                          <span className="stepper-value">{pStat.rebounds}</span>
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => updateStat(player.id, 'rebounds', 1)}
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {playerList.length === 0 && (
              <div className="no-players-notice">
                No players registered in this set yet. Players must join the set to log stats.
              </div>
            )}
          </div>

          <div className="match-modal-actions">
            <button
              type="button"
              className="button button--outline"
              onClick={onClose}
              disabled={submitting}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="button button--green submit-score-btn"
              disabled={submitting || playerList.length < 2}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="spin" size={15} /> SUBMITTING RESULT…
                </>
              ) : (
                <>
                  <Trophy size={15} /> POST RESULT FOR PEER CONFIRMATION
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
