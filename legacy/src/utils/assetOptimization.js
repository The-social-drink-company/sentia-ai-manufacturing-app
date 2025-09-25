
// Asset Optimization Configuration
export const assetOptimizationConfig = {
  images: {
    formats: ['webp', 'avif', 'jpg'],
    sizes: [320, 640, 768, 1024, 1280, 1536],
    quality: 85,
    loading: 'lazy'
  },
  
  fonts: {
    preload: ['Assistant-400.woff2', 'Assistant-700.woff2'],
    display: 'swap'
  },
  
  icons: {
    sprite: true,
    optimize: true
  }
};

// Optimized image component
export const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  loading = 'lazy',
  sizes = '100vw'
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
    // Fallback to original image
    setCurrentSrc(src);
  };

  const generateSrcSet = (baseSrc) => {
    if (!baseSrc) return '';
    
    const ext = baseSrc.split('.').pop();
    const base = baseSrc.replace(`.${ext}`, '');
    
    return assetOptimizationConfig.images.sizes
      .map(size => `${base}-${size}w.webp ${size}w`)
      .join(', ');
  };

  return (
    <picture>
      <source 
        srcSet={generateSrcSet(src)} 
        type="image/webp"
        sizes={sizes}
      />
      <img
        src={currentSrc}
        alt={alt}
        className={className}
        loading={loading}
        onError={handleError}
        style={{ transition: 'opacity 0.3s ease' }}
      />
    </picture>
  );
};

// Asset preloading utility
export const preloadCriticalAssets = () => {
  // Preload critical fonts
  assetOptimizationConfig.fonts.preload.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = `/fonts/${font}`;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Preload critical images
  const criticalImages = ['/images/logo.webp', '/images/hero-bg.webp'];
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = 'image';
    document.head.appendChild(link);
  });
};

