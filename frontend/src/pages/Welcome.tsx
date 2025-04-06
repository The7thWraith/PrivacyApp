import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "../components/Webcam";
import Button from "../components/Button";

const Welcome = () => {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<"welcome" | "camera" | "capture" | "confirm">("welcome");

  // Get available cameras
  useEffect(() => {
    const requestCameraAccess = async () => {
	navigate("/home");

      try {
        if (!navigator.mediaDevices) {
          setError("Camera access is not supported in this environment");
          return;
        }
        
        // Request permission first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        stream.getTracks().forEach((track) => track.stop());
        
        // Enumerate available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        
        if (videoDevices.length === 0) {
          setError("No cameras detected on your device");
        } else {
          setCameras(videoDevices);
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        setError(`Failed to access camera: ${err.message}`);
      }
    };

    requestCameraAccess();
  }, []);

  // Function to capture image from webcam
  const captureImage = () => {
    const video = document.querySelector('video');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageDataUrl);
    setStep("confirm");
  };

  // Function to change selected camera
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(e.target.value);
  };

  // Proceed to home with captured image
  const proceedToHome = () => {
    // You can store the image in localStorage, context, or pass it as state
    // For this example, we'll use localStorage
    if (capturedImage) {
      localStorage.setItem('userImage', capturedImage);
    }
    navigate("/home");
  };

  // Reset capture and go back to camera
  const retakeImage = () => {
    setCapturedImage(null);
    setStep("camera");
  };

  // UI based on current step
  const renderStepContent = () => {
    switch (step) {
      case "welcome":
        return (
          <div className="text-center">
            <h1 className="text-white text-3xl font-medium mb-6">Welcome to Privacy Filter</h1>
            <p className="text-gray-300 mb-8">
              To get started, we'll need to take an initial photo of you
              to set up your privacy preferences.
            </p>
            <Button onClick={() => setStep("camera")}>
              Set Up Camera
            </Button>
          </div>
        );
        
      case "camera":
        return (
          <div className="flex flex-col items-center">
            <h2 className="text-white text-2xl font-medium mb-4">Take Your Initial Photo</h2>
            
            {cameras.length > 1 && (
              <div className="mb-4 w-full max-w-md">
                <label className="block text-gray-300 mb-2">Select Camera</label>
                <select 
                  value={selectedCamera} 
                  onChange={handleCameraChange}
                  className="w-full bg-neutral-700 text-white p-2 rounded-lg"
                >
                  {cameras.map((camera: MediaDeviceInfo) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="w-full max-w-xl h-96 bg-neutral-700 rounded-2xl mb-6">
              {error ? (
                <div className="text-red-500 p-4 h-full flex items-center justify-center">{error}</div>
              ) : (
                <Webcam 
                  id={selectedCamera} 
                  width={640} 
                  height={480}
                />
              )}
            </div>
            
            <div className="flex space-x-4">
              <Button onClick={() => setStep("welcome")}>
                Back
              </Button>
              <Button onClick={captureImage}>
                Capture Image
              </Button>
            </div>
          </div>
        );
        
      case "confirm":
        return (
          <div className="flex flex-col items-center">
            <h2 className="text-white text-2xl font-medium mb-4">Confirm Your Image</h2>
            
            <div className="w-full max-w-xl bg-neutral-700 rounded-2xl mb-6 overflow-hidden">
              {capturedImage && (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-auto"
                />
              )}
            </div>
            
            <div className="flex space-x-4">
              <Button onClick={retakeImage}>
                Retake Image
              </Button>
              <Button onClick={proceedToHome}>
                Continue to App
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-800 p-8 flex flex-col items-center justify-center">
      {renderStepContent()}
    </div>
  );
};

export default Welcome;