'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, CloudRain, Sun, Zap, Lock, Unlock, Users, Send } from 'lucide-react';
import { sendBanter } from '@/lib/api';

interface GroundConditionPillsProps {
  pitchId: string;
  pitchName: string;
  isDemo?: boolean;
  token?: string | null;
  onConditionBroadcast?: (msg: string) => void;
}

interface ConditionTag {
  id: string;
  label: string;
  icon: string;
  broadcastText: string;
}

const CONDITIONS: ConditionTag[] = [
  {
    id: 'keeper_needed',
    label: 'KEEPER NEEDED',
    icon: '🥅',
    broadcastText: '🥅 Touchline Alert: Goalkeeper urgently needed on ground right now!',
  },
  {
    id: 'surface_wet',
    label: 'WET / MUDDY',
    icon: '🌧️',
    broadcastText: '🌧️ Touchline Alert: Pitch surface is wet/muddy after rain. Soft studs/boots advised.',
  },
  {
    id: 'surface_dry',
    label: 'GROUND DRY',
    icon: '☀️',
    broadcastText: '☀️ Touchline Alert: Pitch surface is dry and good for play.',
  },
  {
    id: 'lights_on',
    label: 'FLOODLIGHTS ON',
    icon: '💡',
    broadcastText: '💡 Touchline Alert: Floodlights are on! Evening sets can fly.',
  },
  {
    id: 'gate_open',
    label: 'GATE OPEN',
    icon: '🚪',
    broadcastText: '🚪 Touchline Alert: Gate and security access open. Pull up freely.',
  },
];

export function GroundConditionPills({
  pitchId,
  pitchName,
  isDemo,
  token,
  onConditionBroadcast,
}: GroundConditionPillsProps) {
  const [activeReports, setActiveReports] = useState<{ [id: string]: number }>({});
  const [reportingId, setReportingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(`ground_conditions_${pitchId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only keep reports from the last 4 hours
        const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
        const valid: { [id: string]: number } = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (Number(v) > fourHoursAgo) {
            valid[k] = Number(v);
          }
        }
        setActiveReports(valid);
      }
    } catch {
      // ignore
    }
  }, [pitchId]);

  const handleToggleCondition = async (cond: ConditionTag) => {
    if (!token && !isDemo) {
      if (onConditionBroadcast) onConditionBroadcast('Please log in to report ground condition.');
      return;
    }

    setReportingId(cond.id);
    const now = Date.now();
    const updated = { ...activeReports, [cond.id]: now };
    setActiveReports(updated);
    try {
      localStorage.setItem(`ground_conditions_${pitchId}`, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Send banter announcement
    if (!isDemo && token) {
      try {
        await sendBanter(pitchId, cond.broadcastText);
        if (onConditionBroadcast) {
          onConditionBroadcast(`Condition broadcasted: "${cond.label}" (+5 REP community shout)`);
        }
      } catch {
        // ignore
      }
    } else {
      if (onConditionBroadcast) {
        onConditionBroadcast(`Condition updated: "${cond.label}"`);
      }
    }

    setReportingId(null);
  };

  return (
    <div className="ground-conditions-bar">
      <span className="conditions-label">TOUCHLINE RADAR:</span>
      <div className="conditions-chips-scroll">
        {CONDITIONS.map((cond) => {
          const isReported = Boolean(activeReports[cond.id]);
          const isBusy = reportingId === cond.id;

          return (
            <button
              type="button"
              key={cond.id}
              className={`condition-chip ${isReported ? 'is-active' : ''}`}
              disabled={isBusy}
              onClick={() => void handleToggleCondition(cond)}
              title={`Tap to broadcast "${cond.label}" to touchline chat`}
            >
              <span className="condition-chip__icon">{cond.icon}</span>
              <span className="condition-chip__text">{cond.label}</span>
              {isReported && <span className="condition-chip__active-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
