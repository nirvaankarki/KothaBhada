import React from 'react';
import { ArrowLeft } from 'lucide-react';
import AuthRequiredModal from '../components/AuthRequiredModal';
import ChatOverlay from '../components/explore3d/ChatOverlay';
import KeyFeaturesSection from '../components/explore3d/KeyFeaturesSection';
import LocationNeighborhoodSection from '../components/explore3d/LocationNeighborhoodSection';
import PropertySummarySection from '../components/explore3d/PropertySummarySection';
import ReviewsSection from '../components/explore3d/ReviewsSection';
import ReviewSummarySection from '../components/explore3d/ReviewSummarySection';
import RoomVisualizationSection from '../components/explore3d/RoomVisualizationSection';
import ListingReportModal from '../components/shared/ListingReportModal';
import { useExplore3DController } from '../hooks/useExplore3DController';

const Explore3DPage = ({ isLandlordView = false }) => {
  const controller = useExplore3DController({ isLandlordView });

  // Ensure page starts at the top when a listing is opened
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [controller.listing?.listingId]);

  const handleBackNavigation = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      controller.navigate(-1);
      return;
    }

    controller.navigate('/landlord/dashboard');
  };

  if (controller.isLoading && !controller.listing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading listing details...</div>
      </div>
    );
  }

  if (!controller.listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white border border-gray-200 rounded-sm shadow-sm p-6">
          <h1 className="text-xl font-bold text-[#1a222e]">Listing not found</h1>
          <p className="text-sm text-gray-600 mt-2">We could not find details for this listing.</p>
          <button
            type="button"
            onClick={() => controller.navigate(isLandlordView ? '/landlord/dashboard' : '/viewlisting')}
            className="mt-4 kb-btn kb-btn-secondary"
          >
            {isLandlordView ? 'Back to Dashboard' : 'Back to Listings'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans px-4 md:px-8 py-4 md:py-8">
      {isLandlordView ? (
        <div className="w-full max-w-350 mx-auto mb-4">
          <button
            type="button"
            onClick={handleBackNavigation}
            className="flex items-center gap-2 text-[#3b66ff] font-semibold hover:text-blue-700 transition-colors"
          >
            <ArrowLeft size={20} /> Back
          </button>
        </div>
      ) : null}

      {!isLandlordView ? (
        <AuthRequiredModal
          open={controller.showAuthModal}
          message="Please log in or sign up to save this listing to favorites."
          onCancel={() => controller.setShowAuthModal(false)}
          onConfirm={() => controller.navigate('/login', { state: { from: controller.location.pathname + controller.location.search } })}
        />
      ) : null}

      {!isLandlordView ? (
        <ListingReportModal
          open={controller.isListingReportModalOpen}
          listingTitle={controller.listing?.title || ''}
          reasonCategory={controller.listingReportReasonCategory}
          description={controller.listingReportDescription}
          onChangeReason={controller.setListingReportReasonCategory}
          onChangeDescription={controller.setListingReportDescription}
          onCancel={controller.closeListingReportModal}
          onSubmit={controller.submitListingReport}
          isSubmitting={controller.listingReportSubmitting}
        />
      ) : null}

      <div className="w-full max-w-350 mx-auto">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-[68%_32%] xl:grid-cols-[70%_30%] gap-6 items-start">
            <RoomVisualizationSection
              is3dTourStarted={controller.is3dTourStarted}
              setIs3dTourStarted={controller.setIs3dTourStarted}
              panoramaScenes={controller.panoramaScenes}
              panoramaImages={controller.panoramaImages}
              roomImages={controller.roomImages}
              activeRoomImageIndex={controller.activeRoomImageIndex}
              showPreviousRoomImage={controller.showPreviousRoomImage}
              showNextRoomImage={controller.showNextRoomImage}
              setActiveRoomImageIndex={controller.setActiveRoomImageIndex}
            />

            <div className="space-y-6">
              <PropertySummarySection
                listing={controller.listing}
                isDescriptionOpen={controller.isDescriptionOpen}
                setIsDescriptionOpen={controller.setIsDescriptionOpen}
                listingDescription={controller.listingDescription}
                handleBookVisitClick={controller.handleBookVisitClick}
                handleReportListing={controller.handleReportListing}
                isBookedListing={controller.isBookedListing}
                canReportListing={controller.canReportListing}
                openChatOverlay={controller.openChatOverlay}
                unreadChatCount={controller.unreadChatCount}
                isLandlordView={isLandlordView}
              />
            </div>
          </div>

          <section className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
              <section className="xl:col-span-12 space-y-8 min-w-0">
                <KeyFeaturesSection featuresToDisplay={controller.featuresToDisplay} />

                <LocationNeighborhoodSection
                  listing={controller.listing}
                  mapQuery={controller.mapQuery}
                  locationPanelHeight={controller.locationPanelHeight}
                  isLoadingDynamicAreaHighlights={controller.isLoadingDynamicAreaHighlights}
                  areaHighlightsToDisplay={controller.areaHighlightsToDisplay}
                  dynamicAreaHighlights={controller.dynamicAreaHighlights}
                  dynamicAreaHighlightsError={controller.dynamicAreaHighlightsError}
                  getPlaceVisuals={controller.getPlaceVisuals}
                  formatDistance={controller.formatDistance}
                />

                {!isLandlordView ? (
                  <ReviewSummarySection
                    isLoadingDetailsReviews={controller.isLoadingDetailsReviews}
                    detailsReviewSummary={controller.detailsReviewSummary}
                    scrollToReviewsSection={controller.scrollToReviewsSection}
                  />
                ) : null}

                {!isLandlordView ? (
                  <ReviewsSection
                    isAuthenticated={controller.isAuthenticated}
                    listingId={controller.listing.listingId}
                    reviewRefreshTrigger={controller.reviewRefreshTrigger}
                    setReviewRefreshTrigger={controller.setReviewRefreshTrigger}
                    reviewsSectionRef={controller.reviewsSectionRef}
                  />
                ) : null}
              </section>
            </div>
          </section>
        </div>
      </div>

      {!isLandlordView ? (
        <ChatOverlay
          isOpen={controller.isChatOverlayOpen}
          onClose={controller.closeChatOverlay}
          listingKey={controller.listingKey}
          listing={controller.listing}
        />
      ) : null}
    </div>
  );
};

export default Explore3DPage;