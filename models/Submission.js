const pool = require('../config/db');
const {
  calculateModuleScore,
  calculateSectionFinalScore,
  calculateTotalSATScore,
  determineModule2Difficulty
} = require('../utils/satScoring');

class Submission {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.test_id = data.test_id;
    this.status = data.status;
    this.score = data.score;
    this.submitted_at = data.submitted_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new submission with the initial module
   * @param {Object} submissionData - { userId, testId, initialModuleId }
   * @returns {Object} - { submission, submissionModule }
   */
  static async create(submissionData) {
    const { userId, testId, initialModuleId } = submissionData;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create submission record
      const submissionQuery = `
        INSERT INTO submissions (user_id, test_id, status)
        VALUES ($1, $2, 'in_progress')
        RETURNING *
      `;
      const submissionResult = await client.query(submissionQuery, [userId, testId]);
      const submission = new Submission(submissionResult.rows[0]);

      // Create first submission_module record
      const submissionModuleQuery = `
        INSERT INTO submission_modules (submission_id, module_id, order_in_test, status)
        VALUES ($1, $2, 1, 'not_started')
        RETURNING *
      `;
      const submissionModuleResult = await client.query(submissionModuleQuery, [
        submission.id,
        initialModuleId
      ]);

      await client.query('COMMIT');

      return {
        submission,
        submissionModule: submissionModuleResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error creating submission: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get submission by ID with all related data (modules, answers)
   * @param {string} submissionId
   * @returns {Object} - Complete submission with modules and answers
   */
  static async findById(submissionId) {
    const query = `
      SELECT 
        s.*,
        sm.id as sm_id,
        sm.module_id,
        sm.order_in_test,
        sm.status as module_status,
        sm.score as module_score,
        sm.started_at as module_started_at,
        sm.completed_at as module_completed_at,
        m.name as module_name,
        m.subject_name,
        m.time_limit,
        sa.id as answer_id,
        sa.question_id,
        sa.submitted_answer,
        sa.is_correct,
        sa.time_spent_seconds
      FROM submissions s
      LEFT JOIN submission_modules sm ON s.id = sm.submission_id
      LEFT JOIN modules m ON sm.module_id = m.id
      LEFT JOIN submitted_answers sa ON sm.id = sa.submission_module_id
      WHERE s.id = $1
      ORDER BY sm.order_in_test, sa.created_at
    `;

    try {
      const result = await pool.query(query, [submissionId]);

      if (result.rows.length === 0) {
        return null;
      }

      // Structure the data
      const submissionData = {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        test_id: result.rows[0].test_id,
        status: result.rows[0].status,
        score: result.rows[0].score,
        submitted_at: result.rows[0].submitted_at,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
        modules: []
      };

      // Group modules and answers
      const moduleMap = new Map();

      result.rows.forEach(row => {
        if (row.sm_id && !moduleMap.has(row.sm_id)) {
          moduleMap.set(row.sm_id, {
            id: row.sm_id,
            module_id: row.module_id,
            module_name: row.module_name,
            subject_name: row.subject_name,
            time_limit: row.time_limit,
            order_in_test: row.order_in_test,
            status: row.module_status,
            score: row.module_score,
            started_at: row.module_started_at,
            completed_at: row.module_completed_at,
            answers: []
          });
        }

        if (row.answer_id) {
          const module = moduleMap.get(row.sm_id);
          if (module) {
            module.answers.push({
              id: row.answer_id,
              question_id: row.question_id,
              submitted_answer: row.submitted_answer,
              is_correct: row.is_correct,
              time_spent_seconds: row.time_spent_seconds
            });
          }
        }
      });

      submissionData.modules = Array.from(moduleMap.values()).sort(
        (a, b) => a.order_in_test - b.order_in_test
      );

      return submissionData;
    } catch (error) {
      throw new Error(`Error fetching submission: ${error.message}`);
    }
  }

  /**
   * Get all submissions for a user
   * @param {string} userId
   * @returns {Array} - Array of submissions
   */
  static async findByUserId(userId) {
    const query = `
      SELECT s.*, t.name as test_name, t.code as test_code
      FROM submissions s
      LEFT JOIN tests t ON s.test_id = t.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching user submissions: ${error.message}`);
    }
  }

  /**
   * Submit answers for a module
   * @param {string} submissionId
   * @param {string} moduleId
   * @param {Array} answers - [{ questionId, submittedAnswer, timeSpentSeconds }]
   * @returns {Object} - Created answers
   */
  static async submitAnswers(submissionId, moduleId, answers) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get or update submission_module
      const getModuleQuery = `
        SELECT id, status FROM submission_modules
        WHERE submission_id = $1 AND module_id = $2
      `;
      const moduleResult = await client.query(getModuleQuery, [submissionId, moduleId]);

