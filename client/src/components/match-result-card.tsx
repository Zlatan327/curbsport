'use client';

import { useState } from 'react';
import { Trophy, CheckCircle, AlertTriangle, Clock, Share2, LoaderCircle, Star, ThumbsUp, XCircle } from 'lucide-react';
import { confirmMatch, disputeMatch } from '@/lib/api';
import { formatMatchResultWhatsAppMessage, shareToWhatsApp } from '@/lib/share';
import type { Lobby, MatchResult, MatchStat } from '@/lib/types';

interface MatchResultCardProps {
  lobby: Lobby;
  pitchName: string;
  sportType?: 'FOOTBALL' | 'BASKETBALL';
  currentUserId?: number;
  onRefresh: () => Promise<void>;
  pitchUrl: string;
}

export function MatchResultCard({
  lobby,
  pitchName,
  sportType = 'FOOTBALL',
  currentUserId,
  onRefresh,
  pitchUrl,
}: MatchResultCardProps) {
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const result = lobby.matchResult;
  if (!result) return null;

  const isBball = sportType === 'BASKETBALL';
  const isPending = result.status === 'PENDING';
  const isConfirmed = result.status === 'CONFIRMED';
  const isDisputed = result.status === 'DISPUTED';

  // Count confirmations
  const confirmations = Array.isArray(result.confirmations) ? result.confirmations : [];
  const yesCount = confirmations.filter((c: any) => c.confirmed).length;
  const needed = Math.min(2, Math.max(1, (result.playerCount || result.stats.length || 2) - 1));

  // Check if current user is participant and can confirm
  const isParticipant = currentUserId
    ? result.stats.some((s) => s.userId === currentUserId)
    : false;
  const isSubmitter = currentUserId ? result.submittedById === currentUserId : false;
  const alreadyConfirmed = currentUserId
    ? confirmations.some((c: any) => c.userId === currentUserId)
    : false;
  const canConfirm = isPending && isParticipant && !isSubmitter && !alreadyConfirmed;

  // Find top scorer / MVP candidate
  let topStat: MatchStat | null = null;
  let topScore = -1;
  for (const s of result.stats) {
    const score = isBball
      ? (s.points || 0) * 2 + (s.rebounds || 0)
      : (s.goals || 0) * 3 + (s.assists || 0) * 2 + (s.cleanSheets || 0) * 2;
    if (score > topScore) {
      topScore = score;
      topStat = s;
    }
  }

  const scorers = result.stats
    .filter((s) => (isBball ? (s.points || 0) > 0 : (s.goals || 0) > 0))
    .sort((a, b) => (isBball ? (b.points || 0) - (a.points || 0) : (b.goals || 0) - (a.goals || 0)));

  const handleConfirm = async (confirmed: boolean) => {
    setBusy(true);
    setErrorMessage('');
    setActionMessage('');
    try {
      if (confirmed) {
        await confirmMatch(result.id, true);
        setActionMessage('Score confirmed! +15 REP registered on your profile.');
      } else {
        await disputeMatch(result.id, 'Score reported incorrectly by participants.');
        setActionMessage('Dispute registered. Match flagged for review.');
      }
      await onRefresh();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not record confirmation.');
    } finally {
      setBusy(false);
    }
  };

  const handleShareWhatsApp = async () => {
    const text = formatMatchResultWhatsAppMessage({
      pitchName,
      sportType,
      status: result.status,
      durationMins: result.durationMins,
      mvpName: topStat && topScore > 0 ? topStat.alias : undefined,
      scorers: result.stats.map((s) => ({
        name: s.alias || `Player #${s.userId}`,
        goals: s.goals,
        points: s.points,
      })),
      pitchUrl,
    });

    await shareToWhatsApp(text);
  };

  return (
    <div className={`match-result-card ${isConfirmed ? 'is-confirmed' : isDisputed ? 'is-disputed' : 'is-pending'}`}>
      <div className="match-result-card__header">
        <div className="match-result-status-pill">
          {isConfirmed ? (
            <>
              <CheckCircle size={13} /> <span>VERIFIED SCORE (+15 REP)</span>
            </>
          ) : isDisputed ? (
            <>
              <AlertTriangle size={13} /> <span>DISPUTED RESULT</span>
            </>
          ) : (
            <>
              <Clock size={13} /> <span>CONFIRMATION NEEDED ({yesCount}/{needed})</span>
            </>
          )}
        </div>

        <span className="match-duration-badge">
          ⏱️ {result.durationMins || 30} MINS
        </span>
      </div>

      {actionMessage && <div className="match-result-notice notice--success">{actionMessage}</div>}
      {errorMessage && <div className="match-result-notice notice--error">{errorMessage}</div>}

      {/* MVP Highlight */}
      {topStat && topScore > 0 && (
        <div className="match-result-mvp">
          <Star size={14} className="mvp-star" />
          <div className="mvp-content">
            <span className="mvp-label">MAN OF THE MATCH (MVP)</span>
            <strong>{topStat.alias || `Player #${topStat.userId}`}</strong>
            <small>
              {isBball
                ? `${topStat.points} PTS • ${topStat.rebounds} REB`
                : `${topStat.goals} GOAL${topStat.goals === 1 ? '' : 'S'} • ${topStat.assists} AST`}
            </small>
          </div>
        </div>
      )}

      {/* Scorers Sheet */}
      {scorers.length > 0 && (
        <div className="match-result-scorers">
          <span className="scorers-label">{isBball ? 'TOP POINT SCORERS' : 'MATCH SCORERS'}</span>
          <div className="scorers-chips">
            {scorers.map((s) => (
              <span key={s.userId} className="scorer-chip">
                <strong>{s.alias}</strong>
                <span>{isBball ? `${s.points} pts` : `${s.goals} ⚽`}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Peer Confirmation Action Bar */}
      {canConfirm && (
        <div className="match-result-peer-action">
          <p className="peer-prompt">
            Were you in this set? Confirm the score to earn your <strong>+15 REP</strong>.
          </p>
          <div className="peer-buttons">
            <button
              type="button"
              className="confirm-btn"
              disabled={busy}
              onClick={() => void handleConfirm(true)}
            >
              {busy ? <LoaderCircle className="spin" size={13} /> : <ThumbsUp size={13} />}
              <span>CONFIRM SCORE (+15 REP)</span>
            </button>
            <button
              type="button"
              className="dispute-btn"
              disabled={busy}
              onClick={() => void handleConfirm(false)}
            >
              <XCircle size={13} />
              <span>DISPUTE</span>
            </button>
          </div>
        </div>
      )}

      {isPending && !canConfirm && alreadyConfirmed && (
        <div className="match-confirmed-by-user">
          <CheckCircle size={12} /> You confirmed this set. Awaiting remaining peer verifications.
        </div>
      )}

      {isPending && isSubmitter && (
        <div className="match-submitter-note">
          You logged this score. Opponents/teammates must tap confirm to verify (+15 REP).
        </div>
      )}

      <div className="match-result-footer">
        <button
          type="button"
          className="match-share-wa-btn"
          onClick={() => void handleShareWhatsApp()}
        >
          <Share2 size={13} /> <span>SHARE SCORECARD TO WHATSAPP</span>
        </button>
      </div>
    </div>
  );
}
