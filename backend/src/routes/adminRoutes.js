import express from 'express';
import { getAdminOverview } from '../controllers/admin/adminOverviewController.js';
import { getManagedUsers } from '../controllers/admin/adminManagedUsersController.js';
import { getAdminListings, setListingModerationStatus } from '../controllers/admin/adminListingModerationController.js';
import { setUserAccountStatus } from '../controllers/admin/adminUserAccessController.js';
import { getAdminReports, updateAdminReportStatus, applyAdminReportedListingAction } from '../controllers/admin/adminReportsController.js';
import { getAdminAuditLogs } from '../controllers/admin/adminAuditController.js';
import { getLandlordKycQueue, reviewLandlordKyc } from '../controllers/admin/adminLandlordKycController.js';
import { getAdminChatbotInsights } from '../controllers/admin/adminChatbotInsightsController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overview', authenticate, authorizeRoles('admin'), getAdminOverview);
router.get('/users', authenticate, authorizeRoles('admin'), getManagedUsers);
router.patch('/users/:userId/account-status', authenticate, authorizeRoles('admin'), setUserAccountStatus);
router.get('/listings', authenticate, authorizeRoles('admin'), getAdminListings);
router.patch('/listings/:listingId/moderation', authenticate, authorizeRoles('admin'), setListingModerationStatus);
router.get('/reports', authenticate, authorizeRoles('admin'), getAdminReports);
router.patch('/reports/:reportId/status', authenticate, authorizeRoles('admin'), updateAdminReportStatus);
router.patch('/reports/:reportId/listing-action', authenticate, authorizeRoles('admin'), applyAdminReportedListingAction);
router.get('/landlords/kyc', authenticate, authorizeRoles('admin'), getLandlordKycQueue);
router.patch('/landlords/:userId/kyc', authenticate, authorizeRoles('admin'), reviewLandlordKyc);
router.get('/chatbot-insights', authenticate, authorizeRoles('admin'), getAdminChatbotInsights);
router.get('/audit-logs', authenticate, authorizeRoles('admin'), getAdminAuditLogs);

export default router;
