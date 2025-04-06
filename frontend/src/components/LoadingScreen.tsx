import React, { useEffect, useState } from "react";
import ShieldIcon from "../assets/shield.svg";

function LoadingScreen() {
  const [opacity, setOpacity] = useState(0);
  const [lineWidth, setLineWidth] = useState(0);

  useEffect(() => {
    // Fade in animation
    setOpacity(0);
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 100);
    
    // Line expand animation
    setLineWidth(0);
    const lineTimer = setTimeout(() => {
      setLineWidth(80);
    }, 500);
    
    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(lineTimer);
    };
  }, []);
  
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-800 bg-opacity-90"
      style={{
        opacity: opacity,
        transition: "opacity 0.8s ease-in-out"
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
            transition: "opacity 0.8s ease-in-out, transform 0.8s ease-out"
          }}
        />
        <div 
          className="h-px bg-white"
          style={{
            width: `${lineWidth}%`,
            transition: "width 1.2s ease-in-out",
            transitionDelay: "0.4s"
          }}
        />
      </div>
    </div>
  );
}

export default LoadingScreen;