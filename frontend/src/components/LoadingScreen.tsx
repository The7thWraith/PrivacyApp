import React, { useEffect, useState } from "react";
import ShieldIcon from "../assets/shield.svg";

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800 bg-opacity-90">
      <div className="flex items-center justify-center w-full h-full mt-[-100px]">
        <img 
          src={ShieldIcon} 
          alt="Loading" 
          className="w-60 h-60" 
        />
      </div>
    </div>
  );
}

export default LoadingScreen;