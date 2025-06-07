// api/health.js - Health check endpoint
export default function handler(req, res) {
    res.status(200).json({
        status: 'OK',
        message: 'Calendar API backend is running on Vercel Functions',
        timestamp: new Date().toISOString()
    });
}