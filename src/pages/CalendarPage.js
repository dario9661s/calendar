// src/pages/CalendarPage.js - Clean UX without warning box
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import EventsList from '../components/EventList';
import { loadGoogleCalendarEvents } from '../services/googleCalendar';

function CalendarPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { date } = useParams();
    const location = useLocation();

    useEffect(() => {
        // Parse date from URL
        if (date) {
            try {
                // Parse the date correctly from YYYY-MM-DD format
                const urlDate = new Date(date + 'T00:00:00'); // Add time to avoid timezone issues
                console.log('URL date parameter:', date);
                console.log('Parsed URL date:', urlDate);
                console.log('Parsed date string:', urlDate.toDateString());

                if (!isNaN(urlDate.getTime())) {
                    setSelectedDate(urlDate);
                } else {
                    console.error('Invalid date parsed from URL:', date);
                    setSelectedDate(new Date()); // fallback to today
                }
            } catch (error) {
                console.error('Error parsing date parameter:', date, error);
                setSelectedDate(new Date()); // fallback to today
            }
        } else {
            console.log('No date parameter, using current date');
            setSelectedDate(new Date());
        }

        // Load calendar data immediately
        loadCalendarData();
    }, [date, location]);

    const loadCalendarData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🚀 Loading calendar events...');

            // ✅ Define targetDate FIRST
            let targetDate = new Date(); // default
            if (date) {
                try {
                    targetDate = new Date(date + 'T00:00:00');
                    console.log('Using target date from URL:', targetDate);
                } catch (error) {
                    console.error('Error parsing date from URL:', error);
                }
            }

            // ✅ NOW use it
            const calendarEvents = await loadGoogleCalendarEvents(targetDate);

            // Get conflict times from URL parameters
            const urlParams = new URLSearchParams(location.search);
            const conflictParam = urlParams.get('conflicts');
            const conflictTimes = conflictParam ? decodeURIComponent(conflictParam).split('|') : [];

            console.log('URL conflict parameter:', conflictParam);
            console.log('Parsed conflict times:', conflictTimes);

            // Mark events as conflicts based on URL parameters
            const eventsWithConflicts = markConflictEvents(calendarEvents, conflictTimes, targetDate);
            setEvents(eventsWithConflicts);

            console.log('✅ Calendar events loaded successfully');
            console.log('All events loaded:', eventsWithConflicts.map(e => ({
                title: e.title,
                start: e.start,
                parsedDate: new Date(e.start).toLocaleString()
            })));
        } catch (err) {
            setError('Failed to load calendar events: ' + err.message);
            console.error('Calendar load error:', err);
        } finally {
            setLoading(false);
        }
    };
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

        console.log('=== CONFLICT MATCHING DEBUG ===');
        console.log('Target date:', targetDate);
        console.log('Target date string:', targetDate.toDateString());
        console.log('Conflict times to match:', conflictTimes);
        console.log('Total events to check:', events.length);

        // Parse all conflict time ranges
        const parsedConflicts = conflictTimes.map(parseConflictTime).filter(Boolean);
        console.log('Parsed conflicts:', parsedConflicts);

        const result = events.map(event => {
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

            console.log(`\n--- CHECKING EVENT: ${event.title} ---`);
            console.log(`Event time: ${eventStart24} - ${eventEnd24}`);

            // Check if this event matches any conflict time
            const hasConflict = parsedConflicts.some(conflict => {
                const startMatch = eventStart24 === conflict.start24;
                const endMatch = eventEnd24 === conflict.end24;
                const isMatch = startMatch && endMatch;

                console.log(`  Comparing with conflict: ${conflict.start24} - ${conflict.end24}`);
                console.log(`  Start match: ${eventStart24} === ${conflict.start24} = ${startMatch}`);
                console.log(`  End match: ${eventEnd24} === ${conflict.end24} = ${endMatch}`);
                console.log(`  Overall match: ${isMatch}`);

                return isMatch;
            });

            if (hasConflict) {
                console.log(`🔴 CONFLICT FOUND for: ${event.title}`);
            } else {
                console.log(`✅ No conflict for: ${event.title}`);
            }

            return {
                ...event,
                hasConflict: hasConflict
            };
        });

        const conflictEvents = result.filter(event => event.hasConflict);
        console.log(`\n=== FINAL RESULT ===`);
        console.log(`Total events with conflicts: ${conflictEvents.length}`);
        conflictEvents.forEach(event => {
            console.log(`- ${event.title} (${event.start})`);
        });
        console.log('=== END DEBUG ===\n');

        return result;
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