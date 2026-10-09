export function formatLobbyWhatsAppMessage(params: {
  pitchName: string;
  pitchArea?: string;
  sportType?: 'FOOTBALL' | 'BASKETBALL';
  lobbyTitle: string;
  startsAt?: string;
  playerCount: number;
  maxPlayers: number;
  hasBall?: boolean;
  hostName?: string;
  hostRep?: number;
  pitchUrl: string;
}): string {
  const isBball = params.sportType === 'BASKETBALL';
  const icon = isBball ? '🏀' : '⚽';
  const sportName = isBball ? 'HOOPS PICKUP CALLOUT' : '5-A-SIDE SET CALLOUT';
  const ballStatus = params.hasBall ? 'Match equipment confirmed on ground 🔥' : 'Bring match ball if you have one';
  const hostInfo = params.hostName ? `👑 Host: ${params.hostName}${params.hostRep ? ` (⭐ ${params.hostRep} REP)` : ''}` : '';
  const spotsLeft = Math.max(0, params.maxPlayers - params.playerCount);
  const spotsText = spotsLeft > 0 ? `${params.playerCount}/${params.maxPlayers} filled (${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left!)` : `${params.playerCount}/${params.maxPlayers} (SET IS FULL!)`;

  const lines = [
    `${icon} *${params.lobbyTitle.toUpperCase() || sportName}*`,
    `🏟️ *Ground:* ${params.pitchName}${params.pitchArea ? ` (${params.pitchArea})` : ''}`,
    `⏰ *Kick-off:* ${params.startsAt || 'Active today'}`,
    `👥 *Squad List:* ${spotsText}`,
    params.hasBall ? `🔥 *Equipment:* ${ballStatus}` : null,
    hostInfo ? hostInfo : null,
    ``,
    `👉 *Lock your starter spot on the roster sheet:*`,
    params.pitchUrl,
  ].filter(Boolean);

  return lines.join('\n');
}

export function formatBallBeaconWhatsAppMessage(params: {
  pitchName: string;
  pitchArea?: string;
  sportType?: 'FOOTBALL' | 'BASKETBALL';
  ballBroughtBy?: string;
  pitchUrl: string;
}): string {
  const isBball = params.sportType === 'BASKETBALL';
  const icon = isBball ? '🏀' : '⚽';
  const ballBrought = params.ballBroughtBy ? `Brought by ${params.ballBroughtBy}` : 'Match ball confirmed';

  return [
    `🔥 *${isBball ? 'BALL ON COURT RIGHT NOW!' : 'MATCH BALL DEY GROUND RIGHT NOW!'}*`,
    `🏟️ *Ground:* ${params.pitchName}${params.pitchArea ? ` (${params.pitchArea})` : ''}`,
    `${icon} *Equipment:* ${ballBrought} • Match can fly!`,
    `📍 Pull up to play now.`,
    ``,
    `👉 *Get directions & live ground radar:*`,
    params.pitchUrl,
  ].join('\n');
}

export async function shareToWhatsApp(text: string): Promise<void> {
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        text,
      });
      return;
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        window.open(waUrl, '_blank');
      }
      return;
    }
  }

  window.open(waUrl, '_blank');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
