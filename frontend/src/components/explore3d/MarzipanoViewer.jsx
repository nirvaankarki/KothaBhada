import React, { useEffect, useMemo, useRef, useState } from 'react';
import Marzipano from 'marzipano';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, RotateCcw } from 'lucide-react';

function normalizeSceneLinks(input, totalScenes, fallbackIndex = 0) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((link) => {
      if (!link || typeof link !== 'object') return null;

      const targetIndex = Number(link.targetIndex ?? link.toIndex ?? link.sceneIndex ?? fallbackIndex);
      if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= totalScenes) {
        return null;
      }

      const yaw = Number(link.yaw);
      const pitch = Number(link.pitch);

      return {
        targetIndex,
        label: String(link.label || '').trim(),
        yaw: Number.isFinite(yaw) ? Number(yaw.toFixed(4)) : 0,
        pitch: Number.isFinite(pitch) ? Number(pitch.toFixed(4)) : 0,
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

function normalizePanoramaImages(input) {
  if (!Array.isArray(input)) return [];

  const cleaned = input
    .map((item) => {
      if (typeof item === 'string') {
        const imageUrl = item.trim();
        return imageUrl ? { imageUrl, title: '', links: [] } : null;
      }

      if (!item || typeof item !== 'object') return null;

      const imageUrl = String(item.imageUrl || item.url || '').trim();
      if (!imageUrl) return null;

      return {
        imageUrl,
        title: String(item.title || item.label || item.name || '').trim(),
        links: Array.isArray(item.links) ? item.links : (Array.isArray(item.hotspots) ? item.hotspots : []),
      };
    })
    .filter(Boolean)
    .slice(0, 12);

  const normalized = cleaned.map((scene, index) => ({
    imageUrl: scene.imageUrl,
    title: scene.title || `Scene ${index + 1}`,
    links: normalizeSceneLinks(scene.links, cleaned.length, index),
  }));

  return normalized.map((scene, index) => {
    if (scene.links.length || normalized.length <= 1) {
      return scene;
    }

    return {
      ...scene,
      links: [{
        targetIndex: (index + 1) % normalized.length,
        label: `Go to ${normalized[(index + 1) % normalized.length]?.title || `Scene ${(index + 2)}`}`,
        yaw: 0,
        pitch: 0,
      }],
    };
  });
}

function createSceneHotspot({ label, onClick }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'marzipano-hotspot-link';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.gap = '6px';
  button.style.padding = '6px 10px';
  button.style.border = '1px solid rgba(255, 255, 255, 0.3)';
  button.style.borderRadius = '999px';
  button.style.background = 'rgba(15, 23, 42, 0.7)';
  button.style.color = '#ffffff';
  button.style.fontSize = '11px';
  button.style.fontWeight = '700';
  button.style.cursor = 'pointer';
  button.style.backdropFilter = 'blur(4px)';
  button.style.whiteSpace = 'nowrap';
  button.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.35)';
  button.textContent = label;

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });

  return button;
}

