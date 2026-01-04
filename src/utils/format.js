export const formatValidationError = errors => {
  if (!errors || !errors.issues) return 'Invalid input , Validation failed';

  if (Array.isArray(errors.issues)) {
    return errors.issues.map(i => i.message).join(', ');
  }

  return JSON.stringify(errors);
};
