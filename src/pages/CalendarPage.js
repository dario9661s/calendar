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
    const markConflictEvents = (events, conflictTimes, targetDate) => {
        if (conflictTimes.length === 0) return events;

        console.log('Marking conflicts for date:', targetDate);
        console.log('Conflict times to match:', conflictTimes);

        return events.map(event => {
            const eventDate = new Date(event.start);
            if (eventDate.toDateString() !== targetDate.toDateString()) {
                return event;
            }

            // Check if this event's time matches any conflict time
            const eventTimeRange = formatEventTimeRange(event);
            console.log('Checking event:', eventTimeRange);

            const hasConflict = conflictTimes.some(conflictTime => {
                const cleanConflictTime = conflictTime.trim();
                const isMatch = cleanConflictTime.includes(eventTimeRange) ||
                    eventTimeRange.includes(cleanConflictTime) ||
                    timeRangesMatch(eventTimeRange, cleanConflictTime);

                if (isMatch) {
                    console.log('CONFLICT FOUND:', eventTimeRange, 'matches', cleanConflictTime);
                }
                return isMatch;
            });

            return {
                ...event,
                hasConflict: hasConflict
            };
        });
    };

    // Helper function to match time ranges more flexibly
    const timeRangesMatch = (eventTime, conflictTime) => {
        // Extract start and end times from both ranges
        const eventMatch = eventTime.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/g);
        const conflictMatch = conflictTime.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/g);

        if (!eventMatch || !conflictMatch || eventMatch.length < 2 || conflictMatch.length < 2) {
            return false;
        }

        // Compare start and end times
        return (eventMatch[0].replace(/\s/g, '') === conflictMatch[0].replace(/\s/g, '') &&
            eventMatch[1].replace(/\s/g, '') === conflictMatch[1].replace(/\s/g, ''));
    };

    const formatEventTimeRange = (event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const startTime = start.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        const endTime = end.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        return `${startTime} - ${endTime}`;
    };

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