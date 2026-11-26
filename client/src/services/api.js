import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,  // sends HTTP-only session cookies automatically
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Unwrap the data on success, build a readable error on failure
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Something went wrong. Please try again.';
    let extraData = {};

    if (error.response && error.response.data) {
      const data = error.response.data;
      message   = data.message || data.error || message;
      // Preserve extra fields like lockedUntil, alreadyActive, attemptsRemaining
      extraData = { ...data };
      delete extraData.message;
    } else if (error.message) {
      message = error.message;
    }

    // Attach the extra fields to the error so callers can inspect them
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
