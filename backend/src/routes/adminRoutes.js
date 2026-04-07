import express from 'express';
import { getAdminOverview } from '../controllers/admin/adminOverviewController.js';
import { getManagedUsers } from '../controllers/admin/adminManagedUsersController.js';
import {
	getAdminListings,
	setListingModerationStatus,
	setListingFeatureState,
	reviewListing3DHealth,
	setListingTags,
} from '../controllers/admin/adminListingModerationController.js';
import { setUserAccountStatus } from '../controllers/admin/adminUserAccessController.js';
import { getAdminReports, updateAdminReportStatus, applyAdminReportedListingAction } from '../controllers/admin/adminReportsController.js';
import { getAdminAuditLogs } from '../controllers/admin/adminAuditController.js';
import { getLandlordKycQueue, reviewLandlordKyc } from '../controllers/admin/adminLandlordKycController.js';
import { getAdminChatbotInsights } from '../controllers/admin/adminChatbotInsightsController.js';
import { setUserRole } from '../controllers/admin/adminUserRoleController.js';
import { getAdminReviews, setAdminReviewModeration } from '../controllers/admin/adminReviewModerationController.js';
import {
	getAdminBookingOversight,
	getAdminConversionMetrics,
	getAdminChatOversight,
	getAdminMarketplaceInsights,
	getAdminReportDisputeContext,
} from '../controllers/admin/adminPlatformActivityController.js';
import { getListingTagCatalog, updateListingTagCatalog } from '../controllers/admin/adminPlatformSettingsController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import { hasAdminPermission } from '../utils/adminPermissions.js';

const router = express.Router();

function authorizeAdminPanelAccess(permission) {
	return (req, res, next) => {
		const role = String(req.user?.role || '').toLowerCase();
		if (!['admin', 'moderator'].includes(role)) {
			return res.status(403).json({ message: 'Access denied: admin or moderator role required' });
		}

		if (!permission || hasAdminPermission(req.user, permission)) {
			return next();
		}

		return res.status(403).json({ message: `Access denied: missing ${permission} permission` });
	};
}

router.get('/overview', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('analytics'), getAdminOverview);

router.get('/users', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('user_management'), getManagedUsers);
router.patch('/users/:userId/account-status', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('user_management'), setUserAccountStatus);
router.patch('/users/:userId/role', authenticate, authorizeRoles('admin'), setUserRole);

router.get('/listings', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('listing_moderation'), getAdminListings);
router.patch('/listings/:listingId/moderation', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('listing_moderation'), setListingModerationStatus);
router.patch('/listings/:listingId/feature', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('listing_moderation'), setListingFeatureState);
router.patch('/listings/:listingId/model-health', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('listing_moderation'), reviewListing3DHealth);
router.patch('/listings/:listingId/tags', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('listing_moderation'), setListingTags);

router.get('/reports', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('report_management'), getAdminReports);
router.patch('/reports/:reportId/status', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('report_management'), updateAdminReportStatus);
router.patch('/reports/:reportId/listing-action', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('report_management'), applyAdminReportedListingAction);
router.get('/reports/:reportId/dispute-context', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('report_management'), getAdminReportDisputeContext);

router.get('/landlords/kyc', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('kyc_review'), getLandlordKycQueue);
router.patch('/landlords/:userId/kyc', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('kyc_review'), reviewLandlordKyc);

router.get('/reviews', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('review_moderation'), getAdminReviews);
router.patch('/reviews/:reviewId/moderation', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('review_moderation'), setAdminReviewModeration);

router.get('/bookings/oversight', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('booking_oversight'), getAdminBookingOversight);
router.get('/metrics/conversion', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('analytics'), getAdminConversionMetrics);
router.get('/metrics/chat-oversight', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('chat_monitoring'), getAdminChatOversight);
router.get('/metrics/marketplace-insights', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('analytics'), getAdminMarketplaceInsights);

router.get('/settings/listing-tags', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('listing_moderation'), getListingTagCatalog);
router.put('/settings/listing-tags', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('listing_moderation'), updateListingTagCatalog);

router.get('/chatbot-insights', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('analytics'), getAdminChatbotInsights);
router.get('/audit-logs', authenticate, authorizeRoles('admin', 'moderator'), authorizeAdminPanelAccess('analytics'), getAdminAuditLogs);

export default router;
