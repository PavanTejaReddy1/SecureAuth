import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,  // sends HTTP-only session cookies automatically
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Pull a readable message out of any error response
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Something went wrong. Please try again.';

    if (error.response && error.response.data) {
      message = error.response.data.message || error.response.data.error || message;
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

// Auth endpoints
export const authService = {
  register:   (data) => api.post('/auth/register', data),
  sendOtp:    (data) => api.post('/auth/send-otp', data),
  verifyOtp:  (data) => api.post('/auth/verify-otp', data),
  login:      (data) => api.post('/auth/login', data),
  logout:     ()     => api.post('/auth/logout'),
  getMe:      ()     => api.get('/auth/me'),
  resendOtp:  (data) => api.post('/auth/resend-otp', data),
};

// WebAuthn / passkey endpoints
export const webauthnService = {
  registrationOptions:    ()     => api.get('/webauthn/registration-options'),
  verifyRegistration:     (data) => api.post('/webauthn/verify-registration', data),
  authenticationOptions:  (data) => api.post('/webauthn/authentication-options', data),
  verifyAuthentication:   (data) => api.post('/webauthn/verify-authentication', data),
};

export default api;
