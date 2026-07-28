import React, { useMemo, useState } from "react";

import { LiveFeed } from "./components/LiveFeed";
import { MatchCard } from "./components/MatchCard";
import { StatusIndicator } from "./components/StatusIndicator";
import { API_BASE_URL, WS_BASE_URL } from "./constants";
import { useMatchData } from "./hooks/useMatchData";

const PAGE_SIZE = 6;

const App: React.FC = () => {
  const [requestedPage, setRequestedPage] = useState(1);
  const {
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
    retryConnection,
  } = useMatchData();

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const pagedMatches = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return matches.slice(startIndex, startIndex + PAGE_SIZE);
  }, [matches, currentPage]);

  return (
    <div className="min-h-screen p-4 font-sans md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="bg-brand-yellow shadow-hard flex flex-col items-start justify-between gap-4 rounded-2xl border-2 border-black p-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-brand-dark mb-1 text-3xl font-black tracking-tight">Sportz-ez</h1>
            <p className="text-sm font-medium opacity-80">Real-time match data demo</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusIndicator status={status} />
            {wsError && (
              <div className="flex items-center gap-2">
                <span className="rounded border border-red-200 bg-red-100 px-2 py-1 font-mono text-xs text-red-700">
                  WS: {wsError.message}
                </span>
                {status === "disconnected" && (
                  <button
                    onClick={retryConnection}
                    className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold transition-all hover:bg-gray-50">
                    Reconnect
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <main className="space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="border-brand-blue border-l-4 pl-3 text-xl font-bold">
                Current Matches
              </h2>
              <span className="rounded bg-black px-2 py-1 font-mono text-xs text-white">
                API: {isLoading ? "..." : matches.length}
              </span>
            </div>
            {newMatchesCount > 0 && (
              <div className="bg-brand-yellow shadow-hard-sm flex items-center justify-between gap-3 rounded-xl border-2 border-black px-4 py-3">
                <span className="text-sm font-bold">
                  {newMatchesCount} new match{newMatchesCount > 1 ? "es" : ""} added
                </span>
                <button
                  onClick={dismissNewMatches}
                  className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold transition-all hover:bg-gray-50">
                  Dismiss
                </button>
              </div>
            )}

            {isLoading && (
              <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="border-brand-yellow mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-black"></div>
                <p className="font-medium text-gray-500">Loading matches...</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border-2 border-red-500 bg-red-50 p-6 text-center text-red-900 shadow-sm">
                <div className="mb-3 flex justify-center text-red-500">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="mb-1 text-lg font-bold">Connection Error</h3>
                <p className="mb-4 inline-block rounded border border-red-200 bg-red-100 px-2 py-1 font-mono text-sm">
                  {error.message}
                </p>
                <p className="mx-auto mb-6 max-w-md text-sm opacity-80">
                  The application could not reach the API. Please ensure the API server is online
                  and accessible from your network.
                </p>
                <button
                  onClick={reloadMatches}
                  className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 active:translate-y-0.5">
                  Retry Connection
                </button>
              </div>
            )}

            {!isLoading && !error && matches.length === 0 && (
              <div className="rounded-2xl border-2 border-black bg-gray-50 p-12 text-center">
                <p className="text-lg font-bold">No matches found</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {pagedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isActive={activeMatchId === match.id}
                  onWatch={watchMatch}
                  onUnwatch={unWatchMatch}
                />
              ))}
            </div>
            {!isLoading && !error && matches.length > PAGE_SIZE && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs font-medium text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRequestedPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`rounded-lg border-2 border-black px-3 py-1.5 text-xs font-bold transition-all ${currentPage === 1 ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-white hover:bg-gray-50"} `}>
                    Prev
                  </button>
                  <button
                    onClick={() => setRequestedPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`rounded-lg border-2 border-black px-3 py-1.5 text-xs font-bold transition-all ${currentPage === totalPages ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-white hover:bg-gray-50"} `}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </main>

          <aside className="h-125 lg:sticky lg:top-8 lg:col-span-1 lg:h-[calc(100vh-140px)]">
            <LiveFeed
              messages={commentary}
              isActive={!!activeMatchId}
              isLoading={isCommentaryLoading}
            />
          </aside>
        </div>

        <section className="mt-12 border-t-2 border-gray-200 pt-8">
          <div className="rounded-2xl border-2 border-black bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">
                ?
              </span>
              Testing & Verification
            </h3>
            <div className="grid gap-8 text-sm text-gray-600 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-bold text-black">Configuration</h4>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    REST URL: <code className="rounded bg-gray-100 px-1">{API_BASE_URL}</code>
                  </li>
                  <li>
                    WS URL: <code className="rounded bg-gray-100 px-1">{WS_BASE_URL}</code>
                  </li>
                  <li>
                    Modify these in <code className="rounded bg-gray-100 px-1">constants.ts</code>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-bold text-black">How to Verify</h4>
                <p className="mb-2">
                  1. Click the action button on any card (it shows "Watch Live" for live games).
                </p>
                <p className="mb-2">2. The status indicator top-right will turn green.</p>
                <p>
                  3. Wait for{" "}
                  <code className="rounded border border-gray-300 bg-gray-100 p-0.5 text-xs">
                    score_updated
                  </code>{" "}
                  or{" "}
                  <code className="rounded border border-gray-300 bg-gray-100 p-0.5 text-xs">
                    commentary_created
                  </code>{" "}
                  events from the server. The card score updates instantly, and the right panel
                  fills with text.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
