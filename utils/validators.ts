export const validators = {
  // Validation functions
  isValidTeamNumber: (teamNum: string): boolean => {
    const num = parseInt(teamNum, 10);
    return !isNaN(num) && num > 0 && num <= 9999;
  },

  isValidMatchNumber: (matchNum: string): boolean => {
    const num = parseInt(matchNum, 10);
    return !isNaN(num) && num > 0 && num <= 999;
  },

  isValidUsername: (username: string): boolean => {
    return username.length >= 2 && username.length <= 50;
  },

  isValidInitials: (initials: string): boolean => {
    return initials.length >= 2 && initials.length <= 4 && /^[A-Z]+$/.test(initials);
  },

  isValidPin: (pin: string): boolean => {
    return /^\d{4,6}$/.test(pin);
  },

  isValidScore: (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return !isNaN(num) && num >= 0 && num <= 1000;
  },

  isNotEmpty: (value: string | undefined | null): boolean => {
    return !!value && value.trim().length > 0;
  },

  sanitizeInput: (input: string, maxLength = 100): string => {
    return input.substring(0, maxLength).replace(/[<>]/g, '');
  },

  formatTeamNumber: (input: string): string => {
    return input.replace(/\D/g, '').slice(0, 4);
  },

  formatMatchNumber: (input: string): string => {
    return input.replace(/\D/g, '').slice(0, 3);
  }
};

export const getValidationError = (field: string, value: string | number): string | null => {
  switch (field) {
    case 'teamNumber':
      if (!value) return 'Team number is required';
      if (!validators.isValidTeamNumber(value.toString())) return 'Invalid team number (1-9999)';
      return null;

    case 'matchNumber':
      if (!value) return 'Match number is required';
      if (!validators.isValidMatchNumber(value.toString())) return 'Invalid match number (1-999)';
      return null;

    case 'username':
      if (!validators.isNotEmpty(value.toString())) return 'Username is required';
      if (!validators.isValidUsername(value.toString())) return 'Username must be 2-50 characters';
      return null;

    case 'initials':
      if (!value) return 'Initials are required';
      if (!validators.isValidInitials(value.toString())) return 'Initials must be 2-4 uppercase letters';
      return null;

    case 'pin':
      if (!value) return 'PIN is required';
      if (!validators.isValidPin(value.toString())) return 'PIN must be 4-6 digits';
      return null;

    default:
      return null;
  }
};
