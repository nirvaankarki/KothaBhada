import React from 'react';
import {
  Box,
  AlertCircle,
  Image as ImageIcon,
  Navigation,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import MarzipanoViewer from './MarzipanoViewer';

const RoomVisualizationSection = ({
  is3dTourStarted,
  setIs3dTourStarted,
  panoramaScenes,
  panoramaImages,
  roomImages,
  activeRoomImageIndex,
  showPreviousRoomImage,
  showNextRoomImage,
  setActiveRoomImageIndex,
}) => {
  const scenes = React.useMemo(() => {
    if (Array.isArray(panoramaScenes) && panoramaScenes.length > 0) {
      return panoramaScenes;
    }

    if (!Array.isArray(panoramaImages)) {
      return [];
    }

    return panoramaImages
      .map((item, index) => {
        const imageUrl = String(item || '').trim();
        if (!imageUrl) return null;

        return {
          title: `Scene ${index + 1}`,
          imageUrl,
          links: [],
        };
      })
      .filter(Boolean)
      .slice(0, 12);
  }, [panoramaScenes, panoramaImages]);

  const hasPanoramaTour = scenes.length > 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col border border-slate-100">
      <div className="p-4 border-b border-slate-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 md:max-w-[66%]">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#1a222e]">
              <Box size={20} className="text-[#3A5AFF]" />
              360 Room Tour
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {is3dTourStarted
                ? 'Interactive room experience powered by linked panorama scenes.'
                : 'Preview landlord-uploaded room photos first, then start the interactive tour.'}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="relative inline-grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 px-0.5">
              <span
                className={`pointer-events-none absolute inset-y-0.5 left-0.5 z-0 w-[calc(50%-2px)] rounded-lg bg-[#3A5AFF] shadow-sm transition-transform duration-300 ease-out ${
                  is3dTourStarted ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setIs3dTourStarted(false);
                }}
                className={`relative z-10 inline-flex items-center justify-center gap-1.5 rounded-l-xl rounded-r-none px-3 py-2.5 text-xs font-bold transition-colors duration-300 ease-in-out ${
                  !is3dTourStarted
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ImageIcon size={13} /> 2D Photos
              </button>
              <button
                type="button"
                onClick={() => {
                  if (hasPanoramaTour) {
                    setIs3dTourStarted(true);
                  }
                }}
                disabled={!hasPanoramaTour}
                className={`relative z-10 inline-flex items-center justify-center gap-1.5 rounded-r-xl rounded-l-none px-3 py-2.5 text-xs font-bold transition-colors duration-300 ease-in-out ${
                  is3dTourStarted
                    ? 'text-white'
                    : hasPanoramaTour
                      ? 'text-slate-500 hover:text-slate-700'
                      : 'text-slate-400'
                }`}
              >
                <Navigation size={13} /> 360 Tour
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50/40">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-900">
          {is3dTourStarted ? (
            hasPanoramaTour ? (
              <MarzipanoViewer panoramaImages={scenes} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#0b1220] via-[#0f172a] to-[#1e293b] px-4">
                <div className="max-w-md rounded-2xl border border-white/20 bg-white/95 p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur">
                  <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-200">
                    <AlertCircle size={22} />
                  </div>
                  <h3 className="text-base font-bold text-red-700">360 Tour Not Available</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    This listing does not have panorama scenes yet.
                  </p>
                </div>
              </div>
            )
          ) : (
            <>
              <div
                className="absolute inset-0 flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeRoomImageIndex * 100}%)` }}
              >
                {roomImages.map((imageUrl, index) => (
                  <img
                    key={`${imageUrl}-${index}`}
                    src={imageUrl}
                    className="h-full w-full shrink-0 object-cover"
                    alt={`Room preview ${index + 1}`}
                  />
                ))}
              </div>

              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

              {roomImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousRoomImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-white hover:bg-black/60"
                    aria-label="Previous room image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={showNextRoomImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-white hover:bg-black/60"
                    aria-label="Next room image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">2D Room Preview</p>
                  <p className="text-[11px] text-white/80">
                    Image {activeRoomImageIndex + 1} of {roomImages.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (hasPanoramaTour) {
                      setIs3dTourStarted(true);
                    }
                  }}
                  disabled={!hasPanoramaTour}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3A5AFF] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#2F49E6]"
                >
                  <Navigation size={14} /> Start 360 Tour
                </button>
              </div>
            </>
          )}

          {is3dTourStarted && hasPanoramaTour && (
            <div className="absolute top-3 left-3 rounded-lg border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
              360 scene tour: drag to look around and click hotspots to move scenes.
            </div>
          )}
        </div>

        {roomImages.length > 1 && !is3dTourStarted && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {roomImages.map((imageUrl, index) => (
              <button
                key={`${imageUrl}-${index}-dot`}
                type="button"
                onClick={() => setActiveRoomImageIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  activeRoomImageIndex === index ? 'w-8 bg-[#3A5AFF]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomVisualizationSection;
