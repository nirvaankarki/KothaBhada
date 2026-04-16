import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MarzipanoViewer from '../components/explore3d/MarzipanoViewer';

function extractPanoramaImages(state) {
  const directImages = Array.isArray(state?.images) ? state.images : [];
  if (directImages.length) return directImages;

  const listingPanoramaImages = Array.isArray(state?.listing?.panoramaImages)
    ? state.listing.panoramaImages
    : [];

  return listingPanoramaImages;
}

const PanoramaTourPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const panoramaImages = extractPanoramaImages(location.state || {});
  const listingTitle = String(location.state?.listing?.title || '360 Panorama Tour').trim();

  return (
    <div className="min-h-screen bg-slate-950 px-3 py-4 text-white md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold md:text-2xl">{listingTitle}</h1>
            <p className="text-xs text-slate-300 md:text-sm">Interactive 360 panoramic tour powered by Marzipano.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"
          >
            Back
          </button>
        </div>

        <div className="h-[74vh] min-h-[360px] w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900">
          <MarzipanoViewer panoramaImages={panoramaImages} />
        </div>
      </div>
    </div>
  );
};

export default PanoramaTourPage;
