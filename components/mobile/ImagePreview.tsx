'use client';

interface ImagePreviewProps {
  src: string | null;
  alt: string;
  onRemove?: () => void;
}

export default function ImagePreview({ src, alt, onRemove }: ImagePreviewProps) {
  if (!src) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-48 flex items-center justify-center">
        <p className="text-gray-400 dark:text-gray-600 text-sm">No image</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <img src={src} alt={alt} className="w-full rounded-lg object-cover aspect-video" />
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
        >
          ×
        </button>
      )}
    </div>
  );
}
