const Test = require('../models/Test');

class TestController {
  // GET /api/v1/testing/tests/:code - Get test by access code
  static async getTestByCode(req, res) {
    try {
      const { code } = req.params;
      const { includeAnswers } = req.query;

      // Parse includeAnswers query parameter (default to false)
      const includeAnswersBool = includeAnswers === 'true' || includeAnswers === '1';

      const test = await Test.findByCode(code, includeAnswersBool);

      if (!test) {
        return res.status(404).json({
          success: false,
          message: `Test with access code '${code}' not found`
        });
      }

      res.json({
        success: true,
        data: test
      });
    } catch (error) {
      console.error('Error in getTestByCode:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/v1/testing/tests - Get all tests (basic info)
  static async getAllTests(req, res) {
    try {
      const tests = await Test.findAll();

      res.json({
        success: true,
        data: tests,
        count: tests.length
      });
    } catch (error) {
      console.error('Error in getAllTests:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/v1/testing/tests - Create a new test
  static async createTest(req, res) {
    try {
      const { name, code } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: 'Name and code are required'
        });
      }

      // Validate code format (6 characters, alphanumeric)
      if (!/^[A-Z0-9]{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: 'Code must be exactly 6 alphanumeric characters'
        });
      }

      const test = await Test.create({ name, code });

      res.status(201).json({
        success: true,
        data: test,
        message: 'Test created successfully'
      });
    } catch (error) {
      console.error('Error in createTest:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = TestController;
