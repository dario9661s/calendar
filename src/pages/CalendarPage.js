// src/pages/CalendarPage.js - Service Account Version
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
    }, [date]);

    const loadCalendarData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🚀 Loading calendar events...');

            const calendarEvents = await loadGoogleCalendarEvents();
            setEvents(calendarEvents);
            checkForConflicts(calendarEvents, selectedDate);

            console.log('✅ Calendar events loaded successfully');
        } catch (err) {
            setError('Failed to load calendar events: ' + err.message);
            console.error('Calendar load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkForConflicts = (events, targetDate) => {
        const dateEvents = events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === targetDate.toDateString();
        });

        if (dateEvents.length >= 3) {
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