const MarzipanoViewer = ({ panoramaImages = [], initialSceneIndex = 0, onSceneChange }) => {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const scenesRef = useRef([]);
  const autorotateRef = useRef(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [viewerError, setViewerError] = useState('');
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scenes = useMemo(() => normalizePanoramaImages(panoramaImages), [panoramaImages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    if (!scenes.length) {
      setViewerError('No panorama scenes are available for this listing.');
      return undefined;
    }

    setViewerError('');
    container.innerHTML = '';

    try {
      const viewer = new Marzipano.Viewer(container, {
        controls: {
          mouseViewMode: 'drag',
        },
      });

      const geometry = new Marzipano.EquirectGeometry([
        { width: 1024 },
        { width: 2048 },
        { width: 4096 },
      ]);

      const builtScenes = scenes.map((scene) => {
        const source = Marzipano.ImageUrlSource.fromString(scene.imageUrl);
        const limiter = Marzipano.RectilinearView.limit.traditional(4096, (120 * Math.PI) / 180);
        const view = new Marzipano.RectilinearView({ yaw: 0, pitch: 0, fov: Math.PI / 2 }, limiter);

        return viewer.createScene({
          source,
          geometry,
          view,
          pinFirstLevel: true,
        });
      });

      viewerRef.current = viewer;
      scenesRef.current = builtScenes;

      const switchToScene = (sceneIndex) => {
        const totalScenes = builtScenes.length;
        if (!totalScenes) return;

        const normalizedIndex = ((sceneIndex % totalScenes) + totalScenes) % totalScenes;
        const targetScene = builtScenes[normalizedIndex];
        if (!targetScene) return;

        targetScene.switchTo();
        setCurrentSceneIndex(normalizedIndex);

        if (typeof onSceneChange === 'function') {
          onSceneChange(normalizedIndex, scenes[normalizedIndex]);
        }
      };

      scenes.forEach((scene, sceneIndex) => {
        const hotspotContainer = builtScenes[sceneIndex]?.hotspotContainer?.();
        if (!hotspotContainer) return;

        scene.links.forEach((link) => {
          if (!Number.isInteger(link.targetIndex)) return;

          const targetSceneTitle = scenes[link.targetIndex]?.title || `Scene ${link.targetIndex + 1}`;
          const hotspotElement = createSceneHotspot({
            label: String(link.label || `Go to ${targetSceneTitle}`).trim() || `Go to ${targetSceneTitle}`,
            onClick: () => switchToScene(link.targetIndex),
          });

          hotspotContainer.createHotspot(hotspotElement, {
            yaw: Number.isFinite(Number(link.yaw)) ? Number(link.yaw) : 0,
            pitch: Number.isFinite(Number(link.pitch)) ? Number(link.pitch) : 0,
          });
        });
      });

      const safeInitialIndex = Math.max(0, Math.min(scenes.length - 1, Number(initialSceneIndex) || 0));
      switchToScene(safeInitialIndex);
    } catch {
      setViewerError('Could not initialize 360 panorama viewer for this listing.');
    }

    return () => {
      const viewer = viewerRef.current;
      if (viewer) {
        viewer.stopMovement();
      }

      scenesRef.current = [];
      viewerRef.current = null;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [scenes, initialSceneIndex, onSceneChange]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (isAutoRotating) {
      if (!autorotateRef.current) {
        autorotateRef.current = Marzipano.autorotate({
          yawSpeed: 0.03,
          targetPitch: 0,
          targetFov: Math.PI / 2,
        });
      }

      viewer.stopMovement();
      viewer.startMovement(autorotateRef.current);
      viewer.setIdleMovement(Infinity);
      return;
    }

    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }, [isAutoRotating, currentSceneIndex]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(Boolean(fullscreenElement && wrapperRef.current && (fullscreenElement === wrapperRef.current || wrapperRef.current.contains(fullscreenElement))));

      if (viewerRef.current && typeof viewerRef.current.updateSize === 'function') {
        viewerRef.current.updateSize();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleFullscreenChange);
    };
  }, []);

  const switchScene = (nextIndex) => {
    const sceneEntries = scenesRef.current;
    const totalScenes = sceneEntries.length;
    if (!totalScenes) return;

    const normalizedIndex = ((nextIndex % totalScenes) + totalScenes) % totalScenes;
    const targetScene = sceneEntries[normalizedIndex];
    if (!targetScene) return;

    targetScene.switchTo();
    setCurrentSceneIndex(normalizedIndex);

    if (typeof onSceneChange === 'function') {
      onSceneChange(normalizedIndex, scenes[normalizedIndex]);
    }
  };

  const toggleFullscreen = async () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    try {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      if (fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          return;
        }

        if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }

        return;
      }

      if (wrapper.requestFullscreen) {
        await wrapper.requestFullscreen();
        return;
      }

      if (wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      }
    } catch {
      // Ignore fullscreen API errors triggered by browser restrictions.
    }
  };

  return (
    <div ref={wrapperRef} className="relative h-full w-full overflow-hidden rounded-lg bg-slate-900">
      <div ref={containerRef} className="h-full w-full" />

      {viewerError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-4 text-center text-sm text-slate-100">
          {viewerError}
        </div>
      ) : null}

      {!viewerError && scenes.length > 0 ? (
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAutoRotating((prev) => !prev)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-white backdrop-blur transition ${
              isAutoRotating
                ? 'border-emerald-300/70 bg-emerald-500/35 hover:bg-emerald-500/45'
                : 'border-white/20 bg-black/45 hover:bg-black/60'
            }`}
            aria-label={isAutoRotating ? 'Pause auto rotate' : 'Start auto rotate'}
            title={isAutoRotating ? 'Pause auto rotate' : 'Start auto rotate'}
          >
            {isAutoRotating ? <Pause size={15} /> : <RotateCcw size={15} />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur transition hover:bg-black/60"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      ) : null}

      {!viewerError && scenes.length > 1 ? (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => switchScene(currentSceneIndex - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/60"
          >
            <ChevronLeft size={14} /> Prev Scene
          </button>

          <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur">
            <RotateCcw size={13} />
            {scenes[currentSceneIndex]?.title || `Scene ${currentSceneIndex + 1}`}
          </div>

          <button
            type="button"
            onClick={() => switchScene(currentSceneIndex + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/60"
          >
            Next Scene <ChevronRight size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default MarzipanoViewer;
