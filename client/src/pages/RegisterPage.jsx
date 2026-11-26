import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { isValidEmail, isValidPhone, isValidSurname, isValidDOB, getIdentifierType } from '../utils/validators';
import { authService } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    surname: '',
    identifier: '',  // email or phone
    dob: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear the field error when the user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setServerError('');
  }

  function validate() {
    const newErrors = {};

    if (!isValidSurname(form.surname)) {
      newErrors.surname = 'Please enter a valid surname (letters only, 2–50 characters).';
    }

    const identifierType = getIdentifierType(form.identifier);
    if (!identifierType) {
      newErrors.identifier = 'Please enter a valid email address or phone number.';
    }

    if (!isValidDOB(form.dob)) {
      newErrors.dob = 'Please enter a valid date of birth. You must be at least 13 years old.';
    }

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const identifierType = getIdentifierType(form.identifier);
      await authService.register({
        surname: form.surname.trim(),
        [identifierType]: form.identifier.trim(),
        dob: form.dob,
      });

      // Registration succeeded — navigate to OTP verification
      navigate('/verify-otp', {
        state: {
          identifier: form.identifier.trim(),
          identifierType,
          purpose: 'registration',
        },
      });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4 py-12">

      {/* Card */}
      <div className="w-full max-w-md animate-fade-up">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07]">

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white mb-1.5">Create your account</h1>
            <p className="text-sm text-slate-500">
              Join SecureAuth — it only takes a moment.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            <Input
              label="Surname"
              type="text"
              placeholder="e.g. Smith"
              value={form.surname}
              onChange={(e) => handleChange('surname', e.target.value)}
              error={errors.surname}
              autoComplete="family-name"
            />

            <Input
              label="Email address or phone number"
              type="text"
              placeholder="you@example.com or +447911123456"
              value={form.identifier}
              onChange={(e) => handleChange('identifier', e.target.value)}
              error={errors.identifier}
              autoComplete="email"
            />

            <Input
              label="Date of birth"
              type="date"
              value={form.dob}
              onChange={(e) => handleChange('dob', e.target.value)}
              error={errors.dob}
              autoComplete="bdate"
              // Limit the calendar to sensible range
              min="1900-01-01"
              max={new Date().toISOString().slice(0, 10)}
            />

            {serverError && <Alert type="error" message={serverError} />}

            <Button type="submit" loading={loading} className="mt-1">
              Continue
            </Button>

          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
