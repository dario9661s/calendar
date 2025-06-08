// api/contacts.js - Fixed version without problematic people/me test
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
    console.log('🚀 === CONTACTS API DEBUG START ===');

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
        console.log('🔑 Setting up Google Auth...');
        console.log('Service account client_email:', SERVICE_ACCOUNT_KEY.client_email);
        console.log('Service account project_id:', SERVICE_ACCOUNT_KEY.project_id);

        // Parse body manually if needed
        let body = {};
        if (req.method === 'POST') {
            if (typeof req.body === 'string') {
                body = JSON.parse(req.body);
            } else if (req.body) {
                body = req.body;
            } else {
                body = {};
            }
        }

        console.log('📝 Request body:', body);
        const { name } = body;

        // Initialize Google Auth with People API scope
        console.log('🔐 Creating GoogleAuth instance...');
        const auth = new google.auth.GoogleAuth({
            credentials: SERVICE_ACCOUNT_KEY,
            scopes: [
                'https://www.googleapis.com/auth/contacts.readonly',
                'https://www.googleapis.com/auth/contacts',
                'https://www.googleapis.com/auth/userinfo.profile'
            ],
            // Domain-wide delegation - specify the user to impersonate
            subject: 'dario@shopibro.com'
        });

        console.log('👤 Impersonating user: dario@shopibro.com');
        console.log('🔑 Requested scopes: contacts.readonly, contacts, userinfo.profile');

        // Get authenticated client
        console.log('🤝 Getting auth client...');
        const authClient = await auth.getClient();
        console.log('✅ Auth client created successfully');

        const people = google.people({ version: 'v1', auth: authClient });
        console.log('📞 People API instance created');

        // Skip the people/me test and go straight to contacts
        console.log('🧪 === TESTING CONNECTIONS LIST ===');
        try {
            console.log('📋 Testing connections.list...');
            const connectionsResponse = await people.people.connections.list({
                resourceName: 'people/me',
                personFields: 'names,emailAddresses,phoneNumbers',
                pageSize: 10
            });

            const totalConnections = connectionsResponse.data.totalSize || 0;
            const connections = connectionsResponse.data.connections || [];

            console.log(`📊 Total connections: ${totalConnections}`);
            console.log(`📋 Returned connections: ${connections.length}`);

            console.log('🎯 === ALL CONTACTS FOUND ===');
            console.log(`Total contacts: ${connections.length}`);
            console.log('Full contact list:');
            connections.forEach((connection, index) => {
                const contactName = connection.names?.[0]?.displayName || 'No Name';
                const contactEmail = connection.emailAddresses?.[0]?.value || '';
                const contactPhone = connection.phoneNumbers?.[0]?.value || '';
                console.log(`${index + 1}. ${contactName} (${contactEmail}) ${contactPhone}`);
            });

            if (connections.length === 0) {
                console.log('⚠️ No connections found - domain delegation might still be propagating');
            } else {
                console.log('🎉 SUCCESS! Domain delegation is working!');
            }

        } catch (connectionsError) {
            console.error('❌ connections.list failed:', connectionsError.message);
            console.error('Error status:', connectionsError.code);
            console.error('Error details:', connectionsError.response?.data);

            return res.status(500).json({
                success: false,
                error: 'Failed to list connections',
                details: connectionsError.message,
                errorCode: connectionsError.code
            });
        }

        if (name) {
            console.log('🔍 === SEARCHING FOR SPECIFIC CONTACT ===');
            console.log('Searching for:', name);

            // Try search API first
            try {
                console.log('🔎 Trying searchContacts API...');
                const searchResponse = await people.people.searchContacts({
                    query: name,
                    readMask: 'names,emailAddresses,phoneNumbers,organizations,photos',
                    pageSize: 10
                });

                console.log('Search response:', searchResponse.data);

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

                    console.log(`✅ Found contact via search: ${contact.name}`);
                    return res.status(200).json({
                        success: true,
                        contact: contact,
                        method: 'searchContacts'
                    });
                }
            } catch (searchError) {
                console.log('⚠️ searchContacts not available, trying list method...');
                console.log('Search error:', searchError.message);
            }

            // Fall back to list and filter
            console.log('📋 Trying list and filter method...');

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

            console.log(`📊 Got ${contacts.length} contacts to search through`);

            // Find contact by name (case insensitive)
            const foundContact = contacts.find(c =>
                c.name.toLowerCase().includes(name.toLowerCase())
            );

            if (foundContact) {
                console.log(`✅ Found contact via list: ${foundContact.name}`);
                return res.status(200).json({
                    success: true,
                    contact: foundContact,
                    method: 'listAndFilter'
                });
            } else {
                console.log('❌ Contact not found in list');
                return res.status(404).json({
                    success: false,
                    error: 'Contact not found',
                    totalContacts: contacts.length,
                    searchedFor: name
                });
            }
        } else {
            // No name provided, return debug info
            console.log('📊 === RETURNING DEBUG INFO ===');

            const response = await people.people.connections.list({
                resourceName: 'people/me',
                personFields: 'names,emailAddresses,phoneNumbers',
                pageSize: 100  // Get more contacts
            });

            const contacts = response.data.connections?.map(person => ({
                name: person.names?.[0]?.displayName || 'No Name',
                email: person.emailAddresses?.[0]?.value || '',
                phone: person.phoneNumbers?.[0]?.value || ''
            })) || [];

            console.log('🎯 === ALL CONTACTS FOUND ===');
            console.log(`Total contacts: ${contacts.length}`);
            console.log('Full contact list:');
            contacts.forEach((contact, index) => {
                console.log(`${index + 1}. ${contact.name} (${contact.email}) ${contact.phone || ''}`);
            });
            console.log('✅ === CONTACTS API DEBUG END ===');

            return res.status(200).json({
                success: true,
                message: 'Contacts API working!',
                sampleContacts: contacts,
                totalFound: contacts.length,
                totalSize: response.data.totalSize || 0,
                debug: {
                    serviceAccountEmail: SERVICE_ACCOUNT_KEY.client_email,
                    impersonatingUser: 'dario@shopibro.com',
                    scopes: [
                        'https://www.googleapis.com/auth/contacts.readonly',
                        'https://www.googleapis.com/auth/contacts',
                        'https://www.googleapis.com/auth/userinfo.profile'
                    ]
                }
            });
        }

    } catch (error) {
        console.error('💥 === FATAL ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);

        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
        }

        return res.status(500).json({
            success: false,
            error: error.message,
            errorCode: error.code,
            stack: error.stack
        });
    }
}