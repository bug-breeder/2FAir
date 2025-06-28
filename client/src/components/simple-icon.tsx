import { useState } from 'react';
import { getAegisIconImgProps, AegisIconProps } from '../lib/simple-icons';

/**
 * Simple Icon component that renders icons from Aegis Icons CDN
 * Now using Aegis Icons collection which is specifically designed for 2FA/authenticator apps
 */
export function SimpleIcon(props: AegisIconProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const imgProps = getAegisIconImgProps(props);
  
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setIsLoading(false);
    }
  };
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  // If there's an error, show a fallback generic icon
  if (hasError) {
    return (
      <div 
        className={`${props.className || ''} flex items-center justify-center bg-default-100 rounded-full`}
        style={{ 
          width: props.size || 24, 
          height: props.size || 24,
          minWidth: props.size || 24,
          minHeight: props.size || 24,
        }}
      >
        <span className="text-default-500 text-xs font-bold">
          {props.provider.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }
  
  return (
    <img
      {...imgProps}
      loading="lazy"
      onError={handleError}
      onLoad={handleLoad}
      style={{
        display: isLoading ? 'none' : 'block',
        objectFit: 'contain',
      }}
    />
  );
}

/**
 * Simple Icon Avatar component - specifically for use with HeroUI Avatar component
 * This component provides the src URL for Avatar components using Aegis Icons
 */
export function useSimpleIconSrc(provider: string, options?: {
  fallbackIcon?: string;
}): string {
  const imgProps = getAegisIconImgProps({
    provider,
    ...options,
  });
  
  return imgProps.src;
} 