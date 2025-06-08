// api/contacts.js - Vercel serverless function for Google Contacts
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
        console.log('🔑 Getting service account auth for contacts...');

        // Initialize Google Auth with People API scope
        const auth = new google.auth.GoogleAuth({
            credentials: SERVICE_ACCOUNT_KEY,
            scopes: [
                'https://www.googleapis.com/auth/contacts.readonly',
            ],
            // Domain-wide delegation - specify the user to impersonate
            subject: 'dario@shopibro.com' // Replace with your email
        });

        // Get authenticated client
        const authClient = await auth.getClient();
        const people = google.people({ version: 'v1', auth: authClient });

        const { name } = req.body;

        if (name) {
            // Search for specific contact
            console.log('👥 Searching for contact:', name);

            // First try direct search
            const searchResponse = await people.people.searchContacts({
                query: name,
                readMask: 'names,emailAddresses,phoneNumbers,organizations,photos',
                pageSize: 10
            });

            if (searchResponse.data.results && searchResponse.data.results.length > 0) {
                const person = searchResponse.data.results[0].person;
                const contact = {
                    id: person.resourceName,
                    name: person.names?.[0]?.displayName || 'No Name',
                    email: person.emailAddresses?.[0]?.value || '',
                    phone: person.phoneNumbers?.[0]?.value || '',
                    organization: person.organizations?.[0]?.name || '',
                    photo: person.photos?.[0]?.url || ''
                };

                console.log(`✅ Found contact: ${contact.name}`);
                return res.status(200).json({
                    success: true,
                    contact: contact
                });
            }

            // If search didn't work, try listing all and filtering
            console.log('📋 Falling back to list and filter...');

            const response = await people.people.connections.list({
                resourceName: 'people/me',
                personFields: 'names,emailAddresses,phoneNumbers,organizations,photos',
                pageSize: 100
            });

            const contacts = response.data.connections?.map(person => ({
                id: person.resourceName,
                name: person.names?.[0]?.displayName || 'No Name',
                email: person.emailAddresses?.[0]?.value || '',
                phone: person.phoneNumbers?.[0]?.value || '',
                organization: person.organizations?.[0]?.name || '',
                photo: person.photos?.[0]?.url || ''
            })) || [];

            // Find contact by name (case insensitive)
            const foundContact = contacts.find(c =>
                c.name.toLowerCase().includes(name.toLowerCase())
            );

            if (foundContact) {
                console.log(`✅ Found contact via list: ${foundContact.name}`);
                return res.status(200).json({
                    success: true,
                    contact: foundContact
                });
            } else {
                console.log('❌ Contact not found');
                return res.status(404).json({
                    success: false,
                    error: 'Contact not found'
                });
            }
        } else {
            // No name provided, return error
            return res.status(400).json({
                success: false,
                error: 'Contact name is required'
            });
        }

    } catch (error) {
        console.error('❌ Contacts API error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}