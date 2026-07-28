import React from "react";

import type { Commentary } from "../types";

interface LiveFeedProps {
  messages: Commentary[];
  isActive: boolean;
  isLoading: boolean;
}

function entryLabel(entry: Commentary): string {
  const parts = [entry.period, entry.minute != null ? `${entry.minute}'` : null].filter(Boolean);
  return parts.join(" · ");
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ messages, isActive, isLoading }) => {
  return (
    <div className="shadow-hard flex h-full flex-col overflow-hidden rounded-2xl border-2 border-black bg-white">
      <div className="bg-brand-dark border-b-2 border-black px-4 py-3 text-sm font-bold tracking-wide text-white uppercase">
        Live Feed
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!isActive && (
          <p className="mt-8 text-center text-sm text-gray-500">
            Select a match to see live commentary.
          </p>
        )}

        {isActive && isLoading && (
          <div className="mt-8 text-center">
            <div className="border-brand-yellow mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-4 border-t-black" />
            <p className="text-sm text-gray-500">Loading commentary...</p>
          </div>
        )}

        {isActive && !isLoading && messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-500">
            No commentary yet — waiting for events.
          </p>
        )}

        {isActive &&
          !isLoading &&
          messages.map((entry) => (
            <div key={entry.id} className="rounded-xl border-2 border-black bg-gray-50 p-3">
              <div className="mb-1 flex items-center justify-between text-xs font-bold tracking-wide text-gray-500 uppercase">
                <span>{entry.team ?? entry.actor ?? "Update"}</span>
                <span>{entryLabel(entry)}</span>
              </div>
              <p className="text-brand-dark text-sm">{entry.message}</p>
            </div>
          ))}
      </div>
    </div>
  );
};
