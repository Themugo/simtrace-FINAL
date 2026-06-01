import { Router } from 'express';
import * as authController from '../../controllers/auth.js';

const router = Router();

// Auth endpoints (v1)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/me', authController.getProfile);
router.put('/me', authController.updateProfile);
router.post('/change-password', authController.changePassword);
router.post('/reset-password', authController.requestPasswordReset);
router.post('/reset-password/confirm', authController.confirmPasswordReset);

export default router;
