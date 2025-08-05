import express from 'express';
import { subscribeNewsletter, getAllNewsletters } from '../controllers/newsletterController.js';

const router = express.Router();

router.post('/', subscribeNewsletter);
router.get('/', getAllNewsletters);  // GET /api/newsletter ile tüm kayıtları getirir


export default router;
