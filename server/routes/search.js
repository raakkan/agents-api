const express = require('express');
const router = express.Router();
const { search } = require('../utils/search');

router.post('/', async (req, res) => {
  const { query, limit = 5, lang = 'en', categories = ['general'] } = req.body;

  if (!query) {
    return res.status(400).json({ success: false, error: 'query is required' });
  }

  try {
    const results = await search({ query, limit, lang, categories });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
