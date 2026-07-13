import { API_BASE_URL } from "../constants";
import type { ApiResponse, Commentary, Match } from "../types";

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${path}`);
  }
  return response.json();
}

export async function fetchMatches(limit?: number): Promise<Match[]> {
  const query = limit ? `?limit=${limit}` : "";
  const { data } = await get<ApiResponse<Match[]>>(`/matches${query}`);
  return data;
}

export async function fetchMatch(matchId: number): Promise<Match> {
  const { data } = await get<ApiResponse<Match>>(`/matches/${matchId}`);
  return data;
}

export async function fetchMatchCommentary(matchId: number, limit?: number): Promise<Commentary[]> {
  const query = limit ? `?limit=${limit}` : "";
  const { data } = await get<ApiResponse<Commentary[]>>(`/matches/${matchId}/commentary${query}`);
  return data;
}
