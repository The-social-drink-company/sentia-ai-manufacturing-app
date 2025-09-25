import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  loading?: 'lazy' | 'eager';
  threshold?: number;
  quality?: number;
  blurDataUrl?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallback,
  loading = 'lazy',
  threshold = 0.1,
  quality = 75,
  blurDataUrl,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [loading, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  const optimizeSrc = (originalSrc: string): string => {
    // Basic optimization - in production, you might use a service like Cloudinary
    if (originalSrc.includes('?')) {
      return `${originalSrc}&q=${quality}`;
    }
    return `${originalSrc}?q=${quality}`;
  };

  const displaySrc = isError && fallback ? fallback : optimizeSrc(src);

  return (
    <div className={cn('relative overflow-hidden', className)} ref={imgRef}>
      {/* Blur placeholder */}
      {blurDataUrl && !isLoaded && (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
        />
      )}

      {/* Placeholder while loading */}
      {!isLoaded && !blurDataUrl && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" aria-hidden="true" className="opacity-50" />
          ) : (
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={displaySrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}

      {/* Loading indicator */}
      {isInView && !isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500" />
        </div>
      )}

      {/* Error state */}
      {isError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    thumbnail?: string;
    caption?: string;
  }>;
  columns?: number;
  gap?: number;
  aspectRatio?: 'square' | '4:3' | '16:9' | 'auto';
  onImageClick?: (index: number) => void;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 4,
  aspectRatio = 'square',
  onImageClick,
  className
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    '4:3': 'aspect-4/3',
    '16:9': 'aspect-video',
    auto: ''
  };

  return (
    <div
      className={cn(
        'grid gap-4',
        `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`,
        className
      )}
      style={{ gap: `${gap * 0.25}rem` }}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className={cn(
            'relative group cursor-pointer overflow-hidden rounded-lg',
            aspectRatioClasses[aspectRatio],
            'hover:shadow-lg transition-shadow duration-200'
          )}
          onClick={() => onImageClick?.(index)}
        >
          <LazyImage
            src={image.src}
            alt={image.alt}
            placeholder={image.thumbnail}
            className="w-full h-full hover:scale-105 transition-transform duration-300"
          />
          
          {image.caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p className="text-white text-sm font-medium">{image.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};