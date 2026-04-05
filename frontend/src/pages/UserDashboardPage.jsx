import React from 'react';
import ConfirmModal from '../components/ConfirmModal';
import DashboardTabs from '../components/userDashboard/DashboardTabs';
import ListingCardsSection from '../components/userDashboard/ListingCardsSection';
import InquiriesSection from '../components/userDashboard/InquiriesSection';
import BookingsSection from '../components/userDashboard/BookingsSection';
import ReportCenterPanel from '../components/shared/ReportCenterPanel';
import { useUserDashboardController } from '../hooks/useUserDashboardController';

const UserDashboardPage = () => {
  const {
    favorites,
    history,
    inquiries,
    bookings,
    reports,
    loading,
    reportsLoading,
    reportSubmitting,
    activeTab,
    setActiveTab,
    showClearHistoryConfirm,
    setShowClearHistoryConfirm,
    pendingFavoriteRemoval,
    inquiryForm,
    setInquiryForm,
    bookingForm,
    setBookingForm,
    reportForm,
    setReportForm,
    replyDrafts,
    setReplyDrafts,
    sourceListings,
    handleRemoveFavoriteRequest,
    handleCancelRemoveFavorite,
    handleConfirmRemoveFavorite,
    handleClearHistoryRequest,
    handleConfirmClearHistory,
    handleListingSelectForInquiry,
    handleListingSelectForBooking,
    handleCreateInquiry,
    handleCreateBooking,
    handleSendReply,
    handleCreateReport,
    refreshReports,
    statusPill,
    formatStatusLabel,
  } = useUserDashboardController();

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-6 md:px-10 lg:px-16 py-10">
      <ConfirmModal
        open={showClearHistoryConfirm}
        title="Clear Viewing History?"
        message="Remove all viewing history? This action cannot be undone."
        onCancel={() => setShowClearHistoryConfirm(false)}
        onConfirm={handleConfirmClearHistory}
        confirmLabel="Clear"
        confirmVariant="danger"
      />

      <ConfirmModal
        open={Boolean(pendingFavoriteRemoval)}
        title="Remove favorite listing"
        message="Are you sure you want to remove this listing from your favorites?"
        onCancel={handleCancelRemoveFavorite}
        onConfirm={handleConfirmRemoveFavorite}
        confirmLabel="Remove"
        confirmVariant="danger"
      />

      <div className="max-w-300 mx-auto">
        <h1 className="text-4xl font-black text-[#1a222e] mb-6 tracking-tight">My Dashboard</h1>

        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {loading ? (
          <div className="text-sm text-gray-500 font-medium">Loading dashboard...</div>
        ) : (
          <>
            {activeTab === 'history' && history.length > 0 && (
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleClearHistoryRequest}
                  className="px-4 py-2 text-xs font-bold text-red-600 border border-red-200 rounded-sm hover:bg-red-50"
                >
                  Remove All History
                </button>
              </div>
            )}

            {activeTab === 'favorites' && (
              <ListingCardsSection cards={favorites} cardType="favorites" onRemoveFavorite={handleRemoveFavoriteRequest} />
            )}

            {activeTab === 'history' && (
              <ListingCardsSection cards={history} cardType="history" onRemoveFavorite={handleRemoveFavoriteRequest} />
            )}

            {activeTab === 'inquiries' && (
              <InquiriesSection
                sourceListings={sourceListings}
                inquiryForm={inquiryForm}
                setInquiryForm={setInquiryForm}
                inquiries={inquiries}
                replyDrafts={replyDrafts}
                setReplyDrafts={setReplyDrafts}
                handleListingSelectForInquiry={handleListingSelectForInquiry}
                handleCreateInquiry={handleCreateInquiry}
                handleSendReply={handleSendReply}
                statusPill={statusPill}
                formatStatusLabel={formatStatusLabel}
              />
            )}

            {activeTab === 'bookings' && (
              <BookingsSection
                sourceListings={sourceListings}
                bookingForm={bookingForm}
                setBookingForm={setBookingForm}
                bookings={bookings}
                handleListingSelectForBooking={handleListingSelectForBooking}
                handleCreateBooking={handleCreateBooking}
                statusPill={statusPill}
                formatStatusLabel={formatStatusLabel}
              />
            )}

            {activeTab === 'reports' && (
              <ReportCenterPanel
                title="Report and Abuse Center"
                subtitle="Report suspicious activity and follow status updates from admins."
                reportForm={reportForm}
                onReportFormChange={(field, value) => setReportForm((prev) => ({ ...prev, [field]: value }))}
                handleCreateReport={handleCreateReport}
                reportSubmitting={reportSubmitting}
                reports={reports}
                reportsLoading={reportsLoading}
                handleRefreshReports={refreshReports}
                emptyMessage="You have not submitted any reports yet."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;
