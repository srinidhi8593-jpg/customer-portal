// Central API configuration
// In development: reads from .env.local (http://localhost:4000)
// In production: reads from Vercel environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const API_URL = `${API_BASE_URL}/api`;
