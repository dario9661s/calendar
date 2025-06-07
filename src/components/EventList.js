import React from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

function EventsList({ events, date }) {
    const formatTime = (dateString) => {
        return format(new Date(dateString), 'HH:mm');
    };

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
            </div>
            <div className="events">
                {events.map((event, index) => (
                    <div key={event.id || index} className="event-item">
                        <div className="event-time">
                            {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        <div className="event-title">{event.title}</div>
                        {event.description && (
                            <div className="event-description">{event.description}</div>
                        )}
                        <div className="event-indicator"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EventsList;