import React from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

function EventsList({ events, date }) {
    const formatDate = (date) => {
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'EEEE, MMMM dd, yyyy');
    };

    const getDayEmoji = (date) => {
        if (isToday(date)) return '🎯';
        if (isTomorrow(date)) return '⏭️';
        if (isYesterday(date)) return '⏮️';
        return '📅';
    };

    // Generate time slots from 8 AM to 8 PM
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour <= 20; hour++) {
            const time24 = `${hour.toString().padStart(2, '0')}:00`;
            const time12 = format(new Date(`2000-01-01T${time24}`), 'h:mm a');
            slots.push({
                hour,
                time24,
                time12,
                events: []
            });
        }
        return slots;
    };

    // Place events in their corresponding time slots
    const getTimelineData = () => {
        const slots = generateTimeSlots();

        events.forEach(event => {
            const eventStart = new Date(event.start);
            const eventHour = eventStart.getHours();

            // Find the slot this event belongs to
            const slot = slots.find(s => s.hour === eventHour);
            if (slot) {
                slot.events.push(event);
            }
        });

        return slots;
    };

    const timelineData = getTimelineData();
    const conflictCount = events.filter(event => event.hasConflict).length;

    if (events.length === 0) {
        return (
            <div className="events-list">
                <h3>{getDayEmoji(date)} {formatDate(date)}</h3>
                <div className="no-events">
                    <div className="no-events-icon">✅</div>
                    <p>No events scheduled</p>
                    <span>You're free all day!</span>
                </div>
            </div>
        );
    }

    return (
        <div className="events-list">
            <h3>{getDayEmoji(date)} {formatDate(date)}</h3>
            <div className="events-count">
                <span>{events.length} event{events.length !== 1 ? 's' : ''}</span>
                {conflictCount > 0 && (
                    <span className="conflict-badge">
                        ⚡ {conflictCount} conflict{conflictCount !== 1 ? 's' : ''} detected
                    </span>
                )}
            </div>

            <div className="timeline-container">
                {timelineData.map((slot, index) => (
                    <div key={slot.hour} className="timeline-slot">
                        <div className="time-label">
                            {slot.time12}
                        </div>
                        <div className="slot-content">
                            {slot.events.length > 0 ? (
                                slot.events.map((event, eventIndex) => (
                                    <div
                                        key={event.id || eventIndex}
                                        className={`event-item ${event.hasConflict ? 'conflict-event' : ''}`}
                                    >
                                        <div className="event-time">
                                            {event.hasConflict && <span className="conflict-indicator-icon">⚡</span>}
                                            {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                                        </div>
                                        <div className="event-title">
                                            {event.title}
                                            {event.hasConflict && (
                                                <span className="conflict-text">SCHEDULING CONFLICT</span>
                                            )}
                                        </div>
                                        {event.description && (
                                            <div className="event-description">{event.description}</div>
                                        )}
                                        <div className={`event-indicator ${event.hasConflict ? 'conflict-indicator-line' : ''}`}></div>
                                    </div>
                                ))
                            ) : (
                                <div
                                    className="free-time-slot"
                                    onClick={() => {
                                        fetch('https://shpilman.app.n8n.cloud/webhook/calendar-free-slot', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                                timeSlot: slot.time12,
                                                date: format(date, 'yyyy-MM-dd')
                                            })
                                        })
                                            .then(() => {
                                                alert('Time slot sent! You can close this window.');
                                            })
                                            .catch((error) => {
                                                console.error('Error sending time slot:', error);
                                                alert('Failed to send time slot');
                                            });
                                    }}
                                    style={{cursor: 'pointer'}}
                                >
                                    <span className="free-time-text">🕊️ Free time - Click to select</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EventsList;