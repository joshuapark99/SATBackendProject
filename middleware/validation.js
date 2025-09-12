// Validation Middleware
// Handles request validation and sanitization

// Question validation middleware
const validateQuestion = (req, res, next) => {
  const {
    alt_id,
    test_type,
    question_subject,
    question_domain,
    question_skill,
    difficulty,
    question_prompt,
    question_choices,
    question_rationale,
    correct_answer,
    is_multiple_choice
  } = req.body;

  const errors = [];

  // Validate required fields for POST requests
  if (req.method === 'POST') {
    if (!alt_id || typeof alt_id !== 'string' || alt_id.length !== 8) {
      errors.push('alt_id is required and must be exactly 8 characters');
    }

    if (!test_type || typeof test_type !== 'string') {
      errors.push('test_type is required and must be a string');
    }

    if (!question_subject || typeof question_subject !== 'string') {
      errors.push('question_subject is required and must be a string');
    }

    if (!question_domain || typeof question_domain !== 'string') {
      errors.push('question_domain is required and must be a string');
    }

    if (!question_skill || typeof question_skill !== 'string') {
      errors.push('question_skill is required and must be a string');
    }

    if (!difficulty || typeof difficulty !== 'string') {
      errors.push('difficulty is required and must be a string');
    }

    if (!question_prompt || typeof question_prompt !== 'string') {
      errors.push('question_prompt is required and must be a string');
    }

    if (!question_rationale || typeof question_rationale !== 'string') {
      errors.push('question_rationale is required and must be a string');
    }

    if (!correct_answer || typeof correct_answer !== 'string') {
      errors.push('correct_answer is required and must be a string');
    }
  }

  // Validate optional fields if provided
  if (question_choices !== undefined && typeof question_choices !== 'string') {
    errors.push('question_choices must be a string');
  }

  if (is_multiple_choice !== undefined && typeof is_multiple_choice !== 'boolean') {
    errors.push('is_multiple_choice must be a boolean');
  }

  // Validate difficulty values
  if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
    errors.push('difficulty must be one of: easy, medium, hard');
  }

  // Validate test_type values
  if (test_type && !['SAT'].includes(test_type)) {
    errors.push('test_type must be one of: SAT');
  }

  // Validate question_subject values
  if (question_subject && !['Math', 'Reading and Writing'].includes(question_subject)) {
    errors.push('question_subject must be one of: Math, Reading and Writing');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Sanitize input middleware
const sanitizeInput = (req, res, next) => {
  // Basic HTML sanitization for text fields
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  };

  // Sanitize question fields
  if (req.body.question_prompt) {
    req.body.question_prompt = sanitizeString(req.body.question_prompt);
  }
  if (req.body.question_choices) {
    req.body.question_choices = sanitizeString(req.body.question_choices);
  }
  if (req.body.question_rationale) {
    req.body.question_rationale = sanitizeString(req.body.question_rationale);
  }

  next();
};

// Validate UUID format
const validateUUID = (req, res, next) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (id && !uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format. Must be a valid UUID.'
    });
  }

  next();
};

// Validate alt_id format
const validateAltId = (req, res, next) => {
  const { alt_id } = req.params;
  const altIdRegex = /^[a-zA-Z0-9]{8}$/;
  
  if (alt_id && !altIdRegex.test(alt_id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid alt_id format. Must be exactly 8 alphanumeric characters.'
    });
  }

  next();
};

// Validate test access code format
const validateTestCode = (req, res, next) => {
  const { code } = req.params;
  const testCodeRegex = /^[A-Z0-9]{6}$/;
  
  if (code && !testCodeRegex.test(code)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid test code format. Must be exactly 6 uppercase alphanumeric characters.'
    });
  }

  next();
};

module.exports = {
  validateQuestion,
  sanitizeInput,
  validateUUID,
  validateAltId,
  validateTestCode
};
