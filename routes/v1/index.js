const express = require('express');
const questionRouter = require('./testing/questionRoutes');

const router = express.Router();

// Mount testing routes
router.use('/testing/question', questionRouter);

module.exports = router;
