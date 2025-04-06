import "../App.css";

import React, { startTransition, useEffect, useState } from "react";
import WebSocket from "@tauri-apps/plugin-websocket";
import Webcam from "../components/Webcam";
import Slider from "../components/sliddddddeeeeerrrrrrrr";
import FilterButton from "../components/FilterButton";
import DropdownOption from "../components/DropdownOption";
import LoadingScreen from "../components/LoadingScreen";

import { invoke } from "@tauri-apps/api/core";

interface ActiveFilters {
	cardsIds: boolean;
	streetSigns: boolean;
	licensePlates: boolean;
	faces: boolean;
}

interface SelectedValues {
	camera: string;
	blurBody: string;
	border: string;
	privacyLevel: string;
	exclusion: string;
	fullbody: string;
}

function Home() {
	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
	const [error, setError] = useState<string>("");
	const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
	const [filtersVisible, setFiltersVisible] = useState<boolean>(false);
	const [sliderValue, setSliderValue] = useState<number>(50);
	const [showLoading, setShowLoading] = useState<boolean>(true); // Start with loading screen shown
	const [showTitleScreen, setShowTitleScreen] = useState<boolean>(false); // Remove title screen

	const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
		cardsIds: false,
		licensePlates: false,
		streetSigns: false,
		faces: false
	});

	const [firstLoad, setFirstLoad] = useState(true);

	const [selectedValues, setSelectedValues] = useState<SelectedValues>({
		camera: "Loading...",
		blurBody: "Soft",
		border: "None",
		privacyLevel: "Silent",
		exclusion: "Subject",
		fullbody: "Face"
	});

	const toggleDropdown = (id: string) => {
		setOpenDropdown(openDropdown === id ? null : id);
	};

	const handleSelect = (id: string, option: string) => {
		setOpenDropdown(null);
		startTransition(() => {
			setSelectedValues((prev) => ({ ...prev, [id]: option }));
		});
	};

	const handleSliderChange = (value: number) => {
		setSliderValue(value);
	};

	const toggleFilter = (filter: keyof ActiveFilters) => {
		const newActiveFilters = {
			...activeFilters,
			[filter]: !activeFilters[filter]
		};
		setActiveFilters(newActiveFilters);
		if (wsConnection) {
			const settingsWithFilters = {
				...selectedValues,
				filters: newActiveFilters,
				confidence: sliderValue / 100,
				ignore_subject: selectedValues.exclusion === "Subject",
				blurBody: selectedValues.fullbody === "Full Body",
			};
			try {
				wsConnection.send(JSON.stringify(settingsWithFilters));
			} catch (err) {
				console.error("Error sending updated filters:", err);
			}
		}
	};

	const showLoadingScreen = () => {
		setShowLoading(true);
	};

	const hideLoadingScreen = () => {
		setShowLoading(false);
	};

	useEffect(() => {
		const requestCameraAccess = async () => {
			try {
				if (!navigator.mediaDevices) {
					setError(
						"Camera access is not supported in this environment"
					);
					return;
				}
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true
				});
				stream.getTracks().forEach((track) => track.stop());
				const devices = await navigator.mediaDevices.enumerateDevices();
				const videoDevices = devices.filter(
					(device) => device.kind === "videoinput"
				);
				if (videoDevices.length === 0) {
					setError("No cameras detected on your device");
				} else {
					setCameras(videoDevices);
					if (firstLoad) {
						setSelectedValues({
							...selectedValues,
							camera: videoDevices[0].label
						});
						setFirstLoad(false);
					}
				}
			} catch (err: any) {
				setError(`Failed to access camera: ${err.message}`);
			}
		};

		requestCameraAccess();

		return () => {
			if (wsConnection) {
				wsConnection.disconnect();
			}
		};
	}, [selectedValues, activeFilters, firstLoad]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			invoke("send_zmq_message", {
				message: JSON.stringify({
					...selectedValues,
					filters: activeFilters,
					confidence: sliderValue / 100,
				})
			}).catch(console.error);
		}, 500);

		return () => clearTimeout(timeout);
	}, [selectedValues, activeFilters]);

	const filterTransitionClass = filtersVisible
		? "duration-350"
		: "duration-200";

	return (
		<div className="w-full h-screen bg-neutral-800 p-4 pt-0 flex flex-col">
			{/* Loading Screen */}
			{showLoading && <LoadingScreen onFinished={hideLoadingScreen} />}
			
			{/* Main App Content */}
			{!showLoading && (
				<div className="flex flex-1 overflow-hidden">
					<div className="w-2/5 relative">
						<div className="absolute top-0 bottom-0 left-0 right-[-20px] pt-5 flex flex-col overflow-y-auto pb-4">
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
								options={cameras.map((camera) => {
									const label = camera.label || "Unnamed Camera";
									const shortLabel =
										label.length > 20
											? label.slice(0, 18) + "..."
											: label;
									return shortLabel;
								})}
								isOpen={openDropdown === "camera"}
								onToggle={toggleDropdown}
								onSelect={handleSelect}
							/>

						<DropdownOption
							id="blur"
							label="Blur"
							value={selectedValues.blurBody}
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


							<Slider
								id="slider1"
								label="Confidence"
								value={sliderValue}
								min={50}
								max={95}
								onSliderChange={handleSliderChange}
							/>
							<div className="mb-2 bg-neutral-700 rounded-lg">
								<div
									className="flex items-center justify-between bg-neutral-700 rounded-lg p-4 cursor-pointer"
									onClick={() =>
										setFiltersVisible(!filtersVisible)
									}
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
										filtersVisible
											? "opacity-100 max-h-96"
											: "opacity-0 max-h-0 pointer-events-none"
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
											onClick={() =>
												toggleFilter("streetSigns")
											}
										/>
										<FilterButton
											label="License Plates"
											active={activeFilters.licensePlates}
											onClick={() =>
												toggleFilter("licensePlates")
											}
										/>
										<FilterButton
											label="Faces"
											active={activeFilters.faces}
											onClick={() => toggleFilter("faces")}
										/>
									</div>
								</div>
							</div>
							
							{activeFilters.faces && (
								<div className="bg-neutral-700 rounded-lg p-2 mb-2">
									<h3 className="text-gray-300 px-2 py-1 mb-2 text-sm font-medium">Face Blur Options</h3>
									<DropdownOption
										id="exclusion"
										label="Exclusion"
										value={selectedValues.exclusion}
										options={["Subject", "None"]}
										isOpen={openDropdown === "exclusion"}
										onToggle={toggleDropdown}
										onSelect={handleSelect}
									/>
									
									<DropdownOption
										id="fullbody"
										label="Blur Choice"
										value={selectedValues.fullbody}
										options={["Face", "Full Body"]}
										isOpen={openDropdown === "fullbody"}
										onToggle={toggleDropdown}
										onSelect={handleSelect}
									/>
								</div>
							)}
						<Slider
							id="slider1"
							label="Confidence"
							value={sliderValue}
							min={5}
							max={90}
							onSliderChange={handleSliderChange}
						/>
						<div className="mb-2 bg-neutral-700 rounded-lg">
							<div
								className="flex items-center justify-between bg-neutral-700 rounded-lg p-4 cursor-pointer"
								onClick={() =>
									setFiltersVisible(!filtersVisible)
								}
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
									filtersVisible
										? "opacity-100 max-h-96"
										: "opacity-0 max-h-0 pointer-events-none"
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
										onClick={() =>
											toggleFilter("streetSigns")
										}
									/>
									<FilterButton
										label="License Plates"
										active={activeFilters.licensePlates}
										onClick={() =>
											toggleFilter("licensePlates")
										}
									/>
									<FilterButton
										label="Faces"
										active={activeFilters.faces}
										onClick={() => toggleFilter("faces")}
									/>
								</div>
							</div>
						</div>
						
						{activeFilters.faces && (
							<div className="bg-neutral-700 rounded-lg p-2 mb-2">
								<h3 className="text-gray-300 px-2 py-1 mb-2 text-sm font-medium">Face Blur Options</h3>
								<DropdownOption
									id="exclusion"
									label="Exclusion"
									value={selectedValues.exclusion}
									options={["Subject", "None"]}
									isOpen={openDropdown === "exclusion"}
									onToggle={toggleDropdown}
									onSelect={handleSelect}
								/>
								
								<DropdownOption
									id="fullbody"
									label="Blur Choice"
									value={selectedValues.fullbody}
									options={["Face", "Full Body"]}
									isOpen={openDropdown === "fullbody"}
									onToggle={toggleDropdown}
									onSelect={handleSelect}
								/>
							</div>
						)}

							{/* <button
								onClick={showLoadingScreen}
								className="mt-4 mb-6 mx-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
							>
								Show Loading Screen
							</button> */}
						</div>
					</div>

					<div className="w-3/5 ml-12 flex items-center">
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
			)}
		</div>
	);
}

export default Home;