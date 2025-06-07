// src/components/AuthCallback.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleAuthCallback } from '../services/googleCalendar';

function AuthCallback() {
    const [status, setStatus] = useState('Processing...');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const processAuth = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                setStatus('Authentication cancelled');
                setTimeout(() => navigate('/'), 3000);
                return;
            }

            if (code) {
                try {
                    const success = await handleAuthCallback(code);
                    if (success) {
                        setStatus('✅ Authentication successful! Redirecting...');
                        setTimeout(() => navigate('/'), 2000);
                    } else {
                        setStatus('❌ Authentication failed');
                    }
                } catch (error) {
                    setStatus('❌ Authentication error');
                    console.error(error);
                }
            } else {
                setStatus('❌ No authorization code received');
            }
        };

        processAuth();
    }, [searchParams, navigate]);

    return (
        <div className="page">
            <div className="page-header">
                <h1>🔐 Authentication</h1>
            </div>
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="loading-spinner"></div>
                <p>{status}</p>
            </div>
        </div>
    );
}

export default AuthCallback;