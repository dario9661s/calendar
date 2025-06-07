// src/services/googleCalendar.js - Service Account Version

// src/services/googleCalendar.js - Frontend with Backend API
console.log('🔧 Using backend API for calendar authentication');

// Simplified authentication functions (always return true since service account handles auth)
export const isAuthenticated = () => {
    return true; // Service account is always "authenticated"
};

export const initiateGoogleAuth = () => {
    // Not needed for service account
    console.log('Service account authentication - no user auth required');
};

export const logout = () => {
    // Not needed for service account
    console.log('Service account - no logout needed');
};

export const handleAuthCallback = async (code) => {
    // Not needed for service account, but keeping for compatibility
    console.log('Service account - no auth callback needed');
    return true;
};

// Main function to load calendar events using backend API
export const loadGoogleCalendarEvents = async () => {
    console.log('🔑 Loading calendar events via backend API...');

    try {
        // Use your ngrok URL here (replace with your actual ngrok URL)
        const response = await fetch('https://f1e4-109-245-33-164.ngrok-free.app/api/calendar-events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            console.log(`✅ Loaded ${data.events.length} events from backend`);
            return data.events;
        } else {
            throw new Error(data.error || 'Failed to load events');
        }

    } catch (error) {
        console.error('💥 Error loading calendar events:', error);
        throw error;
    }
};