import React, { useEffect, useState } from "react";
import "./App.css";
import WebSocket from "@tauri-apps/plugin-websocket";
import Webcam from "./components/Webcam";
import DropdownOption from "./components/DropdownItem";
import Slider from "./components/sliddddddeeeeerrrrrrrr";

interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, active, onClick }) => {
  return (
    <button
      className={`rounded-lg text-gray-300 font-medium transition-all ${
        active 
          ? "py-3 px-5 bg-blue-500" 
          : "py-2 px-4 bg-neutral-600 hover:bg-neutral-500"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

interface DropdownOptionProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string, option: string) => void;
}

const DropdownOption: React.FC<DropdownOptionProps> = ({
  id,
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect
}) => {
  const transitionClass = isOpen ? "duration-350" : "duration-200";
  return (
    <div className="mb-4">
      <div 
        className="flex items-center justify-between bg-neutral-700 rounded-lg p-4 cursor-pointer"
        onClick={() => onToggle(id)}
      >
        <span className="text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium truncate">{value}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e3e3e3"
            className={`transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          >
            <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
          </svg>
        </div>
      </div>

      <div 
        className={`mt-1 bg-black w-full rounded-lg shadow-lg overflow-hidden transition-all ease-in-out ${transitionClass} ${
          isOpen ? "opacity-100 max-h-96" : "opacity-0 max-h-0 pointer-events-none"
        }`}
      >
        {options.map((option, index) => (
          <div
            key={option}
            className={`px-4 py-3 cursor-pointer transition-colors duration-200 ${
              index !== 0 ? "border-t border-gray-800" : ""
            } ${value === option ? "bg-blue-500 text-white" : "text-gray-200 hover:bg-neutral-900"}`}
            onClick={() => onSelect(id, option)}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ActiveFilters {
  cardsIds: boolean;
  streetSigns: boolean;
  licensePlates: boolean;
}

interface SelectedValues {
  camera: string;
  blur: string;
  border: string;
  privacyLevel: string;
}

function App() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string>("");
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [filtersVisible, setFiltersVisible] = useState<boolean>(false);
  const [sliderValue, setSliderValue] = useState<number>(50);

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    cardsIds: false,
    streetSigns: false,
    licensePlates: false
  });

  const [firstLoad, setFirstLoad] = useState(true);

  const [selectedValues, setSelectedValues] = useState<SelectedValues>({
    camera: "Loading...",
    blur: "Soft",
    border: "None",
    privacyLevel: "Silent"
  });

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleSelect = (id: string, option: string) => {
    setSelectedValues({ ...selectedValues, [id]: option });
    setOpenDropdown(null);
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
  };

  const toggleFilter = (filter: keyof ActiveFilters) => {
    const newActiveFilters = { ...activeFilters, [filter]: !activeFilters[filter] };
    setActiveFilters(newActiveFilters);
    if (wsConnection) {
      const settingsWithFilters = {
        ...selectedValues,
        filters: newActiveFilters
      };
      try {
        wsConnection.send(JSON.stringify(settingsWithFilters));
      } catch (err) {
        console.error("Error sending updated filters:", err);
      }
    }
  };

  useEffect(() => {
    const requestCameraAccess = async () => {
      try {
        if (!navigator.mediaDevices) {
          setError("Camera access is not supported in this environment");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        if (videoDevices.length === 0) {
          setError("No cameras detected on your device");
        } else {
          setCameras(videoDevices);
          if (firstLoad) {
            setSelectedValues({ ...selectedValues, camera: videoDevices[0].label });
            setFirstLoad(false);
          }
        }
      } catch (err: any) {
        setError(`Failed to access camera: ${err.message}`);
      }
    };

    const sendSettings = async () => {
      try {
        const ws = await WebSocket.connect("wss://example.com");
        setWsConnection(ws);
        const settingsWithFilters = {
          ...selectedValues,
          filters: activeFilters
        };
        await ws.send(JSON.stringify(settingsWithFilters));
        ws.addListener((message) => {
          console.log("Received message from server:", message);
        });
      } catch (err: any) {
        setError(`Failed to connect to video server: ${err.message}`);
      }
    };

		// sendSettings();
		requestCameraAccess();

    return () => {
      if (wsConnection) {
        wsConnection.disconnect();
      }
    };
  }, [selectedValues, activeFilters, firstLoad]);

  const filterTransitionClass = filtersVisible ? "duration-350" : "duration-200";

  return (
    <div className="w-full h-screen bg-neutral-800 p-4 pt-0 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/5 relative">
          <div className="absolute top-0 bottom-0 left-0 right-[-20px] pt-5 flex flex-col overflow-y-scroll">
            <div className="w-full text-center p-4">
              <h1 className="text-white text-2xl font-medium">Privacy Filter</h1>
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
              label="Confidence"
              value={sliderValue}
              min={0}
              max={100}
              onSliderChange={handleSliderChange}
            />
            <div className="mb-2 bg-neutral-700 rounded-lg">
              <div 
                className="flex items-center justify-between bg-neutral-700 rounded-lg p-4 cursor-pointer"
                onClick={() => setFiltersVisible(!filtersVisible)}
              >
                <span className="text-gray-300">Filters</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                  className={`transform transition-transform duration-300 ${
                    filtersVisible ? "rotate-180" : ""
                  }`}
                >
                  <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
                </svg>
              </div>
              <div
                className={`mt-1 bg-neutral-700 rounded-lg w-full overflow-hidden transition-all ease-in-out ${filterTransitionClass} ${
                  filtersVisible ? "opacity-100 max-h-96" : "opacity-0 max-h-0 pointer-events-none"
                }`}
              >
                <div className="p-4 flex flex-wrap gap-2">
                  <FilterButton
                    label="Cards/IDs"
                    active={activeFilters.cardsIds}
                    onClick={() => toggleFilter("cardsIds")}
                  />
                  <FilterButton
                    label="Street Signs"
                    active={activeFilters.streetSigns}
                    onClick={() => toggleFilter("streetSigns")}
                  />
                  <FilterButton
                    label="License Plates"
                    active={activeFilters.licensePlates}
                    onClick={() => toggleFilter("licensePlates")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

				<div className="w-3/5 ml-6 flex items-center">
					<div className="bg-neutral-700 rounded-2xl h-[75%] w-full">
						{error ? (
							<div className="text-red-500 p-4">{error}</div>
						) : (
							<Webcam
								id={
									cameras.find(
										(cam) =>
											cam.label === selectedValues.camera
									)?.deviceId
								}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
