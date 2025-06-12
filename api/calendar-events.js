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

export default async function handler(req, res) {
    // Enable CORS - SAME AS BEFORE
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

        // Initialize Google Auth - SAME AS BEFORE
        const auth = new google.auth.GoogleAuth({
            credentials: SERVICE_ACCOUNT_KEY,
            scopes: ['https://www.googleapis.com/auth/calendar.readonly']
        });

        // Get authenticated client - SAME AS BEFORE
        const authClient = await auth.getClient();
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // ONLY CHANGE: Check if date is provided in request body
        const { date } = req.body || {};

        let timeMin, timeMax;

        if (date) {
            // If date provided, fetch just that day
            timeMin = new Date(date + 'T00:00:00');
            timeMax = new Date(date + 'T23:59:59');
            console.log(`📅 Fetching events for specific date: ${date}`);
        } else {
            // DEFAULT BEHAVIOR - SAME AS BEFORE
            timeMin = new Date();
            timeMin.setDate(timeMin.getDate() - 7);

            timeMax = new Date();
            timeMax.setDate(timeMax.getDate() + 30);
        }

        console.log('📅 Fetching calendar events...');

        // Fetch events - SAME AS BEFORE except maxResults increased
        const response = await calendar.events.list({
            calendarId: 'dario@shopibro.com',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: date ? 50 : 250  // 50 for single day, 250 for date range
        });

        // Map events - EXACTLY THE SAME
        const events = response.data.items?.map(event => ({
            id: event.id,
            title: event.summary || 'No Title',
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description || ''
        })) || [];

        console.log(`✅ Found ${events.length} events`);

        // Return response - EXACTLY THE SAME FORMAT
        return res.status(200).json({
            success: true,
            events: events
        });

    } catch (error) {
        console.error('❌ Calendar API error:', error);
        // Error response - EXACTLY THE SAME
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}