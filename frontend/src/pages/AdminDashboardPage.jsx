import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

const defaultSummary = {
  totalUsers: 0,
  renters: 0,
  landlords: 0,
  suspendedUsers: 0,
  bannedUsers: 0,
  totalListings: 0,
  pendingListings: 0,
  approvedListings: 0,
  rejectedListings: 0,
  openReports: 0,
  inReviewReports: 0,
};

const summaryCards = [
  { key: 'totalUsers', label: 'Total Users (Renter + Landlord)', accent: 'text-[#1f2937]' },
  { key: 'renters', label: 'Renters', accent: 'text-[#2563eb]' },
  { key: 'landlords', label: 'Landlords', accent: 'text-[#7c3aed]' },
  { key: 'suspendedUsers', label: 'Suspended Users', accent: 'text-[#b45309]' },
  { key: 'bannedUsers', label: 'Banned Users', accent: 'text-[#be123c]' },
  { key: 'pendingListings', label: 'Pending Listings', accent: 'text-[#b45309]' },
  { key: 'approvedListings', label: 'Approved Listings', accent: 'text-[#0f766e]' },
  { key: 'rejectedListings', label: 'Rejected Listings', accent: 'text-[#be123c]' },
  { key: 'openReports', label: 'Open Reports', accent: 'text-[#b45309]' },
  { key: 'inReviewReports', label: 'Reports In Review', accent: 'text-[#2563eb]' },
];

const listingFilterOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

const userFilterOptions = [
  { label: 'All Users', value: 'all' },
  { label: 'Renters', value: 'user' },
  { label: 'Landlords', value: 'landlord' },
];

const reportFilterOptions = [
  { label: 'Open', value: 'open' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
  { label: 'All', value: 'all' },
];

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleDateString();
}

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
}

function moderationBadgeClass(status) {
  if (status === 'approved') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-50 border-rose-200 text-rose-700';
  return 'bg-amber-50 border-amber-200 text-amber-700';
}

