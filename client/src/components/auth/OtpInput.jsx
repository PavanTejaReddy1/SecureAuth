import { useRef, useEffect } from 'react';

// Six individual digit boxes for OTP entry
// Props:
//   value  — string of up to 6 digits
//   onChange — called with the new full value string
//   hasError — highlights boxes red + shake animation
//   disabled — disables all inputs

export default function OtpInput({ value = '', onChange, hasError = false, disabled = false }) {
  const inputs = useRef([]);

  // Keep an array of 6 characters, padded with empty strings
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  function handleKeyDown(e, index) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        // Clear current box
        updateDigit(index, '');
      } else if (index > 0) {
        // Move back and clear previous
        updateDigit(index - 1, '');
        inputs.current[index - 1].focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputs.current[index + 1].focus();
    }
  }

  function handleChange(e, index) {
    const incoming = e.target.value;

    // Handle a paste of multiple digits into one box
    if (incoming.length > 1) {
      const pasted = incoming.replace(/\D/g, '').slice(0, 6);
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, 5);
      inputs.current[focusIndex].focus();
      return;
    }

    const digit = incoming.replace(/\D/g, '');
    updateDigit(index, digit);

    if (digit && index < 5) {
      inputs.current[index + 1].focus();
    }
  }

  function updateDigit(index, digit) {
    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(''));
  }

  // Auto-focus the first empty box when the component mounts
  useEffect(() => {
    const firstEmpty = digits.findIndex((d) => !d);
    const focusIndex = firstEmpty === -1 ? 0 : firstEmpty;
    if (inputs.current[focusIndex]) {
      inputs.current[focusIndex].focus();
    }
  }, []);

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          disabled={disabled}
          className={`otp-box ${digit ? 'filled' : ''} ${hasError ? 'error' : ''}`}
        />
      ))}
    </div>
  );
}
