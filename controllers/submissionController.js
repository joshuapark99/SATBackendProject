const Submission = require('../models/Submission');
const Test = require('../models/Test');

class SubmissionController {
  /**
   * POST /api/v1/submissions - Create a new submission (start a test)
   */
  static async createSubmission(req, res) {
    try {
      // Get userId from authenticated user (set by auth middleware)
      const userId = req.user.id;
      const { testId, initialModuleId } = req.body;

      if (!testId || !initialModuleId) {
        return res.status(400).json({
          success: false,
          message: 'testId and initialModuleId are required'
        });
      }

      // Verify test exists
      const test = await Test.findById(testId);
      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }

      const result = await Submission.create({
        userId,
        testId,
        initialModuleId
      });

      res.status(201).json({
        success: true,
        data: {
          submission: result.submission.toJSON(),
          currentModule: result.submissionModule
        },
        message: 'Submission created successfully'
      });
    } catch (error) {
      console.error('Error in createSubmission:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/v1/submissions/:submissionId - Get submission by ID
   */
  static async getSubmission(req, res) {
    try {
      const { submissionId } = req.params;

      const submission = await Submission.findById(submissionId);

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      res.json({
        success: true,
        data: submission
      });
    } catch (error) {
      console.error('Error in getSubmission:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/v1/submissions/user/:userId - Get all submissions for a user
   */
  static async getUserSubmissions(req, res) {
    try {
      const { userId } = req.params;

      const submissions = await Submission.findByUserId(userId);

      res.json({
        success: true,
        data: submissions,
        count: submissions.length
      });
    } catch (error) {
      console.error('Error in getUserSubmissions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/v1/submissions/:submissionId/answers - Submit answers for a module
   */
  static async submitAnswers(req, res) {
    try {
      const { submissionId } = req.params;
      const { moduleId, answers } = req.body;

      if (!moduleId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message: 'moduleId and answers array are required'
        });
      }

      // Validate answer format
      for (const answer of answers) {
        if (!answer.questionId || answer.submittedAnswer === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Each answer must have questionId and submittedAnswer'
          });
        }
      }

      const submittedAnswers = await Submission.submitAnswers(
        submissionId,
        moduleId,
        answers
      );

      res.json({
        success: true,
        data: submittedAnswers,
        message: 'Answers submitted successfully'
      });
    } catch (error) {
      console.error('Error in submitAnswers:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
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

  /**
   * POST /api/v1/submissions/:submissionId/modules/:moduleId/complete
   * Complete a module and get next module (adaptive)
   */
  static async completeModule(req, res) {
    try {
      const { submissionId, moduleId } = req.params;

      const result = await Submission.completeModule(submissionId, moduleId);

      res.json({
        success: true,
        data: {
          currentModuleScore: result.moduleScore,
          nextModule: result.nextModule
        },
        message: 'Module completed successfully'
      });
    } catch (error) {
      console.error('Error in completeModule:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
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

  /**
   * POST /api/v1/submissions/:submissionId/finalize
   * Finalize/submit the entire test
   */
  static async finalizeSubmission(req, res) {
    try {
      const { submissionId } = req.params;

      const submission = await Submission.finalizeSubmission(submissionId);

      res.json({
        success: true,
        data: submission.toJSON(),
        message: 'Test submitted successfully'
      });
    } catch (error) {
      console.error('Error in finalizeSubmission:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/v1/submissions/:submissionId/current-module
   * Get the current module for a submission
   */
  static async getCurrentModule(req, res) {
    try {
      const { submissionId } = req.params;

      const currentModule = await Submission.getCurrentModule(submissionId);

      if (!currentModule) {
        return res.status(404).json({
          success: false,
          message: 'No active module found for this submission'
        });
      }

      res.json({
        success: true,
        data: currentModule
      });
    } catch (error) {
      console.error('Error in getCurrentModule:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = SubmissionController;


