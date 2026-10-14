import type { Player, Sport } from "@/lib/types";

export interface BalancedSquads {
  teamA: Player[];
  teamB: Player[];
  ratingA: number;
  ratingB: number;
}

const roleCounts = (players: Player[]) => players.reduce<Record<string, number>>((counts, player) => {
  counts[player.position] = (counts[player.position] ?? 0) + 1;
  return counts;
}, {});

function objective(teamA: Player[], teamB: Player[], sport: Sport): number {
  const ratingGap = Math.abs(teamA.reduce((sum, p) => sum + p.reputation, 0) - teamB.reduce((sum, p) => sum + p.reputation, 0));
  const a = roleCounts(teamA);
  const b = roleCounts(teamB);
  const roles = sport === "football" ? ["GK", "DEF", "MID", "FWD"] : ["PG", "SG", "SF", "PF", "C"];
  const roleGap = roles.reduce((sum, role) => sum + Math.abs((a[role] ?? 0) - (b[role] ?? 0)), 0);
  return ratingGap * 3 + roleGap * 8 + Math.abs(teamA.length - teamB.length) * 120;
}

export function balanceSquads(players: Player[], sport: Sport): BalancedSquads {
  const ordered = [...players]
    .filter((player) => player.primarySport === sport)
    .sort((a, b) => b.reputation - a.reputation || a.alias.localeCompare(b.alias));
  const teamA: Player[] = [];
  const teamB: Player[] = [];

  for (const player of ordered) {
    const nextA = [...teamA, player];
    const nextB = [...teamB, player];
    if (objective(nextA, teamB, sport) < objective(teamA, nextB, sport)) teamA.push(player);
    else teamB.push(player);
  }

  return {
    teamA,
    teamB,
    ratingA: teamA.reduce((sum, player) => sum + player.reputation, 0),
    ratingB: teamB.reduce((sum, player) => sum + player.reputation, 0),
  };
}

export function formatSquadShare(teams: BalancedSquads, pitchName: string, sport: Sport): string {
  const label = sport === "football" ? "FOOTBALL" : "BASKETBALL";
  const lines = (players: Player[]) => players.map((player, index) => `${index + 1}. ${player.alias} · ${player.position}`).join("\n");
  return `CURBSPORT · ${label}\n${pitchName}\n\nTEAM A\n${lines(teams.teamA)}\n\nTEAM B\n${lines(teams.teamB)}\n\nBalanced by position + REP. Pull up.`;
}
