import React, { useEffect, useState } from "react";
import ShieldIcon from "../assets/shield.svg";

function LoadingScreen({ onFinished }) {
  const [opacity, setOpacity] = useState(0);
  const [lineWidth, setLineWidth] = useState(0);
  
  useEffect(() => {
    // Start with blank screen
    setOpacity(0);
    setLineWidth(0);
    
    // Shield and bar start at the same time
    const animationStartTimer = setTimeout(() => {
      setOpacity(1);
      setLineWidth(0);
    }, 300);
    
    // Bar animation starts expanding
    const barStartTimer = setTimeout(() => {
      setLineWidth(67); // Reduced from 140% to 80%
    }, 500);
    
    // Both elements fade out together after the bar finishes expanding
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
      setLineWidth(0);
    }, 5800); // 300ms delay + 5000ms bar animation + 500ms buffer
    
    // Finish and call callback after fade out completes
    const finishTimer = setTimeout(() => {
      if (onFinished) onFinished();
    }, 6300); // 5800ms + 500ms for fade out
    
    return () => {
      clearTimeout(animationStartTimer);
      clearTimeout(barStartTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinished]);
  
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-800 bg-opacity-90"
      style={{
        opacity: 1,
        transition: "opacity 0.5s ease-in-out"
      }}
    >
      <div className="flex flex-col items-center justify-center w-full mt-[-100px]">
        <img
          src={ShieldIcon}
          alt="Loading"
          className="w-40 h-40 mb-8"
          style={{
            opacity: opacity,
            transform: `scale(${opacity})`,
            transition: "opacity 0.5s ease-in-out, transform 0.5s ease-out" // Normal speed for shield
          }}
        />
        <div 
          className="h-px bg-white"
          style={{
            width: `${lineWidth}%`,
            opacity: opacity, // Make sure the bar fades out with the shield
            transition: "width 5s ease-out, opacity 0.5s ease-in-out" // Changed from ease-in-out to ease-out for a more gradual start
          }}
        />
      </div>
    </div>
  );
}

export default LoadingScreen;