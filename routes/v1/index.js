const express = require('express');
const questionRouter = require('./testing/questionRoutes');
const testRouter = require('./testing/testRoutes');
const authTestRouter = require('./testing/authTestRoutes');

const router = express.Router();

// Mount testing routes
router.use('/testing/question', questionRouter);
router.use('/testing/tests', testRouter);
router.use('/testing/auth', authTestRouter);

module.exports = router;
