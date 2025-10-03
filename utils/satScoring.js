/**
 * SAT Scoring Utility
 * Implements scaled score calculations similar to CollegeBoard's Digital SAT
 * 
 * Digital SAT Structure:
 * - Reading & Writing: 2 modules, ~27 questions each, scored 200-800
 * - Math: 2 modules, ~22 questions each, scored 200-800
 * - Total Score: 400-1600 (sum of both sections)
 * 
 * Module 2 is adaptive (easier or harder based on Module 1 performance)
 */

/**
 * Reading & Writing Raw Score to Scaled Score Conversion
 * Based on typical SAT conversion tables
 * Key: raw score (correct answers), Value: scaled score
 */
const RW_SCORE_TABLE = {
  // Module 2 Hard (high performers on Module 1)
  hard: {
    54: 800, 53: 790, 52: 770, 51: 760, 50: 750,
    49: 740, 48: 730, 47: 710, 46: 700, 45: 690,
    44: 680, 43: 670, 42: 660, 41: 650, 40: 640,
    39: 630, 38: 620, 37: 610, 36: 600, 35: 590,
    34: 580, 33: 570, 32: 560, 31: 550, 30: 540,
    29: 530, 28: 520, 27: 510, 26: 500, 25: 490,
    24: 480, 23: 470, 22: 460, 21: 450, 20: 440,
    19: 430, 18: 420, 17: 410, 16: 400, 15: 390,
    14: 380, 13: 370, 12: 360, 11: 350, 10: 340,
    9: 330, 8: 320, 7: 310, 6: 300, 5: 290,
    4: 280, 3: 270, 2: 260, 1: 240, 0: 200
  },
  // Module 2 Easy (lower performers on Module 1)
  easy: {
    54: 700, 53: 690, 52: 680, 51: 670, 50: 660,
    49: 650, 48: 640, 47: 630, 46: 620, 45: 610,
    44: 600, 43: 590, 42: 580, 41: 570, 40: 560,
    39: 550, 38: 540, 37: 530, 36: 520, 35: 510,
    34: 500, 33: 490, 32: 480, 31: 470, 30: 460,
    29: 450, 28: 440, 27: 430, 26: 420, 25: 410,
    24: 400, 23: 390, 22: 380, 21: 370, 20: 360,
    19: 350, 18: 340, 17: 330, 16: 320, 15: 310,
    14: 300, 13: 290, 12: 280, 11: 270, 10: 260,
    9: 250, 8: 240, 7: 230, 6: 220, 5: 210,
    4: 200, 3: 200, 2: 200, 1: 200, 0: 200
  }
};

/**
 * Math Raw Score to Scaled Score Conversion
 * Based on typical SAT conversion tables
 * Key: raw score (correct answers), Value: scaled score
 */
const MATH_SCORE_TABLE = {
  // Module 2 Hard (high performers on Module 1)
  hard: {
    44: 800, 43: 780, 42: 760, 41: 740, 40: 720,
    39: 710, 38: 700, 37: 690, 36: 680, 35: 670,
    34: 660, 33: 650, 32: 640, 31: 630, 30: 620,
    29: 610, 28: 600, 27: 590, 26: 580, 25: 570,
    24: 560, 23: 550, 22: 540, 21: 530, 20: 520,
    19: 510, 18: 500, 17: 490, 16: 480, 15: 470,
    14: 460, 13: 450, 12: 440, 11: 430, 10: 420,
    9: 410, 8: 400, 7: 390, 6: 370, 5: 350,
    4: 330, 3: 310, 2: 280, 1: 250, 0: 200
  },
  // Module 2 Easy (lower performers on Module 1)
  easy: {
    44: 680, 43: 670, 42: 660, 41: 650, 40: 640,
    39: 630, 38: 620, 37: 610, 36: 600, 35: 590,
    34: 580, 33: 570, 32: 560, 31: 550, 30: 540,
    29: 530, 28: 520, 27: 510, 26: 500, 25: 490,
    24: 480, 23: 470, 22: 460, 21: 450, 20: 440,
    19: 430, 18: 420, 17: 410, 16: 400, 15: 390,
    14: 380, 13: 370, 12: 360, 11: 350, 10: 340,
    9: 330, 8: 320, 7: 310, 6: 300, 5: 290,
    4: 280, 3: 270, 2: 260, 1: 240, 0: 200
  }
};

