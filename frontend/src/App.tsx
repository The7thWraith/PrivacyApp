import React, { useEffect } from "react";
import { useState } from "react";
import "./App.css";
import WebSocket from "@tauri-apps/plugin-websocket";
import Webcam from "./components/Webcam";
import DropdownOption from "./components/DropdownOption";
import Slider from "./components/sliddddddeeeeerrrrrrrr";
import ShieldLoadingScreen from "./components/LoadingScreen";

// Webcam component props interface
interface WebcamProps {
  id: string;
}

interface SelectedValues {
  camera: string;
  blur: string;
  border: string;
  privacyLevel: string;
}

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string>("");
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  
  const [selectedValues, setSelectedValues] = useState<SelectedValues>({
    camera: "Loading...",
    blur: "Soft",
    border: "None",
    privacyLevel: "Silent"
  });

  // Function to show loading screen again for testing
  const showLoadingScreen = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 750); // Show for 2 seconds as requested
  };

  useEffect(() => {
    // Show loading screen for 2 seconds on initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 750); // 2 seconds as requested

    return () => clearTimeout(timer);
  }, []);

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleSelect = (id: string, option: string) => {
    setSelectedValues({ ...selectedValues, [id]: option });
    setOpenDropdown(null);
  };

  const handleSliderChange = (id: string, value: number) => {
    setSliderValue(value);
  };

  useEffect(() => {
    const requestCameraAccess = async () => {
      console.log("Starting camera access request");

      try {
        if (!navigator.mediaDevices) {
          console.error(
            "MediaDevices API is not supported in this environment"
          );
          setError("Camera access is not supported in this environment");
          return;
        }

        console.log("MediaDevices available:", navigator.mediaDevices);

        console.log("Attempting to access camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
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
          // Update the camera selection with the first available camera
          if (videoDevices.length > 0 && selectedValues.camera === "Loading...") {
            setSelectedValues(prev => ({
              ...prev,
              camera: videoDevices[0].label || "Default Camera"
            }));
          }
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        setError(`Failed to access camera: ${err.message}`);
      }
    };

    const sendSettings = async () => {
      try {
        console.log("Connecting to WebSocket...");
        const ws = await WebSocket.connect("wss://example.com"); // Make sure this URL is correct

        // Check if the WebSocket connection was successful
        if (ws) {
          setWsConnection(ws);

          // Send initial message
          await ws.send(JSON.stringify(selectedValues));

          // Set up message listener
          ws.addListener((message: any) => {
            console.log("Received message from server:", message);
          });

          console.log("WebSocket connection established successfully");
        } else {
          console.error(
            "WebSocket connection failed: Connection object is null"
          );
          setError(
            "Failed to connect to video server: Connection object is null"
          );
        }
      } catch (err: any) {
        console.error("Error connecting to WebSocket:", err);
        setError(`Failed to connect to video server: ${err.message || err}`);
      }
    };

    sendSettings();
    requestCameraAccess();

    return () => {
      if (wsConnection) {
        try {
          // Using any to bypass TypeScript error
          (wsConnection as any).close();
          console.log("WebSocket connection closed");
        } catch (err) {
          console.error("Error closing WebSocket connection:", err);
        }
      }
    };
  }, [selectedValues]);

  return (
    <div className="w-full h-screen bg-neutral-800 p-4 pt-0 flex flex-col">
      {isLoading && <ShieldLoadingScreen />}
      <div className="flex justify-end mb-2">
        <button 
          onClick={showLoadingScreen}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        >
          Test Loading Screen
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/5 relative">
          <div className="absolute top-0 bottom-0 left-0 right-[-20px] pt-5 flex flex-col overflow-y-scroll">
            <div className="w-full text-center p-4">
              <h1 className="text-white text-2xl font-medium">
                Privacy Filter
              </h1>
              <hr className="border-gray-600 mt-2 mb-4" />
            </div>

            <DropdownOption
              id="camera"
              label="Camera"
              value={selectedValues.camera}
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

            <DropdownOption
              id="border"
              label="Border"
              value={selectedValues.border}
              options={["None", "Soft", "Hard"]}
              isOpen={openDropdown === "border"}
              onToggle={toggleDropdown}
              onSelect={handleSelect}
            />

            <DropdownOption
              id="privacyLevel"
              label="Privacy Level"
              value={selectedValues.privacyLevel}
              options={["Silent"]}
              isOpen={openDropdown === "privacyLevel"}
              onToggle={toggleDropdown}
              onSelect={handleSelect}
            />

            <Slider
              id="slider1"
              label="Strictness"
              value={sliderValue}
              min={0}
              max={100}
              onSliderChange={handleSliderChange}
            />
          </div>
        </div>

        <div className="w-3/5 ml-6 flex items-center">
          <div className="bg-neutral-700 rounded-2xl h-[75%] w-full">
            {error ? (
              <div className="text-red-500 p-4">{error}</div>
            ) : (
              <Webcam id="main-webcam" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;