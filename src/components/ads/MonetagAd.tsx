import { useEffect, useRef } from "react";

interface MonetagAdProps {
  zoneId?: string;
  src: string;
  async?: boolean;
  cfasync?: string;
}

export function MonetagAd({ 
  zoneId, 
  src,
  async = false,
  cfasync
}: MonetagAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if the script with this zone ID or source is already loaded to prevent duplicates
    const selector = zoneId ? `script[data-zone="${zoneId}"]` : `script[src="${src}"]`;
    const existingScript = containerRef.current.querySelector(selector);
    if (existingScript) return;

    // Create the script element
    const script = document.createElement("script");
    if (zoneId) {
      script.dataset.zone = zoneId;
    }
    script.src = src;
    if (async) {
      script.async = true;
    }
    if (cfasync) {
      script.setAttribute("data-cfasync", cfasync);
    }
    
    containerRef.current.appendChild(script);

    return () => {
      // Cleanup the script tag when component unmounts
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [zoneId, src, async, cfasync]);

  return (
    <div 
      ref={containerRef} 
      className="hidden" 
      aria-hidden="true" 
    />
  );
}
