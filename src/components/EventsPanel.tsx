import { eventGraphInputText } from '../chat/instructions';
import type { RpAppointment, RpDateTimeFormat, RpWeekdayLanguage } from '../types';
import { formatRpDateTime } from '../workflow';

type EventsPanelProps = {
  upcomingEvents: RpAppointment[];
  selectedEvent?: RpAppointment;
  highlightedEventIds: Set<string>;
  eventManagerAvailable: boolean;
  runDisabled: boolean;
  isRunning: boolean;
  rpDateTimeFormat: RpDateTimeFormat;
  rpWeekdayLanguage: RpWeekdayLanguage;
  onSelectEvent: (eventId: string) => void;
  onCancelEvent: (eventId: string) => void;
  onRunEvent: () => void;
};

function eventPhoneLabel(event: RpAppointment) {
  return `Phone: ${event.phoneFrom ?? event.assignedTo ?? 'sender'} -> ${event.phoneTo ?? event.requestedBy ?? 'recipient'}`;
}

function eventTimingLabel(
  event: RpAppointment,
  fallback = 'Conditional',
  rpDateTimeFormat?: RpDateTimeFormat,
  rpWeekdayLanguage?: RpWeekdayLanguage,
) {
  return event.scheduledAt
    ? formatRpDateTime(event.scheduledAt, rpDateTimeFormat, rpWeekdayLanguage)
    : event.condition ?? fallback;
}

export function EventsPanel({
  upcomingEvents,
  selectedEvent,
  highlightedEventIds,
  eventManagerAvailable,
  runDisabled,
  isRunning,
  rpDateTimeFormat,
  rpWeekdayLanguage,
  onSelectEvent,
  onCancelEvent,
  onRunEvent,
}: EventsPanelProps) {
  return (
    <div className="events-surface">
      {!eventManagerAvailable && (
        <div className="events-disabled-overlay">
          <span>Connect Event Manager to the workflow.</span>
        </div>
      )}
      <div className="events-list" aria-label="Upcoming events">
        <div className="events-list-header">
          <strong>Upcoming Events</strong>
          <span>{upcomingEvents.length}</span>
        </div>
        <div className="events-items">
          {upcomingEvents.map((event) => (
            <div
              className={`event-item${selectedEvent?.id === event.id ? ' active' : ''}${highlightedEventIds.has(event.id) ? ' unread' : ''}`}
              key={event.id}
            >
              <button
                className="event-item-content"
                type="button"
                onClick={() => onSelectEvent(event.id)}
              >
                <span className="event-date">
                  {eventTimingLabel(event, 'Conditional', rpDateTimeFormat, rpWeekdayLanguage)}
                </span>
                <span className="event-title">{event.title}</span>
                {event.channel === 'phone' && (
                  <span className="event-source">{eventPhoneLabel(event)}</span>
                )}
                {event.details && (
                  <span className="event-source">{event.details}</span>
                )}
                {(event.sourceNote || event.sourceTurnNumber !== undefined) && (
                  <span className="event-source">
                    {event.sourceNote ?? `Turn ${event.sourceTurnNumber}`}
                  </span>
                )}
              </button>
              <button
                className="event-cancel-button"
                type="button"
                aria-label={`Cancel event ${event.title}`}
                title="Cancel event"
                onClick={() => onCancelEvent(event.id)}
              >
                <span aria-hidden="true">X</span>
              </button>
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <div className="events-empty">
              {eventManagerAvailable ? 'No upcoming events.' : 'Event Manager not connected.'}
            </div>
          )}
        </div>
      </div>
      <div className="event-detail" aria-label="Selected event">
        {selectedEvent ? (
          <>
            <div className="event-detail-header">
              <span>
                {eventTimingLabel(
                  selectedEvent,
                  'Conditional event',
                  rpDateTimeFormat,
                  rpWeekdayLanguage,
                )}
              </span>
              <strong>{selectedEvent.title}</strong>
            </div>
            <div className="event-detail-body">
              <div>
                <small>Mode</small>
                <span>
                  {selectedEvent.channel === 'phone'
                    ? eventPhoneLabel(selectedEvent)
                    : 'Chat scene'}
                </span>
              </div>
              {selectedEvent.details && (
                <div>
                  <small>Details</small>
                  <span>{selectedEvent.details}</span>
                </div>
              )}
              {selectedEvent.condition && (
                <div>
                  <small>Condition</small>
                  <span>{selectedEvent.condition}</span>
                </div>
              )}
              {selectedEvent.requestedBy && (
                <div>
                  <small>Requested by</small>
                  <span>{selectedEvent.requestedBy}</span>
                </div>
              )}
              {selectedEvent.assignedTo && (
                <div>
                  <small>For</small>
                  <span>{selectedEvent.assignedTo}</span>
                </div>
              )}
              {(selectedEvent.sourceNote || selectedEvent.sourceTurnNumber !== undefined) && (
                <div>
                  <small>Source</small>
                  <span>{selectedEvent.sourceNote ?? `Turn ${selectedEvent.sourceTurnNumber}`}</span>
                </div>
              )}
            </div>
            <textarea
              className="event-prompt-preview"
              value={eventGraphInputText(selectedEvent)}
              readOnly
              rows={8}
            />
            <button
              className="event-run-button"
              type="button"
              onClick={onRunEvent}
              disabled={runDisabled}
            >
              {isRunning ? 'Running ...' : 'Run Event'}
            </button>
          </>
        ) : (
          <div className="events-empty">No event selected.</div>
        )}
      </div>
    </div>
  );
}
