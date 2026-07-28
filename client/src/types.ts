export type MatchStatus = "scheduled" | "live" | "finished";

export interface Match {
  id: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: MatchStatus;
  startTime: string | null;
  endTime: string | null;
  homeScore: number;
  awayScore: number;
  createdAt: string;
}

export interface Commentary {
  id: number;
  matchId: number;
  minute: number | null;
  sequence: number | null;
  period: string | null;
  eventType: string | null;
  actor: string | null;
  team: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  tags: string[] | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface CreateMatchInput {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  endTime: string;
  homeScore?: number;
  awayScore?: number;
}

export interface UpdateScoreInput {
  homeScore: number;
  awayScore: number;
}

export interface CreateCommentaryInput {
  message: string;
  minute?: number;
  sequence?: number;
  period?: string;
  eventType?: string;
  actor?: string;
  team?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

export type ServerMessage =
  | { type: "welcome" }
  | { type: "match_created"; data: Match }
  | { type: "score_updated"; matchId: number; data: { homeScore: number; awayScore: number } }
  | { type: "commentary_created"; data: Commentary }
  | { type: "subscribed"; matchId: number }
  | { type: "unsubscribed"; matchId: number };

export type ClientMessage =
  { type: "subscribe"; matchId: number } | { type: "unsubscribe"; matchId: number };
