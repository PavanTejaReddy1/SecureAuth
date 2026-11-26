import axios from 'axios';

// In development, VITE_API_URL is not set so requests go to /api
// and the Vite proxy forwards them to localhost:5000.
// In production (Vercel), VITE_API_URL is set to the deployed backend URL.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // sends the HTTP-only session cookie with every request
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Pull a readable message out of any error response
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Something went wrong. Please try again.';
    let extraData = {};

    if (error.response && error.response.data) {
      const data = error.response.data;
      message   = data.message || data.error || message;
      extraData = { ...data };
      delete extraData.message;
    } else if (error.message) {
      message = error.message;
    }

    const err = new Error(message);
    Object.assign(err, extraData);
    return Promise.reject(err);
  }
);

// Auth endpoints
export const authService = {
  register:   (data) => api.post('/auth/register', data),
  sendOtp:    (data) => api.post('/auth/send-otp', data),
  verifyOtp:  (data) => api.post('/auth/verify-otp', data),
  logout:     ()     => api.post('/auth/logout'),
  getMe:      ()     => api.get('/auth/me'),
  resendOtp:  (data) => api.post('/auth/resend-otp', data),
};

// WebAuthn / passkey endpoints
export const webauthnService = {
  registrationOptions:   ()     => api.get('/webauthn/registration-options'),
  verifyRegistration:    (data) => api.post('/webauthn/verify-registration', data),
  authenticationOptions: (data) => api.post('/webauthn/authentication-options', data),
  verifyAuthentication:  (data) => api.post('/webauthn/verify-authentication', data),
};

export default api;
