// routes/adminRoutes.js
import express from 'express';
import { login, getProfile, getSubscriberMessages, deleteSubscriber, replyMessage, verifyResetCode, resetPassword, changePassword, forgotPassword, sendNewsletterToAll } from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/change-password', authMiddleware, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.post('/send-newsletter', authMiddleware, sendNewsletterToAll);
router.post('/:id/reply', replyMessage);
router.get('/subscriber-messages', getSubscriberMessages);
router.delete('/subscribers/:id', deleteSubscriber);


export default router;