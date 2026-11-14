import React, { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Incident } from "../components/Incident.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { TableRowSkeleton } from "../components/Skeleton.jsx";
import { useAppData } from "../hooks/useAppData.js";

export function IncidentPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { incidents, events, loadingEvents } = useAppData();

  // Find the requested event or fall back to the highest score or first event
  const currentEvent = useMemo(() => {
    if (!incidents || incidents.length === 0) return null;
    const incident = incidents.find((item) => String(item.id) === String(eventId)) || incidents[0];
    const incidentEvents = incident.events?.length ? incident.events : events.filter((item) => item.ip === incident.ip);
    const latest = [...incidentEvents].sort((a, b) => new Date(b.ts || b.created_at) - new Date(a.ts || a.created_at))[0];
    return latest ? { ...latest, events: incidentEvents, incident_id: incident.id, display_incident_id: incident.id,
      score: incident.score, severity: incident.severity, flags: incident.flags, geo: incident.geo,
      event_count: incident.event_count } : { ...incident, id: incident.id, display_incident_id: incident.id, events: [] };
  }, [incidents, events, eventId]);

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
          Incident ID: <span className="text-white font-bold">#{currentEvent.display_incident_id || currentEvent.id}</span>
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

