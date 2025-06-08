// src/pages/ContactPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { loadGoogleContact } from '../services/googleContacts';

function ContactPage() {
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { name } = useParams();
    const location = useLocation();

    useEffect(() => {
        const contactName = name || new URLSearchParams(location.search).get('name');
        if (contactName) {
            loadContactData(contactName);
        } else {
            setError('No contact name provided');
            setLoading(false);
        }
    }, [name, location]);

    const loadContactData = async (contactName) => {
        try {
            setLoading(true);
            setError(null);
            console.log('🚀 Loading contact:', contactName);

            const contactData = await loadGoogleContact(contactName);
            setContact(contactData);

            console.log('✅ Contact loaded successfully');
        } catch (err) {
            setError('Contact not found: ' + err.message);
            console.error('Contact load error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>👤 Contact</h1>
                    <p>Loading contact information...</p>
                </div>
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Searching contacts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>👤 Contact</h1>
                    <p>Unable to load contact</p>
                </div>
                <div className="error">
                    <h3>Error</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>👤 Contact</h1>
                    <p>Contact not found</p>
                </div>
                <div className="no-contacts">
                    <div className="no-contacts-icon">🔍</div>
                    <p>Contact not found</p>
                    <span>The requested contact could not be found</span>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>👤 Contact Details</h1>
                <p>Contact information</p>
            </div>

            <div className="contact-card">
                <div className="contact-avatar-large">
                    {contact.photo ? (
                        <img src={contact.photo} alt={contact.name} />
                    ) : (
                        <div className="avatar-placeholder-large">
                            {contact.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="contact-name-large">{contact.name}</div>

                <div className="contact-details-large">
                    {contact.email && (
                        <div className="contact-detail-large">
                            <span className="detail-icon-large">📧</span>
                            <div className="detail-content">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{contact.email}</span>
                            </div>
                        </div>
                    )}

                    {contact.phone && (
                        <div className="contact-detail-large">
                            <span className="detail-icon-large">📞</span>
                            <div className="detail-content">
                                <span className="detail-label">Phone</span>
                                <span className="detail-value">{contact.phone}</span>
                            </div>
                        </div>
                    )}

                    {contact.organization && (
                        <div className="contact-detail-large">
                            <span className="detail-icon-large">🏢</span>
                            <div className="detail-content">
                                <span className="detail-label">Organization</span>
                                <span className="detail-value">{contact.organization}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContactPage;