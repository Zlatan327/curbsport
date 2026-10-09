'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, CloudRain, Sun, Zap, Lock, Unlock, Users, Send } from 'lucide-react';
import { sendBanter } from '@/lib/api';

interface GroundConditionPillsProps {
  pitchId: string;
  pitchName: string;
  sportType?: 'FOOTBALL' | 'BASKETBALL';
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

const FOOTBALL_CONDITIONS: ConditionTag[] = [
  {
    id: 'keeper_needed',
    label: 'KEEPER NEEDED',
    icon: '🥅',
    broadcastText: '🥅 Touchline Alert: Goalkeeper urgently needed on ground right now! Set dey wait.',
  },
  {
    id: 'surface_dry',
    label: 'GROUND DRY',
    icon: '☀️',
    broadcastText: '☀️ Ground Report: Pitch surface is dry and sharp for ball.',
  },
  {
    id: 'surface_wet',
    label: 'MUD / WATERLOGGED',
    icon: '🌧️',
    broadcastText: '🌧️ Ground Report: Water and mud full ground after rain. Soft boots advised.',
  },
  {
    id: 'light_dey',
    label: 'LIGHT / GEN DEY',
    icon: '💡',
    broadcastText: '💡 Power Alert: Light dey ground (Gen / NEPA)! Evening set fit fly.',
  },
  {
    id: 'security_clear',
    label: 'NO SECURITY WAHALA',
    icon: '🚪',
    broadcastText: '🚪 Access Alert: Gate open, Man O\' War / security no dey disturb. Pull up freely.',
  },
];

const BASKETBALL_CONDITIONS: ConditionTag[] = [
  {
    id: 'ballers_needed',
    label: 'RUN DEY ON (NEED PLAYERS)',
    icon: '🏀',
    broadcastText: '🏀 Court Alert: Set dey fly! Ballers needed to complete 3v3 / 5v5 right now.',
  },
  {
    id: 'rim_ok',
    label: 'RIM & BOARD OK',
    icon: '🗑️',
    broadcastText: '🗑️ Equipment Report: Rims and backboards dey solid. Game can fly.',
  },
  {
    id: 'surface_dry',
    label: 'COURT DRY (GRIP SHARP)',
    icon: '☀️',
    broadcastText: '☀️ Court Report: Court surface is dry and grip is tight. No slipping.',
  },
  {
    id: 'surface_wet',
    label: 'COURT SLIPPERY',
    icon: '🌧️',
    broadcastText: '🌧️ Court Report: Court wet after rain, watch your knees and ankles.',
  },
  {
    id: 'light_dey',
    label: 'LIGHT DEY (EVENING RUN)',
    icon: '💡',
    broadcastText: '💡 Power Alert: Light dey around court for evening hoop before night pack everybody.',
  },
  {
    id: 'gate_open',
    label: 'HOSTEL GATE OPEN',
    icon: '🚪',
    broadcastText: '🚪 Access Alert: Quadrangle / hostel gate open freely. No porter wahala.',
  },
];

export function GroundConditionPills({
  pitchId,
  pitchName,
  sportType = 'FOOTBALL',
  isDemo,
  token,
  onConditionBroadcast,
}: GroundConditionPillsProps) {
  const isBball = sportType === 'BASKETBALL';
  const conditions = isBball ? BASKETBALL_CONDITIONS : FOOTBALL_CONDITIONS;
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
        {conditions.map((cond) => {
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
