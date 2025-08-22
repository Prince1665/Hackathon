// Comprehensive validation utilities for the e-waste management system

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateItemData(data: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!data.category || typeof data.category !== 'string') {
    errors.push('Category is required and must be a string');
  }

  if (!data.department_id || isNaN(Number(data.department_id))) {
    errors.push('Department ID is required and must be a number');
  }

  if (!data.reported_by || typeof data.reported_by !== 'string') {
    errors.push('Reported by is required and must be a string');
  }

  // Optional numeric fields validation
  const numericFields = [
    'original_price', 'used_duration', 'user_lifespan', 
    'condition', 'build_quality', 'expiry_years', 'current_price'
  ];

  numericFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      const num = Number(data[field]);
      if (isNaN(num) || num < 0) {
        errors.push(`${field} must be a non-negative number`);
      }
    }
  });

  // Specific range validations
  if (data.condition !== undefined && (Number(data.condition) < 1 || Number(data.condition) > 5)) {
    errors.push('Condition must be between 1 and 5');
  }

  if (data.build_quality !== undefined && (Number(data.build_quality) < 1 || Number(data.build_quality) > 5)) {
    errors.push('Build quality must be between 1 and 5');
  }

  // Usage pattern validation
  if (data.usage_pattern && !['Light', 'Moderate', 'Heavy'].includes(data.usage_pattern)) {
    errors.push('Usage pattern must be Light, Moderate, or Heavy');
  }

  // Category validation
  const validCategories = [
    'Tablet', 'Microwave', 'Air Conditioner', 'TV', 
    'Washing Machine', 'Laptop', 'Smartphone', 'Refrigerator'
  ];
  if (data.category && !validCategories.includes(data.category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }

  // Status validation
  const validStatuses = [
    'Reported', 'Awaiting Pickup', 'Scheduled', 'Collected', 
    'Recycled', 'Refurbished', 'Safely Disposed'
  ];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Disposition validation
  const validDispositions = ['Recyclable', 'Reusable', 'Hazardous'];
  if (data.disposition && !validDispositions.includes(data.disposition)) {
    errors.push(`Disposition must be one of: ${validDispositions.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUserData(data: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password is required and must be at least 6 characters');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }

  // Role validation
  const validRoles = ['student', 'coordinator', 'admin', 'vendor'];
  if (data.role && !validRoles.includes(data.role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePriceData(data: any): ValidationResult {
  const errors: string[] = [];

  // Required category
  if (!data.category || typeof data.category !== 'string') {
    errors.push('Category is required for price prediction');
  }

  // Numeric validations
  const numericFields = ['original_price', 'used_duration', 'user_lifespan', 'condition', 'build_quality'];
  numericFields.forEach(field => {
    if (data[field] !== undefined && (typeof data[field] !== 'number' || isNaN(data[field]) || data[field] < 0)) {
      errors.push(`${field} must be a positive number`);
    }
  });

  // Range validations
  if (data.condition && (data.condition < 1 || data.condition > 5)) {
    errors.push('Condition must be between 1 and 5');
  }

  if (data.build_quality && (data.build_quality < 1 || data.build_quality > 5)) {
    errors.push('Build quality must be between 1 and 5');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to sanitize string input
export function sanitizeString(input: any): string | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  return String(input).trim() || undefined;
}

// Helper function to validate and convert numeric input
export function validateNumber(input: any, min: number = 0): number | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  const num = Number(input);
  return isNaN(num) || num < min ? undefined : num;
}

// Helper function to validate enum values
export function validateEnum<T extends string>(input: any, validValues: T[]): T | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  return validValues.includes(input) ? input : undefined;
}
