import { useState, useEffect } from "react";
import { Button, Snackbar } from "@mui/material";
import { Share2 } from "lucide-react";

/**
 * Enhanced ShareButton component that uses Web Share API for mobile devices
 * and fallback clipboard copying for desktop devices
 */
const ShareButton = ({ title, url, text, image, children, ...props }) => {
  const [isWebShareSupported, setIsWebShareSupported] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Check if Web Share API is supported (typically on mobile)
  useEffect(() => {
    setIsWebShareSupported(
      navigator.share !== undefined && 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
    
    // If there's an image provided, update Open Graph meta tags
    if (image) {
      updateMetaTags(title, text, image, url);
    }
    
    // Clean up meta tags when component unmounts
    return () => {
      resetMetaTags();
    };
  }, [title, text, image, url]);

  // Function to update meta tags dynamically
  const updateMetaTags = (title, description, image, url) => {
    // Update or create Open Graph meta tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', 'website');
  };
  
  // Helper to update a specific meta tag
  const updateMetaTag = (property, content) => {
    let metaTag = document.querySelector(`meta[property="${property}"]`);
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('property', property);
      document.head.appendChild(metaTag);
    }
    
    metaTag.setAttribute('content', content);
  };
  
  // Reset meta tags to default values
  const resetMetaTags = () => {
    // Default values or remove tags if needed
    const defaultTitle = "GigSaw - Find and book jam rooms";
    const defaultDesc = "Discover the best jam rooms near you for your music sessions";
    const defaultImage = "/gigsaw_ss.png"; // Your default app image
    
    updateMetaTag('og:title', defaultTitle);
    updateMetaTag('og:description', defaultDesc);
    updateMetaTag('og:image', defaultImage);
  };

  const handleShare = async () => {
    if (isWebShareSupported) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error sharing:", error);
        }
      }
    } else {
      // Fallback for desktop: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };
  
  return (
    <>
      <Button
        onClick={handleShare}
        startIcon={<Share2 className="w-4 h-4" />}
        {...props}
      >
        {copied ? "Link Copied!" : children || (isWebShareSupported ? "Share" : "Copy Link")}
      </Button>
    </>
  );
};

export default ShareButton;