function userBadgeClass(role) {
  if (role === 'landlord') return 'bg-violet-50 text-violet-700 border-violet-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

function accountStatusBadgeClass(status) {
  const normalized = String(status || 'active').toLowerCase();
  if (normalized === 'banned') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (normalized === 'suspended') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function reportStatusBadgeClass(status) {
  const normalized = String(status || 'open').toLowerCase();
  if (normalized === 'resolved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (normalized === 'dismissed') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (normalized === 'in_review') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function userActivityLabel(user) {
  const activity = user?.activity || {};
  if (user?.role === 'landlord') {
    return `${activity.landlordListings || 0} listings (${activity.landlordActiveListings || 0} active), ${activity.landlordBookings || 0} bookings, ${activity.landlordInquiries || 0} inquiries`;
  }

  return `${activity.renterBookings || 0} bookings, ${activity.renterInquiries || 0} inquiries`;
}

const AdminDashboardPage = () => {
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [summary, setSummary] = useState(defaultSummary);

  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState('');
  const [listings, setListings] = useState([]);
  const [listingFilter, setListingFilter] = useState('pending');
  const [listingSearchInput, setListingSearchInput] = useState('');
  const [listingSearchApplied, setListingSearchApplied] = useState('');
  const [processingListingId, setProcessingListingId] = useState('');

  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearchApplied, setUserSearchApplied] = useState('');
  const [userActionProcessingId, setUserActionProcessingId] = useState('');

  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('open');
  const [reportSearchInput, setReportSearchInput] = useState('');
  const [reportSearchApplied, setReportSearchApplied] = useState('');
  const [reportActionProcessingId, setReportActionProcessingId] = useState('');

  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearchInput, setAuditSearchInput] = useState('');
  const [auditSearchApplied, setAuditSearchApplied] = useState('');

  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [rejectModalListing, setRejectModalListing] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [accountActionModal, setAccountActionModal] = useState({
    open: false,
    user: null,
    nextStatus: '',
    reason: '',
    suspensionDays: '7',
  });
  const [reportStatusModal, setReportStatusModal] = useState({
    open: false,
    report: null,
    nextStatus: '',
    adminNote: '',
  });
  const [listingDecisionModal, setListingDecisionModal] = useState({
    open: false,
    report: null,
    severity: '',
    adminNote: '',
  });

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');

    try {
      const response = await api.get('/admin/overview');
      setSummary({
        totalUsers: Number(response.data?.summary?.totalUsers || 0),
        renters: Number(response.data?.summary?.renters || 0),
        landlords: Number(response.data?.summary?.landlords || 0),
        suspendedUsers: Number(response.data?.summary?.suspendedUsers || 0),
        bannedUsers: Number(response.data?.summary?.bannedUsers || 0),
        totalListings: Number(response.data?.summary?.totalListings || 0),
        pendingListings: Number(response.data?.summary?.pendingListings || 0),
        approvedListings: Number(response.data?.summary?.approvedListings || 0),
        rejectedListings: Number(response.data?.summary?.rejectedListings || 0),
        openReports: Number(response.data?.summary?.openReports || 0),
        inReviewReports: Number(response.data?.summary?.inReviewReports || 0),
      });
    } catch (err) {
      setOverviewError(err?.response?.data?.message || 'Could not load admin overview.');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchModerationListings = useCallback(async () => {
    setListingsLoading(true);
    setListingsError('');

    try {
      const params = new URLSearchParams();
      if (listingFilter !== 'all') params.set('moderationStatus', listingFilter);
      if (listingSearchApplied) params.set('search', listingSearchApplied);
      params.set('limit', '100');

      const response = await api.get(`/admin/listings?${params.toString()}`);
      setListings(Array.isArray(response.data?.listings) ? response.data.listings : []);
    } catch (err) {
      setListings([]);
      setListingsError(err?.response?.data?.message || 'Could not load moderation listings.');
    } finally {
      setListingsLoading(false);
    }
  }, [listingFilter, listingSearchApplied]);

  const fetchManagedUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');

    try {
      const params = new URLSearchParams();
      if (userFilter !== 'all') params.set('role', userFilter);
      if (userSearchApplied) params.set('search', userSearchApplied);
      params.set('limit', '80');

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(Array.isArray(response.data?.users) ? response.data.users : []);
    } catch (err) {
      setUsers([]);
      setUsersError(err?.response?.data?.message || 'Could not load users list.');
    } finally {
      setUsersLoading(false);
    }
  }, [userFilter, userSearchApplied]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError('');

    try {
      const params = new URLSearchParams();
      if (reportFilter !== 'all') params.set('status', reportFilter);
      if (reportSearchApplied) params.set('search', reportSearchApplied);
      params.set('limit', '80');

      const response = await api.get(`/admin/reports?${params.toString()}`);
      setReports(Array.isArray(response.data?.reports) ? response.data.reports : []);
    } catch (err) {
      setReports([]);
      setReportsError(err?.response?.data?.message || 'Could not load reports.');
    } finally {
      setReportsLoading(false);
    }
  }, [reportFilter, reportSearchApplied]);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    setAuditError('');

    try {
      const params = new URLSearchParams();
      if (auditSearchApplied) params.set('search', auditSearchApplied);
      params.set('limit', '80');

      const response = await api.get(`/admin/audit-logs?${params.toString()}`);
      setAuditLogs(Array.isArray(response.data?.logs) ? response.data.logs : []);
    } catch (err) {
      setAuditLogs([]);
      setAuditError(err?.response?.data?.message || 'Could not load audit logs.');
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearchApplied]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchModerationListings();
  }, [fetchModerationListings]);

  useEffect(() => {
    fetchManagedUsers();
  }, [fetchManagedUsers]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const listingCountLabel = useMemo(() => `${listings.length} listings shown`, [listings.length]);
  const userCountLabel = useMemo(() => `${users.length} users shown`, [users.length]);
  const reportsCountLabel = useMemo(() => `${reports.length} reports shown`, [reports.length]);
  const auditCountLabel = useMemo(() => `${auditLogs.length} logs shown`, [auditLogs.length]);

  const applyListingSearch = (event) => {
    event.preventDefault();
    setListingSearchApplied(listingSearchInput.trim());
  };

  const applyUserSearch = (event) => {
    event.preventDefault();
    setUserSearchApplied(userSearchInput.trim());
  };

  const applyReportSearch = (event) => {
    event.preventDefault();
    setReportSearchApplied(reportSearchInput.trim());
  };

  const applyAuditSearch = (event) => {
    event.preventDefault();
    setAuditSearchApplied(auditSearchInput.trim());
  };

  const handleModerationDecision = async (listing, moderationStatus, providedModerationNote = '') => {
    const listingId = String(listing?._id || '');
    if (!listingId) return false;

    const moderationNote = String(providedModerationNote || '').trim();

    if (moderationStatus === 'rejected' && !moderationNote) {
      setFeedbackError('Please provide a rejection reason so the landlord can fix and resubmit.');
      return false;
    }

    const currentModerationStatus = String(listing?.moderationStatus || 'pending').toLowerCase();
    if (currentModerationStatus !== 'pending') {
      setFeedbackError('This listing is already finalized. Ask landlord to edit and resubmit for another review cycle.');
      return false;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setProcessingListingId(listingId);

    let success = false;

    try {
      await api.patch(`/admin/listings/${listingId}/moderation`, {
        moderationStatus,
        moderationNote,
      });

      setFeedbackSuccess(
        moderationStatus === 'approved'
          ? `Listing "${listing.title}" approved. It is now eligible to be visible to renters.`
          : `Listing "${listing.title}" rejected and landlord has been notified.`
      );

      await Promise.all([fetchOverview(), fetchModerationListings(), fetchAuditLogs()]);
      success = true;
    } catch (err) {
      setFeedbackError(err?.response?.data?.message || 'Could not update listing moderation status.');
    } finally {
      setProcessingListingId('');
    }

    return success;
  };

  const openRejectModal = (listing) => {
    setRejectModalListing(listing);
    setRejectReasonInput('');
    setFeedbackError('');
    setFeedbackSuccess('');
  };

  const closeRejectModal = () => {
    setRejectModalListing(null);
    setRejectReasonInput('');
  };

  const confirmRejectWithReason = async () => {
    if (!rejectModalListing) return;

    const trimmedReason = String(rejectReasonInput || '').trim();
    if (!trimmedReason) {
      setFeedbackError('Please provide a rejection reason so the landlord can fix and resubmit.');
      return;
    }

    const didReject = await handleModerationDecision(rejectModalListing, 'rejected', trimmedReason);
    if (didReject) {
      closeRejectModal();
    }
  };

  const handleUserAccountAction = async (user, nextStatus, options = {}) => {
    const userId = String(user?.id || '');
    if (!userId) return;

    const reason = String(options.reason || '').trim();
    const rawDays = Number(options.suspensionDays);
    const suspensionDays = Number.isFinite(rawDays) && rawDays > 0
      ? Math.min(365, Math.floor(rawDays))
      : 7;

    if (nextStatus === 'suspended' && !reason) {
      setFeedbackError('Suspension reason is required.');
      return;
    }

    if (nextStatus === 'banned' && !reason) {
      setFeedbackError('Ban reason is required.');
      return;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setUserActionProcessingId(userId);

    try {
      await api.patch(`/admin/users/${userId}/account-status`, {
        accountStatus: nextStatus,
        reason,
        suspensionDays,
      });

      setFeedbackSuccess(`Account status updated to ${nextStatus} for ${user?.name || user?.email || 'user'}.`);
      await Promise.all([fetchOverview(), fetchManagedUsers(), fetchAuditLogs()]);
      return true;
    } catch (err) {
      setFeedbackError(err?.response?.data?.message || 'Could not update account status.');
      return false;
    } finally {
      setUserActionProcessingId('');
    }
  };

  const openAccountActionModal = (user, nextStatus) => {
    const normalizedStatus = String(nextStatus || '').toLowerCase();
    if (!['suspended', 'banned'].includes(normalizedStatus)) {
      handleUserAccountAction(user, normalizedStatus || 'active');
      return;
    }

    setAccountActionModal({
      open: true,
      user,
      nextStatus: normalizedStatus,
      reason: normalizedStatus === 'banned' ? 'Severe policy violation.' : 'Policy violation detected.',
      suspensionDays: '7',
    });
  };

  const closeAccountActionModal = () => {
    if (userActionProcessingId) return;
    setAccountActionModal({
      open: false,
      user: null,
      nextStatus: '',
      reason: '',
      suspensionDays: '7',
    });
  };

  const confirmAccountActionModal = async () => {
    const { user, nextStatus, reason, suspensionDays } = accountActionModal;
    const normalizedStatus = String(nextStatus || '').toLowerCase();
    if (!user || !normalizedStatus) return;

    const success = await handleUserAccountAction(user, normalizedStatus, { reason, suspensionDays });
    if (success) {
      closeAccountActionModal();
    }
  };

  const handleReportStatusUpdate = async (report, nextStatus, options = {}) => {
    const reportId = String(report?._id || '');
    if (!reportId) return;

    const adminNote = String(options.adminNote || '').trim();
    if ((nextStatus === 'resolved' || nextStatus === 'dismissed') && !adminNote) {
      setFeedbackError('Resolution note is required for this status change.');
      return;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setReportActionProcessingId(reportId);

    try {
      await api.patch(`/admin/reports/${reportId}/status`, {
        status: nextStatus,
        adminNote,
      });

      setFeedbackSuccess(`Report status updated to ${nextStatus.replace('_', ' ')}.`);
      await Promise.all([fetchOverview(), fetchReports(), fetchAuditLogs()]);
      return true;
    } catch (err) {
      setFeedbackError(err?.response?.data?.message || 'Could not update report status.');
      return false;
    } finally {
      setReportActionProcessingId('');
    }
  };

  const openReportStatusModal = (report, nextStatus) => {
    const normalizedStatus = String(nextStatus || '').toLowerCase();
    if (!['resolved', 'dismissed'].includes(normalizedStatus)) {
      handleReportStatusUpdate(report, normalizedStatus);
      return;
    }

    setReportStatusModal({
      open: true,
      report,
      nextStatus: normalizedStatus,
      adminNote: 'Reviewed by admin.',
    });
  };

  const closeReportStatusModal = () => {
    if (reportActionProcessingId) return;
    setReportStatusModal({
      open: false,
      report: null,
      nextStatus: '',
      adminNote: '',
    });
  };

  const confirmReportStatusModal = async () => {
    const { report, nextStatus, adminNote } = reportStatusModal;
    if (!report || !nextStatus) return;

    const success = await handleReportStatusUpdate(report, nextStatus, { adminNote });
    if (success) {
      closeReportStatusModal();
    }
  };

  const handleListingReportDecision = async (report, severity, options = {}) => {
    const reportId = String(report?._id || '');
    if (!reportId) return;

    const normalizedSeverity = String(severity || '').toLowerCase();
    if (!['minor', 'major'].includes(normalizedSeverity)) return;

    const adminNote = String(options.adminNote || '').trim();
    if (!adminNote) {
      setFeedbackError('Admin decision note is required.');
      return;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setReportActionProcessingId(reportId);

    try {
      await api.patch(`/admin/reports/${reportId}/listing-decision`, {
        severity: normalizedSeverity,
        adminNote,
      });

      setFeedbackSuccess(
        normalizedSeverity === 'major'
          ? 'Major report decision applied: landlord banned and listing blocked.'
          : 'Minor report decision applied: listing rejected.'
      );

      await Promise.all([fetchOverview(), fetchManagedUsers(), fetchReports(), fetchAuditLogs()]);
      return true;
    } catch (err) {
      setFeedbackError(err?.response?.data?.message || 'Could not apply listing report decision.');
      return false;
    } finally {
      setReportActionProcessingId('');
    }
  };

  const openListingDecisionModal = (report, severity) => {
    const normalizedSeverity = String(severity || '').toLowerCase();
    if (!['minor', 'major'].includes(normalizedSeverity)) return;

    setListingDecisionModal({
      open: true,
      report,
      severity: normalizedSeverity,
      adminNote: normalizedSeverity === 'major'
        ? 'Major policy violation confirmed after report review.'
        : 'Minor violation confirmed; listing rejected pending corrections.',
    });
  };

  const closeListingDecisionModal = () => {
    if (reportActionProcessingId) return;
    setListingDecisionModal({
      open: false,
      report: null,
      severity: '',
      adminNote: '',
    });
  };

  const confirmListingDecisionModal = async () => {
    const { report, severity, adminNote } = listingDecisionModal;
    if (!report || !severity) return;

    const success = await handleListingReportDecision(report, severity, { adminNote });
    if (success) {
      closeListingDecisionModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-black tracking-tight text-[#1f2937]">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Moderate listings, manage user accounts, review abuse reports, and track admin actions.</p>

        {overviewError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {overviewError}
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <article key={card.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className={`mt-2 text-3xl font-black ${card.accent}`}>
                {overviewLoading ? '--' : Number(summary[card.key] || 0).toLocaleString()}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#1f2937]">Listing Moderation</h2>
              <p className="mt-1 text-sm text-slate-600">Approve or reject landlord listings before renters can see them.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                fetchOverview();
                fetchModerationListings();
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {listingFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setListingFilter(option.value)}
                className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                  listingFilter === option.value
                    ? 'bg-[#3A5AFF] text-white shadow-[0_8px_20px_rgba(58,90,255,0.25)]'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={applyListingSearch} className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={listingSearchInput}
              onChange={(event) => setListingSearchInput(event.target.value)}
              placeholder="Search by listing title, owner, email, or location"
              className="h-11 grow rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#3A5AFF]/40"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-linear-to-r from-[#3A5AFF] to-[#2746e8] px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(58,90,255,0.25)] transition hover:brightness-105"
            >
              Apply Search
            </button>
          </form>

          <p className="mt-3 text-xs font-medium text-slate-500">{listingCountLabel}</p>

          {feedbackError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {feedbackError}
            </div>
          )}

          {feedbackSuccess && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              {feedbackSuccess}
            </div>
          )}

          {listingsError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {listingsError}
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Listing</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listingsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-slate-500">Loading listings...</td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-slate-500">No listings found for selected moderation filter.</td>
                  </tr>
                ) : (
                  listings.map((listing) => {
                    const listingId = String(listing?._id || '');
                    const moderationStatus = String(listing?.moderationStatus || 'pending').toLowerCase();
                    const isProcessing = processingListingId === listingId;
                    const canModerate = moderationStatus === 'pending';

                    return (
                      <tr key={listingId}>
                        <td className="px-4 py-4 align-top">
                          <p className="font-semibold text-slate-800">{listing.title || 'Untitled listing'}</p>
                          <p className="text-xs text-slate-500">{listing.location || 'No location'}</p>
                          <p className="text-xs font-semibold text-[#1d4ed8]">Rs {Number(listing.price || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-700">{listing.ownerName || 'Unknown landlord'}</p>
                          <p className="text-xs text-slate-500">{listing.ownerEmail || 'No email'}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${moderationBadgeClass(moderationStatus)}`}>
                            {moderationStatus}
                          </span>
                          {listing.moderationNote ? (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{listing.moderationNote}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          {formatDate(listing.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <button
                              type="button"
                              disabled={isProcessing || !canModerate}
                              onClick={() => handleModerationDecision(listing, 'approved')}
                              className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing ? 'Saving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing || !canModerate}
                              onClick={() => {
                                if (canModerate) openRejectModal(listing);
                              }}
                              className="inline-flex h-9 items-center justify-center rounded-lg bg-rose-600 px-3 text-xs font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing ? 'Saving...' : 'Reject'}
                            </button>
                          </div>
                          {!canModerate && (
                            <p className="mt-2 text-[11px] font-medium text-slate-500">Decision finalized for this cycle</p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {rejectModalListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[#1f2937]">Reject Listing</h3>
              <p className="mt-1 text-sm text-slate-600">
                Please enter a reason for rejecting "{rejectModalListing?.title || 'this listing'}".
              </p>
              <p className="mt-1 text-xs text-slate-500">
                This note is shown to the landlord to help them fix and resubmit.
              </p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rejection Reason
                <textarea
                  value={rejectReasonInput}
                  onChange={(event) => setRejectReasonInput(event.target.value)}
                  placeholder="Write rejection reason for landlord"
                  rows={4}
                  maxLength={1200}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                />
                <p className="mt-1 text-[11px] text-slate-500 text-right">{String(rejectReasonInput || '').length}/1200</p>
              </label>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRejectWithReason}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {accountActionModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[#1f2937]">
                {accountActionModal.nextStatus === 'banned' ? 'Ban User Account' : 'Suspend User Account'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {accountActionModal.nextStatus === 'banned'
                  ? `Provide ban reason for ${accountActionModal.user?.name || accountActionModal.user?.email || 'this user'}.`
                  : `Provide suspension reason for ${accountActionModal.user?.name || accountActionModal.user?.email || 'this user'}.`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {accountActionModal.nextStatus === 'banned'
                  ? 'Ban immediately blocks future login and access.'
                  : 'Suspension blocks access until duration expires or admin reactivates the account.'}
              </p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action Reason
                <textarea
                  value={accountActionModal.reason}
                  onChange={(event) => setAccountActionModal((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder="Write reason"
                  rows={4}
                  maxLength={1200}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                />
                <p className="mt-1 text-[11px] text-slate-500 text-right">{String(accountActionModal.reason || '').length}/1200</p>
              </label>

              {accountActionModal.nextStatus === 'suspended' && (
                <div className="mt-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suspension Days</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={accountActionModal.suspensionDays}
                    onChange={(event) => setAccountActionModal((prev) => ({ ...prev, suspensionDays: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                  />
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAccountActionModal}
                  disabled={Boolean(userActionProcessingId)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAccountActionModal}
                  disabled={Boolean(userActionProcessingId)}
                  className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold text-white disabled:opacity-60 ${
                    accountActionModal.nextStatus === 'banned' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {userActionProcessingId ? 'Saving...' : accountActionModal.nextStatus === 'banned' ? 'Confirm Ban' : 'Confirm Suspension'}
                </button>
              </div>
            </div>
          </div>
        )}

        {reportStatusModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[#1f2937]">
                {reportStatusModal.nextStatus === 'dismissed' ? 'Dismiss Report' : 'Resolve Report'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Provide admin note for report status: {String(reportStatusModal.nextStatus || '').replace('_', ' ')}.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                This note is visible to the reporter for transparency.
              </p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Admin Note
                <textarea
                  value={reportStatusModal.adminNote}
                  onChange={(event) => setReportStatusModal((prev) => ({ ...prev, adminNote: event.target.value }))}
                  placeholder="Write admin note"
                  rows={4}
                  maxLength={1200}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                />
                <p className="mt-1 text-[11px] text-slate-500 text-right">{String(reportStatusModal.adminNote || '').length}/1200</p>
              </label>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReportStatusModal}
                  disabled={Boolean(reportActionProcessingId)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmReportStatusModal}
                  disabled={Boolean(reportActionProcessingId)}
                  className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold text-white disabled:opacity-60 ${
                    reportStatusModal.nextStatus === 'dismissed' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {reportActionProcessingId ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {listingDecisionModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[#1f2937]">
                {listingDecisionModal.severity === 'major' ? 'Major Decision: Ban Landlord' : 'Minor Decision: Reject Listing'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Provide admin decision note for this listing report.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {listingDecisionModal.severity === 'major'
                  ? 'Major will ban landlord account and reject listing.'
                  : 'Minor will reject listing but keep landlord account active.'}
              </p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Decision Note
                <textarea
                  value={listingDecisionModal.adminNote}
                  onChange={(event) => setListingDecisionModal((prev) => ({ ...prev, adminNote: event.target.value }))}
                  placeholder="Write admin decision note"
                  rows={4}
                  maxLength={1200}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                />
                <p className="mt-1 text-[11px] text-slate-500 text-right">{String(listingDecisionModal.adminNote || '').length}/1200</p>
              </label>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeListingDecisionModal}
                  disabled={Boolean(reportActionProcessingId)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmListingDecisionModal}
                  disabled={Boolean(reportActionProcessingId)}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {reportActionProcessingId ? 'Saving...' : 'Confirm Decision'}
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-bold tracking-tight text-[#1f2937]">Renter and Landlord Accounts</h2>
          <p className="mt-1 text-sm text-slate-600">Manage account access controls for renter and landlord users.</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {userFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setUserFilter(option.value)}
                className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                  userFilter === option.value
                    ? 'bg-[#1f2937] text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={applyUserSearch} className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={userSearchInput}
              onChange={(event) => setUserSearchInput(event.target.value)}
              placeholder="Search user by name or email"
              className="h-11 grow rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#3A5AFF]/40"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Search Users
            </button>
          </form>

          <p className="mt-3 text-xs font-medium text-slate-500">{userCountLabel}</p>

          {usersError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {usersError}
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={6}>Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={6}>No users found for selected filter.</td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const userId = String(user.id || '');
                    const isProcessing = userActionProcessingId === userId;
                    const accountStatus = String(user.accountStatus || 'active').toLowerCase();

                    return (
                      <tr key={userId}>
                        <td className="px-4 py-4 align-top">
                          <p className="font-semibold text-slate-800">{user.name || 'Unnamed User'}</p>
                          <p className="text-xs text-slate-500">{user.email || 'No email'}</p>
                          {user.phone ? <p className="text-xs text-slate-500">{user.phone}</p> : null}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${userBadgeClass(user.role)}`}>
                            {user.role === 'landlord' ? 'Landlord' : 'Renter'}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${accountStatusBadgeClass(accountStatus)}`}>
                            {accountStatus}
                          </span>
                          {user.suspensionUntil ? (
                            <p className="mt-1 text-[11px] text-slate-500">Until: {formatDateTime(user.suspensionUntil)}</p>
                          ) : null}
                          {user.accountActionReason ? (
                            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">Reason: {user.accountActionReason}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          {userActivityLabel(user)}
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isProcessing || accountStatus === 'active'}
                              onClick={() => handleUserAccountAction(user, 'active')}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Activate
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing || accountStatus === 'suspended'}
                              onClick={() => openAccountActionModal(user, 'suspended')}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-bold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Suspend
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing || accountStatus === 'banned'}
                              onClick={() => openAccountActionModal(user, 'banned')}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Ban
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#1f2937]">Report and Abuse Center</h2>
              <p className="mt-1 text-sm text-slate-600">Review reports from renters and landlords, then move them through resolution workflow.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                fetchOverview();
                fetchReports();
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {reportFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setReportFilter(option.value)}
                className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                  reportFilter === option.value
                    ? 'bg-[#1f2937] text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={applyReportSearch} className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={reportSearchInput}
              onChange={(event) => setReportSearchInput(event.target.value)}
              placeholder="Search report by description, category, or target"
              className="h-11 grow rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#3A5AFF]/40"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Search Reports
            </button>
          </form>

          <p className="mt-3 text-xs font-medium text-slate-500">{reportsCountLabel}</p>

          {reportsError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {reportsError}
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportsLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={6}>Loading reports...</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={6}>No reports found for selected filter.</td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const reportId = String(report?._id || '');
                    const status = String(report?.status || 'open').toLowerCase();
                    const isProcessing = reportActionProcessingId === reportId;
                    const isListingReport = String(report?.targetType || '').toLowerCase() === 'listing';
                    const isFinalized = ['resolved', 'dismissed'].includes(status);

                    return (
                      <tr key={reportId}>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-700">{report?.reporterId?.name || 'Unknown user'}</p>
                          <p className="text-xs text-slate-500">{report?.reporterId?.email || '-'}</p>
                          <p className="text-[11px] text-slate-500 capitalize">{report?.reporterRole || '-'}</p>
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          <p className="font-semibold capitalize text-slate-700">{report?.targetType || 'other'}</p>
                          <p>{report?.targetListingId?.title || report?.targetId || '-'}</p>
                          {report?.targetListingId?.location ? <p className="mt-0.5 text-[11px] text-slate-500">{report.targetListingId.location}</p> : null}
                          {report?.targetOwnerId?.email ? <p className="mt-0.5 text-[11px] text-slate-500">Owner: {report.targetOwnerId.email}</p> : null}
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          <p className="capitalize font-semibold text-slate-700">{report?.reasonCategory || 'other'}</p>
                          <p className="mt-1 line-clamp-2">{report?.description || '-'}</p>
                          {report?.landlordResponseNote ? <p className="mt-1 text-indigo-700">Landlord response: {report.landlordResponseNote}</p> : null}
                          {report?.adminNote ? <p className="mt-1 text-slate-500">Admin note: {report.adminNote}</p> : null}
                          {report?.adminDecisionSeverity && report.adminDecisionSeverity !== 'none' ? (
                            <p className="mt-1 text-[11px] text-slate-600">Decision: {String(report.adminDecisionSeverity).toUpperCase()} ({String(report.adminDecisionAction || 'none').replace('_', ' ')})</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${reportStatusBadgeClass(status)}`}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          {formatDate(report?.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isProcessing || status === 'in_review'}
                              onClick={() => handleReportStatusUpdate(report, 'in_review')}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-[11px] font-bold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing ? 'Saving...' : 'In Review'}
                            </button>
                            {!isListingReport && (
                              <button
                                type="button"
                                disabled={isProcessing || status === 'resolved'}
                                onClick={() => openReportStatusModal(report, 'resolved')}
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isProcessing ? 'Saving...' : 'Resolve'}
                              </button>
                            )}
                            {isListingReport && (
                              <>
                                <button
                                  type="button"
                                  disabled={isProcessing || isFinalized}
                                  onClick={() => openListingDecisionModal(report, 'minor')}
                                  className="inline-flex h-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-bold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing ? 'Saving...' : 'Minor: Reject Listing'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing || isFinalized}
                                  onClick={() => openListingDecisionModal(report, 'major')}
                                  className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing ? 'Saving...' : 'Major: Ban Landlord'}
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              disabled={isProcessing || status === 'dismissed'}
                              onClick={() => openReportStatusModal(report, 'dismissed')}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing ? 'Saving...' : 'Dismiss'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#1f2937]">Admin Audit Logs</h2>
              <p className="mt-1 text-sm text-slate-600">Track who performed what action and when.</p>
            </div>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <form onSubmit={applyAuditSearch} className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={auditSearchInput}
              onChange={(event) => setAuditSearchInput(event.target.value)}
              placeholder="Search by action, target, admin email, or reason"
              className="h-11 grow rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#3A5AFF]/40"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Search Logs
            </button>
          </form>

          <p className="mt-3 text-xs font-medium text-slate-500">{auditCountLabel}</p>

          {auditError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {auditError}
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={5}>Loading audit logs...</td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={5}>No audit logs found.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={String(log?._id)}>
                      <td className="px-4 py-4 align-top text-xs text-slate-700">
                        <p className="font-semibold capitalize">{String(log?.action || '').replace(/_/g, ' ') || '-'}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-600">
                        <p className="capitalize font-semibold text-slate-700">{log?.targetType || '-'}</p>
                        <p>{log?.targetLabel || log?.targetId || '-'}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-600">
                        {log?.adminEmail || '-'}
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-600 line-clamp-2">
                        {log?.reason || '-'}
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-600">
                        {formatDateTime(log?.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
