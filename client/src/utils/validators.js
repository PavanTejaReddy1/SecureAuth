
export function isValidEmail(value) {
  const trimmed = value.trim();
  // Must have exactly one @, something before it, a dot after it, and something after the dot
  const atIndex = trimmed.indexOf('@');
  if (atIndex < 1) return false;
  const domain = trimmed.slice(atIndex + 1);
  const dotIndex = domain.lastIndexOf('.');
  if (dotIndex < 1) return false;
  if (dotIndex === domain.length - 1) return false;
  return true;
}

export function isValidPhone(value) {
  // Strip spaces and dashes, allow optional leading +
  const digits = value.trim().replace(/[\s\-()]/g, '');
  if (digits.startsWith('+')) {
    return digits.length >= 11 && digits.length <= 16 && /^\+\d+$/.test(digits);
  }
  return digits.length >= 10 && digits.length <= 15 && /^\d+$/.test(digits);
}

// Returns 'email', 'phone', or null
export function getIdentifierType(value) {
  if (isValidEmail(value)) return 'email';
  if (isValidPhone(value)) return 'phone';
  return null;
}

export function isValidSurname(value) {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return false;
  // Only letters, spaces, hyphens and apostrophes
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    const isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    const isAllowed = char === ' ' || char === '-' || char === "'";
    if (!isLetter && !isAllowed) return false;
  }
  return true;
}

export function isValidDOB(value) {
  if (!value) return false;
  const dob = new Date(value);
  if (isNaN(dob.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (today < birthdayThisYear) {
    age = age - 1;
  }

  return age >= 13 && age <= 120;
}

export function maskIdentifier(value) {
  if (isValidEmail(value)) {
    const [local, domain] = value.split('@');
    if (local.length <= 2) return local[0] + '*@' + domain;
    const visible = local[0] + '***' + local[local.length - 1];
    return visible + '@' + domain;
  }
  if (isValidPhone(value)) {
    const digits = value.replace(/\D/g, '');
    return '******' + digits.slice(-4);
  }
  return value;
}
