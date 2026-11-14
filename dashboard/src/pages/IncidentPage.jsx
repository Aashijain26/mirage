import React, { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Incident } from "../components/Incident.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { TableRowSkeleton } from "../components/Skeleton.jsx";
import { useAppData } from "../hooks/useAppData.js";

export function IncidentPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { events, loadingEvents } = useAppData();

  // Find the requested event or fall back to the highest score or first event
  const currentEvent = useMemo(() => {
    if (!events || events.length === 0) return null;

    if (eventId) {
      const match = events.find((e) => String(e.id) === String(eventId));
      if (match) return match;
    }

    // Default to the highest score event or the latest event
    const highRisk = events.find((e) => (e.score ?? 0) >= 70);
    return highRisk || events[0];
  }, [events, eventId]);

  const handleSelectEventId = (newId) => {
    navigate(`/incidents/${newId}`);
  };

  if (loadingEvents) {
    return (
      <div className="p-4 md:p-8 space-y-4 max-w-7xl mx-auto">
        <TableRowSkeleton cols={6} />
        <TableRowSkeleton cols={6} />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <EmptyState
          title="No incident selected"
          description="Traps are armed and monitoring. No security events are currently available to inspect."
          action={
            <Link
              to="/feed"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Go to Live Feed</span>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8FA0BD] hover:text-[#E6EDF7] transition-colors p-1 -ml-1 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Feed / Incidents</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#8FA0BD]">
            Incident ID: <span className="text-white font-bold">#{currentEvent.id}</span>
          </span>
        </div>
      </div>

      {/* Forensic Incident Detail View */}
      <Incident
        event={currentEvent}
        onSelectEventId={handleSelectEventId}
      />
    </div>
  );
}

export default IncidentPage;

