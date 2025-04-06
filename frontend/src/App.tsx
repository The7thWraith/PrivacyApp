import React, { useEffect } from "react";
import { useState } from "react";
import "./App.css";
import WebSocket from '@tauri-apps/plugin-websocket';

const DropdownOption = ({
  id,
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect
}) => {
  return (
    <div className="flex items-center justify-between bg-neutral-700 rounded-lg p-3 mb-4 w-full relative">
      <span className="text-gray-300">{label}</span>
      <div
        className="flex items-center bg-neutral-700 gap-2 cursor-pointer max-w-[65%] overflow-hidden"
        onClick={() => onToggle(id)}
      >
        <span className="text-white font-medium truncate">{value}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#e3e3e3"
          className={`transform transition-transform duration-300 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
        </svg>
      </div>

      <div
        className={`absolute right-0 w-64 bg-neutral-800 border border-gray-700 rounded-md shadow-lg overflow-hidden z-10 top-full
           transition-all duration-300 origin-top ${
            isOpen
              ? "opacity-100 scale-y-100"
              : "opacity-0 scale-y-0 pointer-events-none"
          }`}
      >
        <div className="py-0 max-h-48 overflow-y-auto">
          {options.map((option, index) => {
            const isFirst = index === 0;
            const isLast = index === options.length - 1;

            return (
              <div
                key={option}
                className={`
                  px-4 py-2 text-sm cursor-pointer truncate
                  ${index !== 0 ? "border-t border-gray-700" : ""}
                  ${
                    value === option
                      ? `bg-blue-500 text-white ${
                          isFirst ? "rounded-t-md" : ""
                        } ${isLast ? "rounded-b-md" : ""}`
                      : "text-gray-200 hover:bg-neutral-700"
                  }
                `}
                onClick={() => onSelect(id, option)}
              >
                {option}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [alreadyOpen, setAlreadyOpen] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState("");
  const [wsConnection, setWsConnection] = useState<any>(null);

  const [selectedValues, setSelectedValues] = useState({
    camera: "WebCam 360",
    blur: "Soft",
    mode: "Silent"
  });

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleSelect = (id, option) => {
    setSelectedValues({ ...selectedValues, [id]: option });
    setOpenDropdown(null);
  };

  useEffect(() => {
    const requestCameraAccess = async () => {
      console.log("Starting camera access request");
      
      try {
        if (!navigator.mediaDevices) {
          console.error("MediaDevices API is not supported in this environment");
          setError("Camera access is not supported in this environment");
          return;
        }
        
        console.log("MediaDevices available:", navigator.mediaDevices);
        
        console.log("Attempting to access camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        console.log("Camera access successful!", stream);
        
        stream.getTracks().forEach((track) => track.stop());
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        ) as MediaDeviceInfo[];
        
        if (videoDevices.length === 0) {
          setError("No cameras detected on your device");
        } else {
          setCameras(videoDevices);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError(`Failed to access camera: ${err.message}`);
      }
    };

   
    requestCameraAccess();
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
        console.log("WebSocket connection closed");
      }
    };
  }, []);
  useEffect(() => {
	const sendSettings = async () => {
	  try {
	    console.log("Connecting to WebSocket...");
	    const ws = await WebSocket.connect('wss://example.com');
	    
	    setWsConnection(ws);
	    
	    await ws.send(selectedValues.toString());
	    // Set up message listener
	    ws.addListener((message) => {
		console.log("Received message from server:", message);
	    });
	    
	    console.log("WebSocket connection established successfully");
	  } catch (err) {
	    console.error("Error connecting to WebSocket:", err);
	    setError(`Failed to connect to video server: ${err.message}`);
	  }
	};
  
	sendSettings();
	return () => {
	  if (wsConnection) {
	    wsConnection.close();
	    console.log("WebSocket connection closed");
	  }
	};
    }, [selectedValues]);
  

  return (
    <div className="w-full h-screen bg-neutral-800 p-4 pt-0 flex flex-col">
      <div className="w-full text-center p-4 mb-2">
        <h1 className="text-white text-2xl font-medium">
          Privacy Filter
        </h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-3/5 mr-6">
          <div className="bg-neutral-700 rounded-2xl h-full">
            {error && (
              <div className="text-red-500 p-4">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="w-2/5 flex flex-col justify-center">
          <DropdownOption
            id="camera"
            label="Camera"
            value={cameras.length > 0 ? cameras[0].label || "Unnamed Camera" : "Loading..."}
            options={cameras.map((camera) => camera.label || "Unnamed Camera")}
            isOpen={openDropdown === "camera"}
            onToggle={toggleDropdown}
            onSelect={handleSelect}
          />
          <DropdownOption
            id="blur"
            label="Blur"
            value={selectedValues.blur}
            options={["Soft", "Hard"]}
            isOpen={openDropdown === "blur"}
            onToggle={toggleDropdown}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default App;