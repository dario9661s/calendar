// api/calendar-events.js - Updated to support multiple calendars
const { google } = require('googleapis');

const SERVICE_ACCOUNT_KEY = {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
};

// Calendar configuration with names and colors
const CALENDAR_CONFIG = {
    'dario@shopibro.com': {
        name: 'Work',
        color: '#4285F4' // Google Blue
    },
    'c_9b56b3b5e068d8ab18e98a7c04c45909cd62b3c61f18f1121e06ad92d706059a@group.calendar.google.com': {
        name: 'Team',
        color: '#0B8043' // Green
    },
    'c_8adfd1036fbf497dc91f3a748ceea929051812612432f3380301fdc070309c59@group.calendar.google.com': {
        name: 'Family',
        color: '#D50000' // Red
    }
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔑 Getting service account auth...');

        // Initialize Google Auth
        const auth = new google.auth.GoogleAuth({
            credentials: SERVICE_ACCOUNT_KEY,
            scopes: ['https://www.googleapis.com/auth/calendar.readonly']
        });

        // Get authenticated client
        const authClient = await auth.getClient();
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // Check if date is provided in request body
        const { date } = req.body || {};

        let timeMin, timeMax;

        if (date) {
            // If date provided, fetch just that day
            timeMin = new Date(date + 'T00:00:00');
            timeMax = new Date(date + 'T23:59:59');
            console.log(`📅 Fetching events for specific date: ${date}`);
        } else {
            // Default behavior - fetch range
            timeMin = new Date();
            timeMin.setDate(timeMin.getDate() - 7);

            timeMax = new Date();
            timeMax.setDate(timeMax.getDate() + 30);
            console.log(`📅 Fetching events for date range`);
        }

        console.log('Time range:', {
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString()
        });

        // Fetch events from ALL calendars
        const allEvents = [];

        for (const [calendarId, config] of Object.entries(CALENDAR_CONFIG)) {
            try {
                console.log(`📊 Fetching from ${config.name} calendar...`);

                const response = await calendar.events.list({
                    calendarId: calendarId,
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime',
                    maxResults: date ? 50 : 250
                });

                // Map events to our format with calendar info
                const calendarEvents = response.data.items?.map(event => ({
                    id: event.id,
                    title: event.summary || 'No Title',
                    start: event.start.dateTime || event.start.date,
                    end: event.end.dateTime || event.end.date,
                    description: event.description || '',
                    // NEW: Add calendar information
                    calendarId: calendarId,
                    calendarName: config.name,
                    calendarColor: config.color
                })) || [];

                console.log(`✅ Found ${calendarEvents.length} events in ${config.name} calendar`);
                allEvents.push(...calendarEvents);

            } catch (error) {
                console.error(`❌ Error fetching ${config.name} calendar:`, error.message);
                // Continue with other calendars even if one fails
            }
        }

        // Sort all events by start time
        allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

        console.log(`✅ Total events found across all calendars: ${allEvents.length}`);

        // Return response
        return res.status(200).json({
            success: true,
            events: allEvents,
            calendars: Object.entries(CALENDAR_CONFIG).map(([id, config]) => ({
                id,
                name: config.name,
                color: config.color
            }))
        });

    } catch (error) {
        console.error('❌ Calendar API error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}