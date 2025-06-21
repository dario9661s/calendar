// src/pages/CalendarPage.js - Complete file with all fixes
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
                // More reliable date parsing
                const [year, month, day] = date.split('-').map(num => parseInt(num));
                const urlDate = new Date(year, month - 1, day); // month is 0-indexed
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

            // Parse the target date
            let targetDate;
            if (date) {
                // Parse YYYY-MM-DD format more reliably
                const [year, month, day] = date.split('-').map(num => parseInt(num));
                targetDate = new Date(year, month - 1, day); // month is 0-indexed
                console.log('Parsed date from URL:', date, '=>', targetDate.toDateString());
            } else {
                targetDate = new Date();
                console.log('Using today:', targetDate.toDateString());
            }

            // Load events from Google Calendar
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

            // DEBUG: Log what's happening
            console.log('🔍 DEBUG INFO:');
            console.log('URL:', window.location.href);
            console.log('Conflicts param:', conflictParam);
            console.log('Events for date:', eventsWithConflicts.filter(e => {
                return new Date(e.start).toDateString() === targetDate.toDateString();
            }).map(e => ({
                title: e.title,
                time: `${new Date(e.start).getHours()}:${new Date(e.start).getMinutes().toString().padStart(2, '0')} - ${new Date(e.end).getHours()}:${new Date(e.end).getMinutes().toString().padStart(2, '0')}`,
                hasConflict: e.hasConflict
            })));

            // Test the conversion function
            console.log('Test conversions:');
            console.log('4:00 PM =>', convertTo24Hour('4:00 PM'));
            console.log('5:00 PM =>', convertTo24Hour('5:00 PM'));
        } catch (err) {
            setError('Failed to load calendar events: ' + err.message);
            console.error('Calendar load error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Convert 12-hour time to 24-hour time for comparison
    const convertTo24Hour = (time12h) => {
        const [time, period] = time12h.trim().split(/\s+/);
        let [hours, minutes = '00'] = time.split(':');
        hours = parseInt(hours);

        if (period.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    // Extract time range from conflict string
    const parseConflictTime = (conflictTime) => {
        console.log('🕐 Parsing conflict time:', conflictTime);

        // More flexible regex that handles various formats
        const timeMatch = conflictTime.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);

        if (!timeMatch) {
            console.log('❌ No match for conflict time format');
            return null;
        }

        const start = timeMatch[1].trim();
        const end = timeMatch[2].trim();

        const start24 = convertTo24Hour(start);
        const end24 = convertTo24Hour(end);

        console.log('🕐 Parsed times:', {
            original: conflictTime,
            start12: start,
            end12: end,
            start24: start24,
            end24: end24
        });

        return {
            start24: start24,
            end24: end24,
            start12: start,
            end12: end
        };
    };

    // Mark events as conflicts based on the times from n8n
    const markConflictEvents = (events, conflictTimes, targetDate) => {
        if (conflictTimes.length === 0) return events;

        console.log('=== CONFLICT MATCHING DEBUG ===');
        console.log('Conflict times from URL:', conflictTimes);
        console.log('Target date:', targetDate.toDateString());

        // Parse conflict times
        const parsedConflicts = conflictTimes.map(conflictTime => {
            const parsed = parseConflictTime(conflictTime);
            if (parsed) {
                console.log(`Parsed conflict: "${conflictTime}" =>`, parsed);
            }
            return parsed;
        }).filter(Boolean);

        console.log('All parsed conflicts:', parsedConflicts);

        return events.map(event => {
            // Check if event is on the target date
            const eventDate = new Date(event.start);
            if (eventDate.toDateString() !== targetDate.toDateString()) {
                return event;
            }

            // Get event times in 24-hour format
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            const eventStart24 = `${eventStart.getHours().toString().padStart(2, '0')}:${eventStart.getMinutes().toString().padStart(2, '0')}`;
            const eventEnd24 = `${eventEnd.getHours().toString().padStart(2, '0')}:${eventEnd.getMinutes().toString().padStart(2, '0')}`;

            console.log(`Checking event "${event.title}": ${eventStart24} - ${eventEnd24}`);

            // Check if this event matches any conflict
            const hasConflict = parsedConflicts.some(conflict => {
                const matches = eventStart24 === conflict.start24 && eventEnd24 === conflict.end24;
                if (matches) {
                    console.log(`✅ CONFLICT MATCH FOUND for "${event.title}"`);
                }
                return matches;
            });

            return {
                ...event,
                hasConflict: hasConflict
            };
        });
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