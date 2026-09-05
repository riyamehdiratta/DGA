import { Router } from 'express';
import multer from 'multer';
import { adminDashboardController } from '../controllers/adminDashboard.controller.js';
import { auditLogController } from '../controllers/auditLog.controller.js';
import { backupController } from '../controllers/backup.controller.js';
import { importExportController } from '../controllers/importExport.controller.js';
import { systemHealthController } from '../controllers/systemHealth.controller.js';
import { userController } from '../controllers/user.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === XLSX_MIME);
  },
});

const router = Router();

router.get('/dashboard', asyncHandler(adminDashboardController.get.bind(adminDashboardController)));

router.get('/users', asyncHandler(userController.list.bind(userController)));
router.post('/users', asyncHandler(userController.create.bind(userController)));
router.put('/users/:id', asyncHandler(userController.update.bind(userController)));
router.post(
  '/users/:id/reset-password',
  asyncHandler(userController.resetPassword.bind(userController)),
);

router.get('/audit-logs', asyncHandler(auditLogController.list.bind(auditLogController)));

router.get('/backups', asyncHandler(backupController.list.bind(backupController)));
router.post('/backups', asyncHandler(backupController.create.bind(backupController)));
router.get(
  '/backups/:filename/download',
  asyncHandler(backupController.download.bind(backupController)),
);

router.get(
  '/import-export/transformers/export',
  asyncHandler(importExportController.exportTransformers.bind(importExportController)),
);
router.post(
  '/import-export/transformers/import',
  upload.single('file'),
  asyncHandler(importExportController.importTransformers.bind(importExportController)),
);
router.get(
  '/import-export/samples/:transformerId/export',
  asyncHandler(importExportController.exportSamples.bind(importExportController)),
);
router.post(
  '/import-export/samples/:transformerId/import',
  upload.single('file'),
  asyncHandler(importExportController.importSamples.bind(importExportController)),
);
router.get(
  '/import-export/analyses/export',
  asyncHandler(importExportController.exportAnalyses.bind(importExportController)),
);

router.get('/health', asyncHandler(systemHealthController.get.bind(systemHealthController)));

export default router;
