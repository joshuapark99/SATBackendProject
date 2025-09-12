const express = require('express');
const questionRouter = require('./testing/questionRoutes');
const testRouter = require('./testing/testRoutes');

const router = express.Router();

// Mount testing routes
router.use('/testing/question', questionRouter);
router.use('/testing/tests', testRouter);

module.exports = router;
