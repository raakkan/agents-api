import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { SearchSchema, SearchRequest } from '../types';
import { searchSearXNG } from '../utils/search';

const router = Router();

router.post('/', validate(SearchSchema), async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as SearchRequest;
  
  try {
    const results = await searchSearXNG(body.query, body.limit, body.lang, body.categories);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

export default router;
