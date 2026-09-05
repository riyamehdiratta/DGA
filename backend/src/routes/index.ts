import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import { analysisController } from '../controllers/analysis.controller.js';
import { authController } from '../controllers/auth.controller.js';
import { learnController } from '../controllers/learn.controller.js';
import { sampleController } from '../controllers/sample.controller.js';
import { transformerController } from '../controllers/transformer.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { loginRateLimiter } from '../middleware/loginRateLimiter.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.post('/auth/login', loginRateLimiter, asyncHandler(authController.login.bind(authController)));
router.post('/auth/signup', loginRateLimiter, asyncHandler(authController.signup.bind(authController)));

router.use(requireAuth);

router.get('/auth/me', asyncHandler(authController.me.bind(authController)));
router.post('/auth/logout', asyncHandler(authController.logout.bind(authController)));

router.use('/admin', requireRole('ADMIN'), adminRoutes);

router.get('/bootstrap', asyncHandler(analysisController.bootstrap.bind(analysisController)));

router.get('/transformers', asyncHandler(transformerController.list.bind(transformerController)));
router.get(
  '/transformers/:id',
  asyncHandler(transformerController.getById.bind(transformerController)),
);
router.post(
  '/transformers',
  asyncHandler(transformerController.create.bind(transformerController)),
);
router.put(
  '/transformers/:id',
  asyncHandler(transformerController.update.bind(transformerController)),
);
router.delete(
  '/transformers/:id',
  asyncHandler(transformerController.remove.bind(transformerController)),
);

router.get(
  '/transformers/:id/samples',
  asyncHandler(sampleController.listByTransformer.bind(sampleController)),
);
router.post(
  '/transformers/:id/samples',
  asyncHandler(sampleController.create.bind(sampleController)),
);
router.post(
  '/transformers/:id/analyses/run',
  asyncHandler(analysisController.run.bind(analysisController)),
);
router.post(
  '/transformers/:id/analyses',
  asyncHandler(analysisController.create.bind(analysisController)),
);

router.get('/samples', asyncHandler(sampleController.listAll.bind(sampleController)));
router.get('/samples/:id', asyncHandler(sampleController.getById.bind(sampleController)));

router.post('/learn/sandbox', asyncHandler(learnController.sandbox.bind(learnController)));

router.get('/analyses', asyncHandler(analysisController.list.bind(analysisController)));
router.get('/analysis/:id', asyncHandler(analysisController.getById.bind(analysisController)));
router.get(
  '/analysis/:id/export/xlsx',
  asyncHandler(analysisController.exportXlsx.bind(analysisController)),
);

export default router;
