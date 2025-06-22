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

    // Calendar priority for overlapping events
    const CALENDAR_PRIORITY = {
        'Family': 1,  // Highest priority
        'Work': 2,
        'Team': 3
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

    // Group overlapping events
    const groupOverlappingEvents = (slotEvents) => {
        const groups = [];

        slotEvents.forEach(event => {
            const eventStart = new Date(event.start).getTime();
            const eventEnd = new Date(event.end).getTime();

            let addedToGroup = false;

            for (const group of groups) {
                // Check if event overlaps with any event in this group
                const overlaps = group.some(groupEvent => {
                    const groupStart = new Date(groupEvent.start).getTime();
                    const groupEnd = new Date(groupEvent.end).getTime();

                    return (eventStart < groupEnd && eventEnd > groupStart);
                });

                if (overlaps) {
                    group.push(event);
                    addedToGroup = true;
                    break;
                }
            }

            if (!addedToGroup) {
                groups.push([event]);
            }
        });

        return groups;
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
                {timelineData.map((slot, index) => {
                    const overlappingGroups = groupOverlappingEvents(slot.events);

                    return (
                        <div key={slot.hour} className="timeline-slot">
                            <div className="time-label">
                                {slot.time12}
                            </div>
                            <div className="slot-content">
                                {overlappingGroups.length > 0 ? (
                                    overlappingGroups.map((group, groupIndex) => {
                                        // Sort by priority
                                        const sortedGroup = [...group].sort((a, b) =>
                                            (CALENDAR_PRIORITY[a.calendarName] || 999) -
                                            (CALENDAR_PRIORITY[b.calendarName] || 999)
                                        );

                                        const primaryEvent = sortedGroup[0];
                                        const overlappingEvents = sortedGroup.slice(1);

                                        return (
                                            <div
                                                key={primaryEvent.id || groupIndex}
                                                className={`event-item ${primaryEvent.hasConflict ? 'conflict-event' : ''}`}
                                                style={{
                                                    borderLeft: `4px solid ${primaryEvent.calendarColor || '#4285F4'}`
                                                }}
                                            >
                                                <div className="event-header">
                                                    <span
                                                        className="calendar-badge"
                                                        style={{backgroundColor: primaryEvent.calendarColor || '#4285F4'}}
                                                    >
                                                        {primaryEvent.calendarName || 'Calendar'}
                                                    </span>

                                                    {/* Show overlap indicators */}
                                                    {overlappingEvents.length > 0 && (
                                                        <div className="overlap-pills">
                                                            {overlappingEvents.map((event, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="mini-pill"
                                                                    style={{backgroundColor: event.calendarColor || '#999'}}
                                                                    title={`Also scheduled: ${event.title} (${event.calendarName})`}
                                                                >
                                                                    {(event.calendarName || 'C')[0]}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {primaryEvent.hasConflict && <span className="conflict-indicator-icon">⚡</span>}
                                                </div>

                                                <div className="event-time">
                                                    {format(new Date(primaryEvent.start), 'h:mm a')} - {format(new Date(primaryEvent.end), 'h:mm a')}
                                                </div>

                                                <div className="event-title">
                                                    {primaryEvent.title}
                                                    {primaryEvent.hasConflict && (
                                                        <span className="conflict-text">SCHEDULING CONFLICT</span>
                                                    )}
                                                </div>

                                                {primaryEvent.description && (
                                                    <div className="event-description">{primaryEvent.description}</div>
                                                )}

                                                {/* Hover tooltip for overlapping events */}
                                                {overlappingEvents.length > 0 && (
                                                    <div className="overlap-tooltip">
                                                        <div className="tooltip-header">Also scheduled:</div>
                                                        {overlappingEvents.map((event, idx) => (
                                                            <div key={idx} className="tooltip-event">
                                                                <span
                                                                    className="tooltip-badge"
                                                                    style={{backgroundColor: event.calendarColor || '#999'}}
                                                                >
                                                                    {event.calendarName}
                                                                </span>
                                                                {event.title}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className={`event-indicator ${primaryEvent.hasConflict ? 'conflict-indicator-line' : ''}`}></div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div
                                        className="free-time-slot"
                                        onClick={(e) => {
                                            const timeSlot = slot.time12;
                                            const dateString = format(date, 'yyyy-MM-dd');
                                            const message = `sam at ${timeSlot} on ${dateString}`;

                                            // Copy to clipboard
                                            navigator.clipboard.writeText(message).then(() => {
                                                // Visual feedback on the clicked element
                                                const button = e.currentTarget;
                                                const textElement = button.querySelector('.free-time-text');
                                                const originalText = textElement.textContent;

                                                textElement.textContent = '✅ Copied!';
                                                button.style.backgroundColor = '#e8f5e9';

                                                setTimeout(() => {
                                                    textElement.textContent = originalText;
                                                    button.style.backgroundColor = '';
                                                }, 2000);

                                                // Simple notification at top
                                                const notification = document.createElement('div');
                                                notification.className = 'copy-notification';
                                                notification.textContent = 'Time slot copied! Paste in Telegram chat.';
                                                document.body.appendChild(notification);

                                                // Remove notification after animation
                                                setTimeout(() => {
                                                    notification.remove();
                                                }, 3000);
                                            }).catch(() => {
                                                // Fallback if clipboard fails
                                                alert(`Copy this message:\n\n${message}`);
                                            });
                                        }}
                                        style={{cursor: 'pointer'}}
                                    >
                                        <span className="free-time-text">🕊️ Free time - Click to select</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default EventsList;