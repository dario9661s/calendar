// src/services/googleCalendar.js - Complete file
console.log('🔧 Using backend API for calendar authentication');

// Service account authentication - no user auth required
export const isAuthenticated = () => {
    return true;
};

export const initiateGoogleAuth = () => {
    console.log('Service account authentication - no user auth required');
};

export const logout = () => {
    console.log('Service account - no logout needed');
};

export const handleAuthCallback = async (code) => {
    console.log('Service account - no auth callback needed');
    return true;
};

// Load calendar events with optional date parameter
export const loadGoogleCalendarEvents = async (targetDate = null) => {
    console.log('🔑 Loading calendar events via backend API...');

    try {
        // Build request body
        let requestBody = {};

        // Only add date if provided
        if (targetDate) {
            const year = targetDate.getFullYear();
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const day = String(targetDate.getDate()).padStart(2, '0');
            requestBody = { date: `${year}-${month}-${day}` };
            console.log('📅 Requesting events for specific date:', requestBody.date);
        } else {
            console.log('📅 Requesting events for default date range');
        }

        // Call backend API
        const response = await fetch('https://calendar-lac-six.vercel.app/api/calendar-events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Handle response
        if (data.success) {
            console.log(`✅ Loaded ${data.events.length} events from backend`);
            console.log('Events:', data.events.map(e => ({
                title: e.title,
                start: e.start,
                startTime: new Date(e.start).toLocaleString()
            })));
            return data.events;
        } else {
            throw new Error(data.error || 'Failed to load events');
        }

    } catch (error) {
        console.error('💥 Error loading calendar events:', error);
        throw error;
    }
};