      if (moduleResult.rows.length === 0) {
        throw new Error('Module not found for this submission');
      }

      const submissionModuleId = moduleResult.rows[0].id;
      const currentStatus = moduleResult.rows[0].status;

      // Update module status to in_progress if not_started
      if (currentStatus === 'not_started') {
        await client.query(
          `UPDATE submission_modules 
           SET status = 'in_progress', started_at = NOW() 
           WHERE id = $1`,
          [submissionModuleId]
        );
      }

      // Insert or update answers
      const insertedAnswers = [];
      for (const answer of answers) {
        const answerQuery = `
          INSERT INTO submitted_answers 
            (submission_id, submission_module_id, question_id, submitted_answer, time_spent_seconds)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (submission_id, question_id) 
          DO UPDATE SET 
            submitted_answer = EXCLUDED.submitted_answer,
            time_spent_seconds = EXCLUDED.time_spent_seconds,
            updated_at = NOW()
          RETURNING *
        `;

        const answerResult = await client.query(answerQuery, [
          submissionId,
          submissionModuleId,
          answer.questionId,
          answer.submittedAnswer,
          answer.timeSpentSeconds || null
        ]);

        insertedAnswers.push(answerResult.rows[0]);
      }

      // Update submission updated_at
      await client.query(
        'UPDATE submissions SET updated_at = NOW() WHERE id = $1',
        [submissionId]
      );

