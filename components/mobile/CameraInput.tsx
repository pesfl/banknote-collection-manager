'use client';

import { useRef, useState, useEffect } from 'react';

interface CameraInputProps {
  onCapture: (blob: Blob, preview: string) => void;
  disabled?: boolean;
  label?: string;
}

export default function CameraInput({
  onCapture,
  disabled = false,
  label = 'Capture Photo',
}: CameraInputProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const [isLiveCamera, setIsLiveCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [supportsLiveCamera, setSupportsLiveCamera] = useState(false);

  useEffect(() => {
    // Check if live camera (getUserMedia) is supported in this browser context
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      setSupportsLiveCamera(true);
    }
  }, []);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create object URL for immediate high-performance preview
    const preview = URL.createObjectURL(file);
    onCapture(file, preview);

    // Reset input value so same file can be re-selected if retaken
    event.target.value = '';
  };

  const handleTakePhotoClick = () => {
    setCameraError(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    setCameraError(null);
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Live camera is not supported in this browser context. Please use Take Photo.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsLiveCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
        setIsCameraReady(true);
      }
    } catch (err: any) {
      console.warn('Live camera access error:', err);
      const msg =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Tap "Take Photo" to use your device camera.'
          : 'Live viewfinder unavailable. Tap "Take Photo" to use your device camera.';
      setCameraError(msg);
      setIsLiveCamera(false);
      setIsCameraReady(false);
    }
  };

  const stopLiveCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCamera(false);
    setIsCameraReady(false);
  };

  const captureLivePhoto = () => {
    if (!videoRef.current || !isCameraReady) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob => {
          if (blob) {
            const preview = URL.createObjectURL(blob);
            onCapture(blob, preview);
            stopLiveCamera();
          }
        },
        'image/jpeg',
        0.95
      );
    }
  };

  return (
    <div className="w-full">
      {/* Hidden file inputs with mobile capture attributes */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {cameraError && (
        <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-300">{cameraError}</p>
        </div>
      )}

      {!isLiveCamera ? (
        <div className="space-y-3">
          {/* Main Mobile Camera Button */}
          <button
            type="button"
            onClick={handleTakePhotoClick}
            disabled={disabled}
            className="w-full px-4 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-xl">📷</span>
            <span>Take Photo</span>
          </button>

          {/* Gallery Button */}
          <button
            type="button"
            onClick={handleGalleryClick}
            disabled={disabled}
            className="w-full px-4 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 text-gray-900 dark:text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-lg">📁</span>
            <span>Choose from Gallery</span>
          </button>

          {/* Live Viewfinder option for desktop or supported browsers */}
          {supportsLiveCamera && (
            <button
              type="button"
              onClick={startLiveCamera}
              disabled={disabled}
              className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline py-1 text-center cursor-pointer"
            >
              Or open live camera viewfinder
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Live Camera Viewfinder */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
                Starting camera...
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={stopLiveCamera}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={captureLivePhoto}
              disabled={!isCameraReady || disabled}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>📸</span>
              <span>{isCameraReady ? 'Capture Photo' : 'Preparing...'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

