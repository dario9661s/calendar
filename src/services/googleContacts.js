// src/services/googleContacts.js - Frontend service for single contact
console.log('🔧 Using backend API for contact authentication');

// Main function to load a single contact using backend API
export const loadGoogleContact = async (name) => {
    console.log('🔑 Loading contact via backend API:', name);

    try {
        const response = await fetch('https://calendar-lac-six.vercel.app/api/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            if (data.contact) {
                console.log(`✅ Found contact: ${data.contact.name}`);
                return data.contact;
            } else {
                throw new Error('Contact not found');
            }
        } else {
            throw new Error(data.error || 'Failed to load contact');
        }

    } catch (error) {
        console.error('💥 Error loading contact:', error);
        throw error;
    }
};