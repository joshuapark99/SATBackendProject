const express = require('express');
const questionRouter = require('./testing/questionRoutes');
const testRouter = require('./testing/testRoutes');
const authTestRouter = require('./testing/authTestRoutes');
const submissionRouter = require('./testing/submissionRoutes');

const router = express.Router();

// Mount testing routes
router.use('/testing/question', questionRouter);
router.use('/testing/tests', testRouter);
router.use('/testing/auth', authTestRouter);
router.use('/submissions', submissionRouter);

module.exports = router;
