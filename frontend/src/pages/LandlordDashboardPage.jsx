import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LandlordSidebar from '../components/landlordDashboard/LandlordSidebar';
import DashboardHeader from '../components/landlordDashboard/DashboardHeader';
import DashboardOverviewTab from '../components/landlordDashboard/DashboardOverviewTab';
import ListingsTab from '../components/landlordDashboard/ListingsTab';
import ChatTab from '../components/landlordDashboard/ChatTab';
import BookingsTab from '../components/landlordDashboard/BookingsTab';
import ProfileTab from '../components/landlordDashboard/ProfileTab';
import ReportCenterPanel from '../components/shared/ReportCenterPanel';
import { useLandlordDashboardController } from '../hooks/useLandlordDashboardController';
import { useToast } from '../context/ToastContext';
import { getNotificationTargetPath } from '../utils/notificationNavigation';

const landlordTargetTypeOptions = [
  { value: 'user', label: 'User' },
  { value: 'booking', label: 'Booking' },
  { value: 'chat', label: 'Chat' },
  { value: 'review', label: 'Review' },
  { value: 'other', label: 'Other' },
];

const LandlordDashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, refs, handlers } = useLandlordDashboardController();
  const { showToast } = useToast();

  useEffect(() => {
    if (!state.error) return;
    showToast({ type: 'error', title: 'Dashboard error', message: state.error });
  }, [state.error, showToast]);

  useEffect(() => {
    if (!state.success) return;
    showToast({ type: 'success', title: 'Success', message: state.success });
  }, [state.success, showToast]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const requestedTab = query.get('tab');
    const chatId = query.get('chatId');
    const allowedTabs = new Set(['dashboard', 'listings', 'chat', 'bookings', 'reports', 'profile']);

    if (requestedTab && allowedTabs.has(requestedTab)) {
      handlers.setActiveTab(requestedTab);
    }

    if (requestedTab === 'chat' && chatId) {
      handlers.handleOpenOwnerChat(chatId);
    }
  }, [location.search, handlers]);

  const handleLandlordNotificationNavigate = (notification) => {
    const targetPath = getNotificationTargetPath({ notification, isLandlord: true });
    navigate(targetPath);
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fe] font-sans text-gray-800">
      <LandlordSidebar
        activeTab={state.activeTab}
        setActiveTab={handlers.setActiveTab}
        stats={state.stats}
      />

      <main className="flex-1 p-5 md:p-8 overflow-y-auto">
        <DashboardHeader
          profilePhoto={state.profileForm.profilePhoto}
          profileName={state.profileForm.name}
          notifications={state.notifications}
          unreadNotifications={state.unreadNotifications}
          onMarkNotificationRead={handlers.markNotificationAsRead}
          onMarkAllNotificationsRead={handlers.markAllNotificationsAsRead}
          onClearAllNotifications={handlers.clearAllNotifications}
          onNotificationNavigate={handleLandlordNotificationNavigate}
        />

        {state.activeTab === 'dashboard' && (
          <DashboardOverviewTab stats={state.stats} ownerBookings={state.ownerBookings} />
        )}

        {state.activeTab === 'listings' && (
          <ListingsTab
            stats={state.stats}
            form={state.form}
            editingListingId={state.editingListingId}
            handleChange={handlers.handleChange}
            handleAddKeyFeature={handlers.handleAddKeyFeature}
            handleRemoveKeyFeature={handlers.handleRemoveKeyFeature}
            handleSubmit={handlers.handleSubmit}
            submitting={state.submitting}
            locating={state.locating}
            fileInputRef={refs.fileInputRef}
            modelInputRef={refs.modelInputRef}
            handleImageSelect={handlers.handleImageSelect}
            handleModelSelect={handlers.handleModelSelect}
            openImagePicker={handlers.openImagePicker}
            openModelPicker={handlers.openModelPicker}
            handleUseCurrentLocation={handlers.handleUseCurrentLocation}
            clearSelectedImage={handlers.clearSelectedImage}
            clearSelectedModel={handlers.clearSelectedModel}
            handleRemoveSelectedImage={handlers.handleRemoveSelectedImage}
            handleStartNewListing={handlers.handleStartNewListing}
            imageName={state.imageName}
            modelName={state.modelName}
            uploadingModel={state.uploadingModel}
            uploadingModelProgress={state.uploadingModelProgress}
            loading={state.loading}
            listings={state.listings}
            handleViewListing={handlers.handleViewListing}
            handleEditDraft={handlers.handleEditDraft}
            handleDelete={handlers.handleDelete}
            deletingId={state.deletingId}
            formatDate={handlers.formatDate}
          />
        )}

        {state.activeTab === 'chat' && (
          <ChatTab
            ownerChats={state.ownerChats}
            selectedOwnerChatId={state.selectedOwnerChatId}
            chatDrafts={state.chatDrafts}
            setChatDrafts={handlers.setChatDrafts}
            handleOpenOwnerChat={handlers.handleOpenOwnerChat}
            handleOwnerReply={handlers.handleOwnerReply}
            sendingChatId={state.sendingChatId}
            isChatUnread={handlers.isChatUnread}
          />
        )}

        {state.activeTab === 'bookings' && (
          <BookingsTab
            ownerBookings={state.ownerBookings}
            bookingResponseDrafts={state.bookingResponseDrafts}
            setBookingResponseDrafts={handlers.setBookingResponseDrafts}
            handleOwnerBookingDecision={handlers.handleOwnerBookingDecision}
            updatingBookingId={state.updatingBookingId}
          />
        )}

        {state.activeTab === 'reports' && (
          <div className="space-y-6">
            <ReportCenterPanel
              title="Landlord Report Center"
              subtitle="Report abusive renters, suspicious activity, or policy violations."
              targetTypeOptions={landlordTargetTypeOptions}
              reportForm={state.reportForm}
              onReportFormChange={handlers.handleReportFormChange}
              handleCreateReport={handlers.handleCreateReport}
              reportSubmitting={state.reportSubmitting}
              reports={state.reports}
              reportsLoading={state.reportsLoading}
              handleRefreshReports={handlers.refreshReports}
              emptyMessage="No reports submitted from this account yet."
            />

            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
              <h3 className="text-xl font-bold text-[#132238] mb-1">Reports Received On Your Listings</h3>
              <p className="text-sm text-gray-500 mb-4">When renters report your listing, respond here so admin can review your resolution details.</p>

              {state.ownerListingReportsLoading ? (
                <p className="text-sm text-gray-500">Loading incoming listing reports...</p>
              ) : state.ownerListingReports.length === 0 ? (
                <p className="text-sm text-gray-500">No renter reports received on your listings yet.</p>
              ) : (
                <div className="space-y-3">
                  {state.ownerListingReports.map((report) => {
                    const reportId = String(report?._id || '');
                    const reportStatus = String(report?.status || 'open').toLowerCase();
                    const isFinalized = ['resolved', 'dismissed'].includes(reportStatus);
                    const isResponding = state.reportResponseProcessingId === reportId;

                    return (
                      <article key={reportId} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-[#132238]">
                              {report?.targetListingId?.title || 'Reported listing'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{report?.targetListingId?.location || report?.targetId || 'Listing ID unavailable'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Reported by: {report?.reporterId?.name || 'Renter'} ({report?.reporterId?.email || '-'})
                            </p>
                          </div>

                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                            reportStatus === 'resolved'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : reportStatus === 'dismissed'
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : reportStatus === 'in_review'
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}>
                            {reportStatus.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-gray-700 leading-relaxed">{report?.description || '-'}</p>

                        {report?.landlordResponseNote ? (
                          <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Your previous response</p>
                            <p className="mt-1 text-sm text-indigo-800 leading-relaxed">{report.landlordResponseNote}</p>
                          </div>
                        ) : null}

                        {report?.adminNote ? (
                          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Admin note</p>
                            <p className="mt-1 text-sm text-emerald-800 leading-relaxed">{report.adminNote}</p>
                          </div>
                        ) : null}

                        {!isFinalized && (
                          <div className="mt-3 space-y-2">
                            <textarea
                              rows={3}
                              value={state.reportResponseDrafts[reportId] || ''}
                              onChange={(event) => handlers.setReportResponseDrafts((prev) => ({
                                ...prev,
                                [reportId]: event.target.value,
                              }))}
                              placeholder="Write how you resolved this issue so renter and admin can review it"
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            />
                            <button
                              type="button"
                              onClick={() => handlers.handleOwnerListingReportResponse(reportId)}
                              disabled={isResponding}
                              className="px-4 py-2 rounded-md bg-[#132238] text-white text-xs font-bold hover:bg-[#0b1627] disabled:opacity-60"
                            >
                              {isResponding ? 'Submitting...' : 'Submit Resolution Response'}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {state.activeTab === 'profile' && (
          <ProfileTab
            profileForm={state.profileForm}
            handleProfileChange={handlers.handleProfileChange}
            handleProfileSubmit={handlers.handleProfileSubmit}
            savingProfile={state.savingProfile}
            profileImageInputRef={refs.profileImageInputRef}
            handleProfileImageSelect={handlers.handleProfileImageSelect}
            clearProfileImage={handlers.clearProfileImage}
          />
        )}
      </main>
    </div>
  );
};

export default LandlordDashboardPage;
