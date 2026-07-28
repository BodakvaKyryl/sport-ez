import React, { useEffect, useRef, useState } from "react";

import type { Match } from "../types";

interface MatchCardProps {
  match: Match;
  isActive: boolean;
  onWatch: (id: number) => void;
  onUnwatch: (id: number) => void;
}

function useScorePulse(score: number): boolean {
  const [pulsing, setPulsing] = useState(false);
  const prevScoreRef = useRef(score);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (prevScoreRef.current !== score) {
      prevScoreRef.current = score;
      setPulsing(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setPulsing(false), 900);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [score]);

  return pulsing;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, isActive, onWatch, onUnwatch }) => {
  const statusLower = match.status.toLowerCase();
  const isLive = statusLower === "live";
  const homePulse = useScorePulse(match.homeScore);
  const awayPulse = useScorePulse(match.awayScore);

  const actionLabel = (() => {
    if (isLive) {
      return isActive ? "Watching Live" : "Watch Live";
    }
    if (statusLower === "finished") {
      return isActive ? "Viewing Recap" : "View Recap";
    }
    return isActive ? "Viewing Match" : "View Match";
  })();

  const displayStatus = match.status.charAt(0).toUpperCase() + match.status.slice(1).toLowerCase();

  return (
    <div
      className={`relative rounded-2xl border-2 border-black bg-white p-5 transition-all duration-200 ${
        isActive
          ? "shadow-hard ring-brand-yellow -translate-x-0.5 -translate-y-0.5 ring-2 ring-offset-4"
          : "hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5"
      } `}>
      <div className="mb-4 flex items-start justify-between">
        <span className="rounded-full border border-black px-2 py-0.5 text-xs font-bold tracking-wider text-gray-500 uppercase">
          {match.sport}
        </span>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full border border-black bg-red-500"></span>
            </span>
          )}
          <span className={`text-sm font-medium ${isLive ? "text-red-600" : "text-gray-600"}`}>
            {displayStatus}
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-brand-dark line-clamp-1 text-lg font-bold">{match.homeTeam}</span>
          <span
            className={`min-w-12 rounded-2xl border-2 border-black px-3 py-1 text-center text-2xl font-bold transition-colors ${homePulse ? "bg-brand-yellow animate-pulse" : "bg-gray-100"} `}>
            {match.homeScore}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-brand-dark line-clamp-1 text-lg font-bold">{match.awayTeam}</span>
          <span
            className={`min-w-12 rounded-2xl border-2 border-black px-3 py-1 text-center text-2xl font-bold transition-colors ${awayPulse ? "bg-brand-yellow animate-pulse" : "bg-gray-100"} `}>
            {match.awayScore}
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t-2 border-dashed border-gray-100 pt-4">
        <span className="text-xs font-medium text-gray-500">
          {match.startTime
            ? new Date(match.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "TBD"}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWatch(match.id)}
            disabled={isActive}
            className={`rounded-full border-2 border-black px-4 py-2 text-sm font-bold transition-all ${
              isActive
                ? "bg-brand-blue cursor-default text-black opacity-100"
                : "bg-brand-yellow text-black hover:bg-yellow-300 active:translate-y-0.5"
            } `}>
            {actionLabel}
          </button>
          {isActive && (
            <button
              onClick={() => onUnwatch(match.id)}
              className="rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-bold transition-all hover:bg-gray-50">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
