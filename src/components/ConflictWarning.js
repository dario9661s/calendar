import React from 'react';

function ConflictWarning({ conflicts }) {
    return (
        <div className="conflict-warning">
            <div className="conflict-header">
                <span className="conflict-icon">⚠️</span>
                <h3>Schedule Alert</h3>
            </div>
            {conflicts.map((conflict, index) => (
                <div key={index} className="conflict-item">
                    <p className="conflict-message">{conflict.message}</p>
                    <div className="conflict-events">
                        {conflict.events.map((event, eventIndex) => (
                            <div key={eventIndex} className="conflict-event">
                <span className="conflict-time">
                  {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                                <span className="conflict-title">{event.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ConflictWarning;