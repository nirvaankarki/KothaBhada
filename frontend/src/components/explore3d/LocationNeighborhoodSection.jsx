import React from 'react';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';

const LocationNeighborhoodSection = ({
  listing,
  mapQuery,
  locationPanelHeight,
  isLoadingDynamicAreaHighlights,
  areaHighlightsToDisplay,
  dynamicAreaHighlights,
  dynamicAreaHighlightsError,
  getPlaceVisuals,
  formatDistance,
}) => {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 md:p-6 lg:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5 md:mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#3A5AFF] rounded-full" />
            Location & Neighborhood
          </h2>
          <div className="mt-2 flex items-center gap-1.5 text-slate-500">
            <MapPin size={14} className="text-[#3A5AFF]" />
            <span className="text-sm font-semibold">{listing.location || 'Location not specified'}</span>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps?q=${mapQuery}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-[#3A5AFF] bg-[#3A5AFF]/5 px-4 py-2 text-xs md:text-sm font-bold text-[#3A5AFF] hover:bg-[#3A5AFF]/20 transition-colors"
        >
          Open Google Maps <ExternalLink size={14} />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl overflow-hidden border border-slate-100 shadow-lg shadow-slate-200/40 bg-white items-stretch">
        <div className="lg:col-span-7 relative border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-100 h-full">
          <iframe
            title="Property location map"
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            className="w-full h-full grayscale-[0.08] contrast-[1.06]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div
          className="lg:col-span-5 p-5 md:p-6 bg-slate-50/60"
          style={{ minHeight: `${locationPanelHeight}px` }}
        >
          <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">Neighborhood Highlights</h4>
          <div className="space-y-3">
            {isLoadingDynamicAreaHighlights && (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2.5 text-slate-600">
                  <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-[#3A5AFF] animate-spin" />
                  <p className="text-xs font-semibold">Fetching live nearby places...</p>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  We are checking important neighborhood services around this location.
                </p>

                <div className="mt-3 space-y-2.5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={`highlight-loading-${idx}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 animate-pulse">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="h-7 w-7 rounded-lg bg-slate-200 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                          <div className="mt-1.5 h-3 w-18 rounded bg-slate-200" />
                        </div>
                      </div>
                      <div className="ml-3 h-3.5 w-12 rounded bg-slate-200 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {areaHighlightsToDisplay.map((highlight, index) => (
              <div key={`${highlight.label}-${index}`} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {(() => {
                    const { Icon, badgeClass } = getPlaceVisuals(highlight.type);
                    return (
                      <>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <Icon size={14} />
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">{highlight.label}</p>
                          <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                            {highlight.categoryLabel || highlight.typeLabel || 'Nearby'}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="ml-3 flex items-center gap-1 text-slate-400 shrink-0">
                  <Navigation size={12} className="rotate-45" />
                  <span className="text-[11px] font-semibold">{formatDistance(highlight.distance)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-[10px] italic leading-relaxed text-slate-400">
              {dynamicAreaHighlights.length
                ? '* Live nearby places are fetched in real time from map data around this location.'
                : dynamicAreaHighlightsError
                  ? '* Live data unavailable. Showing listing-provided neighborhood context.'
                  : '* Showing listing-provided neighborhood context.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationNeighborhoodSection;
