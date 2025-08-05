import express from 'express';
import { handleForm, getAllForms } from '../controllers/formController.js';
const router = express.Router();

router.post('/', handleForm);
router.get('/', getAllForms);  // GET /api/form tüm mesajları getirir

export default router;
