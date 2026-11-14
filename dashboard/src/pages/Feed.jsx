import React from "react";
import { Radio, AlertTriangle } from "lucide-react";
import { Feed as FeedComponent } from "../components/Feed.jsx";
import { ErrorBanner } from "../components/ErrorBanner.jsx";
import { useAppData } from "../hooks/useAppData.js";

export function Feed() {
  const {
    events,
    tokenMap,
    recentEventIds,
    loadingEvents,
    eventsError,
    refreshEvents,
    isPaused,
    togglePause,
    now
  } = useAppData();

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2B47] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h2 className="text-xl font-bold text-[#E6EDF7] tracking-tight">
              Real-Time Security Event Feed
            </h2>
          </div>
          <p className="text-xs text-[#8FA0BD] mt-1">
            Real-time decoy interaction telemetry. Click any event to inspect full forensic timeline.
          </p>
        </div>

        {isPaused && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Updates paused — queueing new events</span>
          </div>
        )}
      </div>

      {/* Error banner if needed */}
      {eventsError && (
        <ErrorBanner
          title="Telemetry Feed Error"
          message={eventsError}
          onRetry={refreshEvents}
        />
      )}

      {/* Full Feed with Search, Filter & Row Flash Animation */}
      <FeedComponent
        events={events}
        tokenMap={tokenMap}
        recentEventIds={recentEventIds}
        loading={loadingEvents}
        compact={false}
        now={now}
      />
    </div>
  );
}

export default Feed;

