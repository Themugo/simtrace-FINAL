import { Router } from 'express';
import * as authController from '../../controllers/auth.js';

const router = Router();

// Auth endpoints (v2 - enhanced with organization support)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.post('/refresh', authController.refreshToken);
router.get('/me', authController.getProfile);
router.put('/me', authController.updateProfile);
router.post('/change-password', authController.changePassword);
router.post('/reset-password', authController.requestPasswordReset);
router.post('/reset-password/confirm', authController.confirmPasswordReset);

// v2-specific endpoints
router.get('/sessions', authController.getSessions);
router.delete('/sessions/:id', authController.revokeSession);

export default router;
