const { body } = require('express-validator');

const jdValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Job title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('company')
    .optional()
    .trim(),
  body('description')
    .notEmpty().withMessage('Job description is required')
    .isLength({ min: 50 }).withMessage('Job description must be at least 50 characters'),
];

module.exports = { jdValidator };