/**
 * Determine if Module 2 should be hard or easy based on Module 1 performance
 * Typically, getting 70%+ correct on Module 1 triggers the harder Module 2
 * @param {number} module1Percentage - Percentage correct on Module 1
 * @returns {string} - 'hard' or 'easy'
 */
function determineModule2Difficulty(module1Percentage) {
  return module1Percentage >= 70 ? 'hard' : 'easy';
}

/**
 * Calculate scaled score for a section (Reading & Writing or Math)
 * @param {number} rawScore - Total correct answers across both modules
 * @param {string} subject - 'Reading and Writing' or 'Math'
 * @param {string} module2Difficulty - 'hard' or 'easy'
 * @returns {number} - Scaled score (200-800)
 */
function calculateSectionScore(rawScore, subject, module2Difficulty) {
  // Select appropriate conversion table
  let scoreTable;
  if (subject === 'Reading and Writing') {
    scoreTable = RW_SCORE_TABLE[module2Difficulty];
  } else if (subject === 'Math') {
    scoreTable = MATH_SCORE_TABLE[module2Difficulty];
  } else {
    throw new Error(`Invalid subject: ${subject}`);
  }

  // Get scaled score from table, default to 200 if raw score not in table
  const scaledScore = scoreTable[rawScore] || 200;
  
  return scaledScore;
}

/**
 * Calculate complete module score with scaled scoring
 * @param {number} correctAnswers - Number of correct answers
 * @param {number} totalQuestions - Total questions in module
 * @param {string} subject - 'Reading and Writing' or 'Math'
 * @param {number} moduleNumber - 1 or 2
 * @param {number|null} module1Percentage - Percentage from Module 1 (only needed for Module 2)
 * @returns {Object} - Score object with raw and scaled scores
 */
function calculateModuleScore(correctAnswers, totalQuestions, subject, moduleNumber, module1Percentage = null) {
  const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  const scoreData = {
    raw_score: correctAnswers,
    total_questions: totalQuestions,
    percentage: Math.round(percentage * 100) / 100,
    module_number: moduleNumber
  };

  // For Module 1, store percentage for Module 2 difficulty determination
  if (moduleNumber === 1) {
    scoreData.determines_next_difficulty = determineModule2Difficulty(percentage);
  }

  return scoreData;
}

/**
 * Calculate final section score (both modules combined)
 * @param {Object} module1Score - Score data from Module 1
 * @param {Object} module2Score - Score data from Module 2
 * @param {string} subject - 'Reading and Writing' or 'Math'
 * @returns {Object} - Final section score with scaled score
 */
function calculateSectionFinalScore(module1Score, module2Score, subject) {
  const totalRawScore = module1Score.raw_score + module2Score.raw_score;
  const totalQuestions = module1Score.total_questions + module2Score.total_questions;
  const overallPercentage = totalQuestions > 0 ? (totalRawScore / totalQuestions) * 100 : 0;

  // Determine Module 2 difficulty based on Module 1 performance
  const module2Difficulty = determineModule2Difficulty(module1Score.percentage);

  // Calculate scaled score
  const scaledScore = calculateSectionScore(totalRawScore, subject, module2Difficulty);

  return {
    subject,
    raw_score: totalRawScore,
    total_questions: totalQuestions,
    percentage: Math.round(overallPercentage * 100) / 100,
    scaled_score: scaledScore,
    module_2_difficulty: module2Difficulty,
    module_scores: [module1Score, module2Score]
  };
}

/**
 * Calculate total SAT score from both sections
 * @param {Object} readingWritingSection - Final R&W section score
 * @param {Object} mathSection - Final Math section score
 * @returns {Object} - Complete SAT score report
 */
function calculateTotalSATScore(readingWritingSection, mathSection) {
  const totalScore = readingWritingSection.scaled_score + mathSection.scaled_score;

  return {
    total_score: totalScore,
    reading_writing: readingWritingSection,
    math: mathSection,
    score_range: {
      min: 400,
      max: 1600
    }
  };
}

module.exports = {
  determineModule2Difficulty,
  calculateSectionScore,
  calculateModuleScore,
  calculateSectionFinalScore,
  calculateTotalSATScore,
  RW_SCORE_TABLE,
  MATH_SCORE_TABLE
};

