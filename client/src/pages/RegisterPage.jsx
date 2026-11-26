import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { isValidSurname, isValidDOB, getIdentifierType } from '../utils/validators';
import { authService } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ surname: '', identifier: '', dob: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    setServerError('');
  }

  function validate() {
    const newErrors = {};
    if (!isValidSurname(form.surname)) {
      newErrors.surname = 'Please enter a valid surname (2–50 characters, letters only).';
    }
    if (!getIdentifierType(form.identifier)) {
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-gray-200">

          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
            <p className="text-sm text-gray-500">
              We'll send a verification code to confirm your contact.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            <Input
              label="Surname"
              type="text"
              placeholder="e.g. Smith"
              value={form.surname}
              onChange={(e) => handleChange('surname', e.target.value)}
              error={errors.surname}
              autoComplete="family-name"
              autoFocus
            />

            <Input
              label="Email or phone number"
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
              min="1900-01-01"
              max={new Date().toISOString().slice(0, 10)}
            />

            {serverError && <Alert type="error" message={serverError} />}

            <Button type="submit" loading={loading}>
              Continue
            </Button>

          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gray-900 font-semibold hover:underline transition-colors">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
