// The backend base URL comes from an environment variable, never hardcoded.
// Set VITE_API_URL in your .env file (see .env.example).
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const TOKEN_STORAGE_KEY = 'task_manager_token';