      await client.query('COMMIT');
      return insertedAnswers;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error submitting answers: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Complete a module, grade it, and determine next module (adaptive logic)
   * @param {string} submissionId
   * @param {string} moduleId
   * @returns {Object} - { moduleScore, nextModule }
   */
  static async completeModule(submissionId, moduleId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get submission_module with module details
      const getModuleQuery = `
        SELECT sm.id, sm.order_in_test, sm.module_id, m.subject_name, m.name as module_name
        FROM submission_modules sm
        JOIN modules m ON sm.module_id = m.id
        WHERE sm.submission_id = $1 AND sm.module_id = $2
      `;
      const moduleResult = await client.query(getModuleQuery, [submissionId, moduleId]);

      if (moduleResult.rows.length === 0) {
        throw new Error('Module not found for this submission');
      }

      const submissionModuleId = moduleResult.rows[0].id;
      const orderInTest = moduleResult.rows[0].order_in_test;
      const subjectName = moduleResult.rows[0].subject_name;

      // Grade the answers
      const gradeQuery = `
        SELECT 
          sa.id,
          sa.question_id,
          sa.submitted_answer,
          q.correct_answer,
          (sa.submitted_answer = q.correct_answer) as is_correct
        FROM submitted_answers sa
        JOIN questions q ON sa.question_id = q.id
        WHERE sa.submission_module_id = $1
      `;
      const gradeResult = await client.query(gradeQuery, [submissionModuleId]);

      // Update is_correct for each answer
      for (const row of gradeResult.rows) {
        await client.query(
          'UPDATE submitted_answers SET is_correct = $1 WHERE id = $2',
          [row.is_correct, row.id]
        );
      }

      // Calculate score
      const totalQuestions = gradeResult.rows.length;
      const correctAnswers = gradeResult.rows.filter(r => r.is_correct).length;

      // Determine which module number this is for the subject (1st or 2nd)
      const moduleNumberQuery = `
        SELECT COUNT(*) as count
        FROM submission_modules sm
        JOIN modules m ON sm.module_id = m.id
        WHERE sm.submission_id = $1 AND m.subject_name = $2 AND sm.order_in_test < $3
      `;
      const moduleNumberResult = await client.query(moduleNumberQuery, [
        submissionId,
        subjectName,
        orderInTest
      ]);
      const moduleNumber = parseInt(moduleNumberResult.rows[0].count) + 1; // 1 or 2

      // Get Module 1 percentage if this is Module 2
      let module1Percentage = null;
      if (moduleNumber === 2) {
        const module1Query = `
          SELECT score
          FROM submission_modules sm
          JOIN modules m ON sm.module_id = m.id
          WHERE sm.submission_id = $1 AND m.subject_name = $2 AND sm.status = 'completed'
          ORDER BY sm.order_in_test ASC
          LIMIT 1
        `;
        const module1Result = await client.query(module1Query, [submissionId, subjectName]);
        if (module1Result.rows.length > 0 && module1Result.rows[0].score) {
          module1Percentage = module1Result.rows[0].score.percentage;
        }
      }

      // Calculate module score using SAT scoring
      const moduleScore = calculateModuleScore(
        correctAnswers,
        totalQuestions,
        subjectName,
        moduleNumber,
        module1Percentage
      );

      // Update module status and score
      await client.query(
        `UPDATE submission_modules 
         SET status = 'completed', 
             completed_at = NOW(), 
             score = $1 
         WHERE id = $2`,
        [JSON.stringify(moduleScore), submissionModuleId]
      );

      // Determine next module (adaptive logic for Module 2)
      let nextModule = null;
      if (moduleNumber === 1) {
        // This is Module 1, need to assign Module 2 based on performance
        const module2Difficulty = determineModule2Difficulty(moduleScore.percentage);
        
        // Find the appropriate Module 2 for this subject based on difficulty level
        const nextModuleQuery = `
          SELECT m.id, m.name, m.subject_name, m.time_limit, m.difficulty
          FROM test_modules tm
          JOIN modules m ON tm.module_id = m.id
          JOIN submissions s ON s.test_id = tm.test_id
          WHERE s.id = $1 
            AND m.subject_name = $2
            AND m.difficulty = $3
          ORDER BY tm.order_number ASC
          LIMIT 1
        `;
        const nextModuleResult = await client.query(nextModuleQuery, [
          submissionId,
          subjectName,
          module2Difficulty
        ]);

        if (nextModuleResult.rows.length > 0) {
          nextModule = nextModuleResult.rows[0];
          
          // Create submission_module for the next module
          const nextOrderInTest = orderInTest + 1;
          await client.query(
            `INSERT INTO submission_modules (submission_id, module_id, order_in_test, status)
             VALUES ($1, $2, $3, 'not_started')`,
            [submissionId, nextModule.id, nextOrderInTest]
          );
        }
      }

      await client.query('COMMIT');

      return {
        moduleScore,
        nextModule
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error completing module: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Finalize/submit the entire test
   * @param {string} submissionId
   * @returns {Object} - Final submission with total score
   */
  static async finalizeSubmission(submissionId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get all module scores grouped by subject
      const scoresQuery = `
        SELECT sm.score, m.subject_name, sm.order_in_test
        FROM submission_modules sm
        JOIN modules m ON sm.module_id = m.id
        WHERE sm.submission_id = $1 AND sm.status = 'completed'
        ORDER BY m.subject_name, sm.order_in_test
      `;
      const scoresResult = await client.query(scoresQuery, [submissionId]);

      if (scoresResult.rows.length === 0) {
        throw new Error('No completed modules found for this submission');
      }

      // Group scores by subject
      const scoresBySubject = {};
      scoresResult.rows.forEach(row => {
        const subject = row.subject_name;
        if (!scoresBySubject[subject]) {
          scoresBySubject[subject] = [];
        }
        scoresBySubject[subject].push(row.score);
      });

      // Calculate section scores
      const sections = {};
      
      // Reading & Writing section
      if (scoresBySubject['Reading and Writing']?.length === 2) {
        sections.readingWriting = calculateSectionFinalScore(
          scoresBySubject['Reading and Writing'][0],
          scoresBySubject['Reading and Writing'][1],
          'Reading and Writing'
        );
      }

      // Math section
      if (scoresBySubject['Math']?.length === 2) {
        sections.math = calculateSectionFinalScore(
          scoresBySubject['Math'][0],
          scoresBySubject['Math'][1],
          'Math'
        );
      }

      // Calculate total SAT score if both sections are complete
      let totalScore;
      if (sections.readingWriting && sections.math) {
        totalScore = calculateTotalSATScore(
          sections.readingWriting,
          sections.math
        );
      } else {
        // Partial submission - store what we have
        totalScore = {
          sections,
          incomplete: true,
          message: 'Not all sections completed'
        };
      }

      // Update submission
      const updateQuery = `
        UPDATE submissions 
        SET status = 'submitted',
            submitted_at = NOW(),
            score = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const result = await client.query(updateQuery, [
        JSON.stringify(totalScore),
        submissionId
      ]);

      await client.query('COMMIT');
      return new Submission(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error finalizing submission: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get current module for a submission (the in_progress or not_started one)
   * @param {string} submissionId
   * @returns {Object} - Current module or null
   */
  static async getCurrentModule(submissionId) {
    const query = `
      SELECT sm.*, m.name, m.subject_name, m.time_limit
      FROM submission_modules sm
      JOIN modules m ON sm.module_id = m.id
      WHERE sm.submission_id = $1 
        AND sm.status IN ('not_started', 'in_progress')
      ORDER BY sm.order_in_test ASC
      LIMIT 1
    `;

    try {
      const result = await pool.query(query, [submissionId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error getting current module: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      test_id: this.test_id,
      status: this.status,
      score: this.score,
      submitted_at: this.submitted_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Submission;


