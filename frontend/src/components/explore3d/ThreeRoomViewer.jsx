import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function sanitizeTourPoints(points) {
  if (!Array.isArray(points)) return [];

  return points
    .map((point, index) => {
      if (!point || typeof point !== 'object') return null;

      const x = Number(point.x);
      const y = Number(point.y);
      const z = Number(point.z);
      const lookAtX = Number(point.lookAtX);
      const lookAtY = Number(point.lookAtY);
      const lookAtZ = Number(point.lookAtZ);

      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        return null;
      }

      return {
        label: String(point.label || `Viewpoint ${index + 1}`).trim(),
        x,
        y,
        z,
        lookAtX: Number.isFinite(lookAtX) ? lookAtX : 0,
        lookAtY: Number.isFinite(lookAtY) ? lookAtY : 0.82,
        lookAtZ: Number.isFinite(lookAtZ) ? lookAtZ : 0,
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

const ThreeRoomViewer = forwardRef(({ modelUrl, autoRotate = false, tourMode = false, tourPoints = [] }, ref) => {
  const mountRef = useRef(null);
  const [status, setStatus] = useState({ loading: true, error: '' });
  const sanitizedTourPoints = useMemo(() => sanitizeTourPoints(tourPoints), [tourPoints]);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const frameRef = useRef(null);
  const modelRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const disposedRef = useRef(false);
  const tourPointsRef = useRef([]);
  const activeTourPointRef = useRef(0);
  const transitionRef = useRef(null);
  const tourModeRef = useRef(tourMode);

  useEffect(() => {
    tourModeRef.current = tourMode;
  }, [tourMode]);

  const applyDefaultCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;

    cameraRef.current.position.set(2.5, 1.8, 3.3);
    controlsRef.current.target.set(0, 0.8, 0);
    controlsRef.current.update();
  };

  const zoomByFactor = (factor) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    const currentDistance = offset.length();
    if (!currentDistance) return;

    const minDistance = Number.isFinite(controls.minDistance) ? controls.minDistance : 1;
    const maxDistance = Number.isFinite(controls.maxDistance) ? controls.maxDistance : 12;
    const nextDistance = THREE.MathUtils.clamp(currentDistance * factor, minDistance, maxDistance);

    offset.setLength(nextDistance);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  };

  const transitionToTourPoint = (nextIndex) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const points = tourPointsRef.current;
    if (!points.length) return;

    const total = points.length;
    const normalizedIndex = ((nextIndex % total) + total) % total;
    const point = points[normalizedIndex];

    transitionRef.current = {
      startedAt: performance.now(),
      durationMs: 550,
      fromPosition: cameraRef.current.position.clone(),
      fromTarget: controlsRef.current.target.clone(),
      toPosition: point.position.clone(),
      toTarget: point.target.clone(),
      index: normalizedIndex,
    };
  };

  const shiftTourPoint = (delta) => {
    const points = tourPointsRef.current;
    if (!points.length) return;

    const currentIndex = transitionRef.current?.index ?? activeTourPointRef.current;
    transitionToTourPoint(currentIndex + delta);
  };

  useImperativeHandle(ref, () => ({
    resetView: () => {
      applyDefaultCamera();
    },
    zoomIn: () => {
      zoomByFactor(0.85);
    },
    zoomOut: () => {
      zoomByFactor(1.15);
    },
    nextTourPoint: () => {
      shiftTourPoint(1);
    },
    previousTourPoint: () => {
      shiftTourPoint(-1);
    },
    toggleFullscreen: async () => {
      const container = mountRef.current;
      if (!container) return;

      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (container.requestFullscreen) {
        await container.requestFullscreen();
      }
    },
  }));

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.autoRotate = autoRotate && !tourMode;
  }, [autoRotate, tourMode]);

  useEffect(() => {
    if (!tourMode) return undefined;

    const handleArrowNavigation = (event) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;

      const activeElement = event.target;
      const tagName = String(activeElement?.tagName || '').toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || activeElement?.isContentEditable) return;

      event.preventDefault();
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
        shiftTourPoint(1);
      } else {
        shiftTourPoint(-1);
      }
    };

    window.addEventListener('keydown', handleArrowNavigation);
    return () => window.removeEventListener('keydown', handleArrowNavigation);
  }, [tourMode]);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return undefined;

    const resolvedModelUrl = String(modelUrl || '').trim();
    if (!resolvedModelUrl) {
      setStatus({ loading: false, error: '3D tour not available for this listing.' });
      return undefined;
    }

    disposedRef.current = false;
    setStatus({ loading: true, error: '' });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a');
    scene.fog = new THREE.Fog('#0f172a', 8, 16);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(2.5, 1.8, 3.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mountEl.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.65;

    const ambient = new THREE.AmbientLight('#ffffff', 0.7);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight('#bcd8ff', '#0b1222', 0.85);
    hemi.position.set(0, 5, 0);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#8fb2ff', 0.55);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7, 96),
      new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9, metalness: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    scene.add(floor);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    const setSize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      if (!width || !height) return;

      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    setSize();
    resizeObserverRef.current = new ResizeObserver(setSize);
    resizeObserverRef.current.observe(mountEl);

    const loader = new GLTFLoader();
    loader.load(
      resolvedModelUrl,
      (gltf) => {
        if (disposedRef.current) return;

        const loadedModel = gltf.scene;
        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = true;
            if (child.material?.map) {
              child.material.map.colorSpace = THREE.SRGBColorSpace;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        const fitScale = 2.2 / maxDimension;

        loadedModel.scale.setScalar(fitScale);
        loadedModel.position.sub(center.multiplyScalar(fitScale));
        loadedModel.position.y += 0.12;

        scene.add(loadedModel);
        modelRef.current = loadedModel;

        if (sanitizedTourPoints.length) {
          tourPointsRef.current = sanitizedTourPoints.map((point) => ({
            position: new THREE.Vector3(point.x, point.y, point.z),
            target: new THREE.Vector3(point.lookAtX, point.lookAtY, point.lookAtZ),
            label: point.label,
          }));
        } else {
          const tourRadius = THREE.MathUtils.clamp(Math.max(size.x, size.z) * fitScale * 1.8, 2.1, 4.4);
          const tourHeight = THREE.MathUtils.clamp(size.y * fitScale * 0.55 + 0.9, 1.25, 2.1);
          const tourTarget = new THREE.Vector3(0, 0.82, 0);
          const angles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
          tourPointsRef.current = angles.map((angle) => ({
            position: new THREE.Vector3(
              Math.cos(angle) * tourRadius,
              tourHeight,
              Math.sin(angle) * tourRadius
            ),
            target: tourTarget.clone(),
          }));
        }
        activeTourPointRef.current = 0;

        applyDefaultCamera();
        if (tourModeRef.current) {
          transitionToTourPoint(0);
        }
        setStatus({ loading: false, error: '' });
      },
      undefined,
      () => {
        if (disposedRef.current) return;
        setStatus({ loading: false, error: '3D model is unavailable right now. Coming Soon !!!' });
      }
    );

    const renderLoop = () => {
      frameRef.current = requestAnimationFrame(renderLoop);

      if (transitionRef.current && cameraRef.current && controlsRef.current) {
        const transition = transitionRef.current;
        const elapsed = performance.now() - transition.startedAt;
        const progress = Math.min(1, elapsed / transition.durationMs);
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - (Math.pow(-2 * progress + 2, 2) / 2);

        cameraRef.current.position.lerpVectors(transition.fromPosition, transition.toPosition, eased);
        controlsRef.current.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);

        if (progress >= 1) {
          activeTourPointRef.current = transition.index;
          transitionRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      disposedRef.current = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      if (modelRef.current) {
        modelRef.current.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material?.dispose?.();
            }
          }
        });
        scene.remove(modelRef.current);
        modelRef.current = null;
      }

      controls.dispose();
      renderer.dispose();

      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      tourPointsRef.current = [];
      activeTourPointRef.current = 0;
      transitionRef.current = null;
    };
  }, [modelUrl, sanitizedTourPoints]);

  useEffect(() => {
    if (!tourMode || !tourPointsRef.current.length) return undefined;

    transitionToTourPoint(activeTourPointRef.current);
    return undefined;
  }, [tourMode]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#111827]">
      <div ref={mountRef} className="absolute inset-0" />

      {status.loading && !status.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center bg-[#0f172a]/65">
          <div className="w-8 h-8 border-4 border-[#3A5AFF] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold tracking-wide">Loading 3D Model</p>
          <p className="mt-1 text-[11px] text-white/80">Rendering your GLB scene</p>
        </div>
      )}

      {status.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/75 px-4">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white/95 p-5 text-center shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-200">
              <AlertCircle size={20} />
            </div>
            <p className="text-sm font-bold text-red-700">3D Tour Not Available</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{status.error}</p>
          </div>
        </div>
      )}
    </div>
  );
});

ThreeRoomViewer.displayName = 'ThreeRoomViewer';

export default ThreeRoomViewer;
