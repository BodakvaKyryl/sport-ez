import { useCallback, useEffect, useRef, useState } from "react";

import { fetchMatch, fetchMatchCommentary, fetchMatches } from "../services/api";
import type { Commentary, Match } from "../types";
import { useWebSocket } from "./useWebSocket";

interface UseMatchDataResult {
  matches: Match[];
  isLoading: boolean;
  error: Error | null;
  commentary: Commentary[];
  isCommentaryLoading: boolean;
  wsError: Error | null;
  status: ReturnType<typeof useWebSocket>["status"];
  activeMatchId: number | null;
  newMatchesCount: number;
  dismissNewMatches: () => void;
  watchMatch: (matchId: number) => void;
  unWatchMatch: (matchId: number) => void;
  reloadMatches: () => void;
  retryConnection: () => void;
}

const MATCHES_LIMIT = 100;

export function useMatchData(): UseMatchDataResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);

  const [newMatchesCount, setNewMatchesCount] = useState(0);
  const [wsError, setWsError] = useState<Error | null>(null);

  const { status, onMessage, send, reconnect } = useWebSocket();

  const activeMatchIdRef = useRef(activeMatchId);
  activeMatchIdRef.current = activeMatchId;

  const reloadMatches = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchMatches(MATCHES_LIMIT)
      .then((data) => {
        if (cancelled) return;
        setMatches(data);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (status === "disconnected") {
      setWsError(new Error("Unable to reach the live updates server."));
    } else if (status === "connected") {
      setWsError(null);
    }
  }, [status]);

  useEffect(() => {
    return onMessage((message) => {
      if (message.type === "match_created") {
        setMatches((prev) =>
          prev.some((match) => match.id === message.data.id) ? prev : [...prev, message.data]
        );
        setNewMatchesCount((count) => count + 1);
        return;
      }

      if (message.type === "score_updated") {
        setMatches((prev) =>
          prev.map((match) =>
            match.id === message.matchId ? { ...match, ...message.data } : match
          )
        );
        return;
      }

      const currentMatchId = activeMatchIdRef.current;
      if (currentMatchId === null) return;

      if (message.type === "commentary_created" && message.data.matchId === currentMatchId) {
        setCommentary((prev) => [message.data, ...prev]);
      }
    });
  }, [onMessage]);

  const dismissNewMatches = useCallback(() => setNewMatchesCount(0), []);

  const watchMatch = useCallback(
    (matchId: number) => {
      if (activeMatchId !== null && activeMatchId !== matchId) {
        send({ type: "unsubscribe", matchId: activeMatchId });
      }

      setActiveMatchId(matchId);
      setCommentary([]);
      setIsCommentaryLoading(true);
      send({ type: "subscribe", matchId });

      Promise.all([fetchMatch(matchId), fetchMatchCommentary(matchId)])
        .then(([match, entries]) => {
          if (activeMatchIdRef.current !== matchId) return;
          setMatches((prev) => prev.map((m) => (m.id === matchId ? match : m)));
          setCommentary(entries);
        })
        .catch((err: Error) => {
          console.error(`Failed to load match ${matchId}:`, err);
        })
        .finally(() => {
          if (activeMatchIdRef.current === matchId) setIsCommentaryLoading(false);
        });
    },
    [activeMatchId, send]
  );

  const unWatchMatch = useCallback(
    (matchId: number) => {
      send({ type: "unsubscribe", matchId });
      setActiveMatchId((current) => (current === matchId ? null : current));
      setCommentary([]);
    },
    [send]
  );

  return {
    matches,
    isLoading,
    error,
    commentary,
    isCommentaryLoading,
    wsError,
    status,
    activeMatchId,
    newMatchesCount,
    dismissNewMatches,
    watchMatch,
    unWatchMatch,
    reloadMatches,
    retryConnection: reconnect,
  };
}
