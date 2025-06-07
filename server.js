// server.js - Backend for calendar authentication
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build')); // Serve React build files

// Service Account Credentials
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
// Initialize Google Auth
const auth = new google.auth.GoogleAuth({
    credentials: SERVICE_ACCOUNT_KEY,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly']
});

// Calendar API endpoint (POST)
app.post('/api/calendar-events', async (req, res) => {
    try {
        console.log('🔑 Getting service account auth...');

        // Get authenticated client
        const authClient = await auth.getClient();
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // Set time range
        const timeMin = new Date();
        timeMin.setDate(timeMin.getDate() - 7);

        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 30);

        console.log('📅 Fetching calendar events...');

        // Fetch events from your specific calendar (replace with your email)
        const response = await calendar.events.list({
            calendarId: 'dario@shopibro.com', // Replace with YOUR email address
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 50
        });

        const events = response.data.items?.map(event => ({
            id: event.id,
            title: event.summary || 'No Title',
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description || ''
        })) || [];

        console.log(`✅ Found ${events.length} events`);

        res.json({
            success: true,
            events: events
        });

    } catch (error) {
        console.error('❌ Calendar API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Calendar API endpoint (GET for testing in browser)
app.get('/api/calendar-events', async (req, res) => {
    try {
        console.log('🔑 Getting service account auth...');

        // Get authenticated client
        const authClient = await auth.getClient();
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // Set time range
        const timeMin = new Date();
        timeMin.setDate(timeMin.getDate() - 7);

        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 30);

        console.log('📅 Fetching calendar events...');

        // Fetch events from your specific calendar (replace with your email)
        const response = await calendar.events.list({
            calendarId: 'dariol@shopibro.com', // Replace with YOUR email address
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 50
        });

        const events = response.data.items?.map(event => ({
            id: event.id,
            title: event.summary || 'No Title',
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description || ''
        })) || [];

        console.log(`✅ Found ${events.length} events`);

        res.json({
            success: true,
            events: events
        });

    } catch (error) {
        console.error('❌ Calendar API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Calendar API backend is running' });
});

// Simple fallback for non-API routes (instead of trying to serve React build)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.send(`
      <h1>Calendar Backend Running</h1>
      <p>API endpoints:</p>
      <ul>
        <li>GET /api/health</li>
        <li>POST /api/calendar-events</li>
      </ul>
    `);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Calendar backend running on port ${PORT}`);
    console.log(`📅 Calendar API available at http://localhost:${PORT}/api/calendar-events`);
});