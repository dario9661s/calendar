// src/pages/CalendarPage.js - Enhanced with URL Conflict Parameters
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import EventsList from '../components/EventList';
import ConflictWarning from '../components/ConflictWarning';
import { loadGoogleCalendarEvents } from '../services/googleCalendar';

function CalendarPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [conflicts, setConflicts] = useState([]);
    const { date } = useParams();
    const location = useLocation();

    useEffect(() => {
        // Parse date from URL
        if (date) {
            try {
                const urlDate = new Date(date);
                if (!isNaN(urlDate.getTime())) {
                    setSelectedDate(urlDate);
                }
            } catch (error) {
                console.error('Invalid date parameter:', date);
            }
        }

        // Load calendar data immediately
        loadCalendarData();
    }, [date, location]);

    const loadCalendarData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🚀 Loading calendar events...');

            const calendarEvents = await loadGoogleCalendarEvents();

            // Get conflict times from URL parameters
            const urlParams = new URLSearchParams(location.search);
            const conflictParam = urlParams.get('conflicts');
            const conflictTimes = conflictParam ? decodeURIComponent(conflictParam).split('|') : [];

            console.log('URL conflict parameter:', conflictParam);
            console.log('Parsed conflict times:', conflictTimes);

            // Mark events as conflicts based on URL parameters
            const eventsWithConflicts = markConflictEvents(calendarEvents, conflictTimes, selectedDate);
            setEvents(eventsWithConflicts);
            checkForConflicts(eventsWithConflicts, selectedDate, conflictTimes.length > 0);

            console.log('✅ Calendar events loaded successfully');
        } catch (err) {
            setError('Failed to load calendar events: ' + err.message);
            console.error('Calendar load error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Mark events as conflicts based on the times from n8n
    // Convert 12-hour time to 24-hour time for comparison
    const convertTo24Hour = (time12h) => {
        const [time, modifier] = time12h.split(/\s*(AM|PM)/i);
        let [hours, minutes] = time.split(':');

        if (hours === '12') {
            hours = modifier.toUpperCase() === 'AM' ? '00' : '12';
        } else if (modifier.toUpperCase() === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }

        // Pad with zeros if needed
        hours = hours.toString().padStart(2, '0');
        minutes = minutes ? minutes.padStart(2, '0') : '00';

        return `${hours}:${minutes}`;
    };

    // Convert 24-hour time to 12-hour time for comparison
    const convertTo12Hour = (time24h) => {
        const [hours, minutes] = time24h.split(':');
        const hour24 = parseInt(hours, 10);
        const minute = minutes || '00';

        if (hour24 === 0) {
            return `12:${minute} AM`;
        } else if (hour24 < 12) {
            return `${hour24}:${minute} AM`;
        } else if (hour24 === 12) {
            return `12:${minute} PM`;
        } else {
            return `${hour24 - 12}:${minute} PM`;
        }
    };

    // Extract time range from conflict string
    const parseConflictTime = (conflictTime) => {
        // Handle formats like "12 PM - 1:30 PM" or "12:00 PM - 1:30 PM"
        const timeMatch = conflictTime.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
        if (timeMatch) {
            const start = timeMatch[1].trim();
            const end = timeMatch[2].trim();
            return {
                start24: convertTo24Hour(start),
                end24: convertTo24Hour(end),
                start12: start,
                end12: end
            };
        }
        return null;
    };

    // Mark events as conflicts based on the times from n8n
    const markConflictEvents = (events, conflictTimes, targetDate) => {
        if (conflictTimes.length === 0) return events;

        console.log('Marking conflicts for date:', targetDate);
        console.log('Conflict times to match:', conflictTimes);

        // Parse all conflict time ranges
        const parsedConflicts = conflictTimes.map(parseConflictTime).filter(Boolean);
        console.log('Parsed conflicts:', parsedConflicts);

        return events.map(event => {
            const eventDate = new Date(event.start);
            if (eventDate.toDateString() !== targetDate.toDateString()) {
                return event;
            }

            // Get event time in both formats
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            const eventStart24 = eventStart.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const eventEnd24 = eventEnd.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            console.log(`Checking event: ${eventStart24} - ${eventEnd24} (${event.title})`);

            // Check if this event matches any conflict time
            const hasConflict = parsedConflicts.some(conflict => {
                const startMatch = eventStart24 === conflict.start24;
                const endMatch = eventEnd24 === conflict.end24;
                const isMatch = startMatch && endMatch;

                console.log(`  Comparing with conflict: ${conflict.start24} - ${conflict.end24}`);
                console.log(`  Start match: ${startMatch}, End match: ${endMatch}, Overall: ${isMatch}`);

                return isMatch;
            });

            if (hasConflict) {
                console.log(`✅ CONFLICT FOUND for: ${event.title}`);
            }

            return {
                ...event,
                hasConflict: hasConflict
            };
        });
    };
    // Helper function to match time ranges more flexibly

    const checkForConflicts = (events, targetDate, hasUrlConflicts) => {
        const dateEvents = events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === targetDate.toDateString();
        });

        const conflictingEvents = dateEvents.filter(event => event.hasConflict);

        if (hasUrlConflicts && conflictingEvents.length > 0) {
            setConflicts([{
                message: `⚠️ Schedule conflicts detected from your assistant for ${targetDate.toDateString()}`,
                events: conflictingEvents,
                isFromAssistant: true
            }]);
        } else if (dateEvents.length >= 3) {
            setConflicts([{
                message: `Busy schedule detected for ${targetDate.toDateString()}`,
                events: dateEvents
            }]);
        } else {
            setConflicts([]);
        }
    };

    const getEventsForDate = (date) => {
        return events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === date.toDateString();
        });
    };

    if (loading) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>📅 Calendar</h1>
                    <p>Loading your events...</p>
                </div>
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Connecting to Google Calendar...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>📅 Calendar</h1>
                    <p>Unable to load events</p>
                </div>
                <div className="error">
                    <h3>Error</h3>
                    <p>{error}</p>
                    <button onClick={loadCalendarData} className="retry-button">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>📅 Schedule Overview</h1>
                <p>Events for the selected day</p>
            </div>

            {conflicts.length > 0 && (
                <ConflictWarning conflicts={conflicts} />
            )}

            <EventsList
                events={getEventsForDate(selectedDate)}
                date={selectedDate}
            />

            {date && (
                <div className="url-info">
                    <p>📍 Showing events for: {selectedDate.toDateString()}</p>
                </div>
            )}
        </div>
    );
}

export default CalendarPage;