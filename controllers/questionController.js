const Question = require('../models/Question');

class QuestionController {
  // GET /api/v1/testing/question - Get all questions with optional filtering
  static async getAllQuestions(req, res) {
    try {
      const {
        subject,
        domain,
        skill,
        difficulty,
        test_type,
        is_multiple_choice,
        limit = 50,
        offset = 0
      } = req.query;

      // Validate limit and offset
      const parsedLimit = Math.min(parseInt(limit) || 50, 100); // Max 100 questions per request
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);

      // Parse boolean parameter
      let parsedIsMultipleChoice;
      if (is_multiple_choice !== undefined) {
        parsedIsMultipleChoice = is_multiple_choice === 'true';
      }

      const filters = {
        subject,
        domain,
        skill,
        difficulty,
        test_type,
        is_multiple_choice: parsedIsMultipleChoice,
        limit: parsedLimit,
        offset: parsedOffset
      };

      const questions = await Question.findAll(filters);

      res.json({
        success: true,
        data: questions,
        meta: {
          count: questions.length,
          limit: parsedLimit,
          offset: parsedOffset
        }
      });
    } catch (error) {
      console.error('Error in getAllQuestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch questions',
        message: error.message
      });
    }
  }

  // GET /api/v1/testing/question/:id - Get a single question by ID
  static async getQuestionById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Question ID is required'
        });
      }

      const question = await Question.findById(id);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      res.json({
        success: true,
        data: question
      });
    } catch (error) {
      console.error('Error in getQuestionById:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch question',
        message: error.message
      });
    }
  }

  // GET /api/v1/testing/question/alt/:alt_id - Get a single question by alt_id
  static async getQuestionByAltId(req, res) {
    try {
      const { alt_id } = req.params;

      if (!alt_id) {
        return res.status(400).json({
          success: false,
          error: 'Question alt_id is required'
        });
      }

      const question = await Question.findByAltId(alt_id);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      res.json({
        success: true,
        data: question
      });
    } catch (error) {
      console.error('Error in getQuestionByAltId:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch question',
        message: error.message
      });
    }
  }

  // POST /api/v1/testing/question - Create a new question
  static async createQuestion(req, res) {
    try {
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

      // Validate required fields
      const requiredFields = [
        'alt_id', 'test_type', 'question_subject', 'question_domain',
        'question_skill', 'difficulty', 'question_prompt', 'question_rationale',
        'correct_answer'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missing_fields: missingFields
        });
      }

      const questionData = {
        alt_id,
        test_type,
        question_subject,
        question_domain,
        question_skill,
        difficulty,
        question_prompt,
        question_choices: question_choices || '',
        question_rationale,
        correct_answer,
        is_multiple_choice: is_multiple_choice || false
      };

      const question = await Question.create(questionData);

      res.status(201).json({
        success: true,
        data: question,
        message: 'Question created successfully'
      });
    } catch (error) {
      console.error('Error in createQuestion:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: 'Question already exists',
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create question',
        message: error.message
      });
    }
  }

  // PUT /api/v1/testing/question/:id - Update a question
  static async updateQuestion(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Question ID is required'
        });
      }

      const question = await Question.findById(id);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      const updatedQuestion = await question.update(req.body);

      res.json({
        success: true,
        data: updatedQuestion,
        message: 'Question updated successfully'
      });
    } catch (error) {
      console.error('Error in updateQuestion:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update question',
        message: error.message
      });
    }
  }

  // DELETE /api/v1/testing/question/:id - Delete a question
  static async deleteQuestion(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Question ID is required'
        });
      }

      const question = await Question.findById(id);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      await question.delete();

      res.json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteQuestion:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete question',
        message: error.message
      });
    }
  }

  // GET /api/v1/testing/question/stats - Get question statistics
  static async getQuestionStats(req, res) {
    try {
      const stats = await Question.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getQuestionStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch question statistics',
        message: error.message
      });
    }
  }

  // GET /api/v1/testing/question/filter-options - Get available filter options
  static async getFilterOptions(req, res) {
    try {
      const filterOptions = await Question.getFilterOptions();

      res.json({
        success: true,
        data: filterOptions
      });
    } catch (error) {
      console.error('Error in getFilterOptions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch filter options',
        message: error.message
      });
    }
  }
}

module.exports = QuestionController;
