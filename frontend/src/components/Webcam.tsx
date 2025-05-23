import React, { useRef, useState, useEffect } from "react";
import Button from "./Button";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface WebcamProps {
	width?: number;
	height?: number;
	facingMode?: string;
	id: string | undefined;
}

const Webcam: React.FC<WebcamProps> = ({
	width = 640,
	height = 480,
	facingMode = "user",
	id
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isStreaming, setIsStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [step, setStep] = useState<
		"initial" | "streaming" | "captured" | "confirmed" | "normal"
	>("initial");

	// Store active stream reference at module level to ensure it's always accessible
	const streamRef = useRef<MediaStream | null>(null);

	const [imgSrc, setImgSrc] = useState<string | null>(null);

	// Guaranteed stream cleanup function
	const stopAllTracks = () => {
		// First, stop any tracks in our stored stream reference
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => {
				console.log(
					"Stopping track:",
					track.kind,
					track.id,
					track.readyState
				);
				track.stop();
			});
			streamRef.current = null;
		}

		// Also check video element's srcObject as a backup
		if (videoRef.current && videoRef.current.srcObject) {
			const stream = videoRef.current.srcObject as MediaStream;
			stream.getTracks().forEach((track) => {
				console.log(
					"Stopping track from video:",
					track.kind,
					track.id,
					track.readyState
				);
				track.stop();
			});
			videoRef.current.srcObject = null;
		}
	};

	const stopWebcam = () => {
		// Log state before stopping
		console.log("Stopping webcam. Current state:", { step, isStreaming });

		// Stop all media tracks
		stopAllTracks();

		// Update state
		setIsStreaming(false);
	};

	const startWebcam = async () => {
		console.log("Starting webcam");

		// Always stop any existing streams first
		stopAllTracks();

		// Ensure we're in streaming state
		setStep("streaming");
		setError(null);

		try {
			console.log("Requesting camera access...");
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width,
					height,
					facingMode,
					deviceId: id ? { exact: id } : undefined
				},
				audio: false
			});

			console.log(
				"Camera access granted. Track states:",
				stream.getTracks().map((t) => `${t.kind}: ${t.readyState}`)
			);

			// Store stream reference
			streamRef.current = stream;

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.onloadedmetadata = () => {
					if (videoRef.current) {
						videoRef.current
							.play()
							.then(() => {
								console.log("Video is playing");
								setIsStreaming(true);
							})
							.catch((err) => {
								console.error("Error playing video:", err);
								setError(`Error playing video: ${err.message}`);
								setStep("initial");
								stopAllTracks();
							});
					}
				};
			}
		} catch (err) {
			console.error("Failed to access webcam:", err);
			setError(
				`Failed to access webcam: ${
					err instanceof Error ? err.message : String(err)
				}`
			);
			setIsStreaming(false);
			setStep("initial");
			stopAllTracks();
		}
	};

	// const captureImage = async () => {
	// 	if (!videoRef.current) return;

	// 	const canvas = document.createElement("canvas");
	// 	canvas.width = videoRef.current.videoWidth;
	// 	canvas.height = videoRef.current.videoHeight;

	// 	const ctx = canvas.getContext("2d");
	// 	if (!ctx) return;

	// 	ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

	// 	const imageDataUrl = canvas.toDataURL("image/jpeg");

	// 	const response = await invoke("send_zmq_message", {
	// 		message: imageDataUrl
	// 	});

	// 	console.log("Response from server:", response);

	// 	setCapturedImage(imageDataUrl);
	// 	setStep("captured");

	// 	// Always stop webcam after capturing
	// 	stopAllTracks();
	// };

	// const confirmImage = () => {
	// 	if (capturedImage) {
	// 		localStorage.setItem("userImage", capturedImage);
	// 		setStep("confirmed");
	// 	}
	// };

	// const retakeImage = async () => {
	// 	// Ensure we completely reset the state before restarting
	// 	setCapturedImage(null);

	// 	try {
	// 		// Explicitly set step to initial to reset everything
	// 		setStep("initial");

	// 		// Add a small delay to ensure state is reset
	// 		await new Promise((resolve) => setTimeout(resolve, 100));

	// 		// Start the webcam
	// 		await startWebcam();
	// 	} catch (err) {
	// 		console.error("Failed to restart webcam:", err);
	// 		setError("Could not restart the webcam.");
	// 		setStep("initial");
	// 	}
	// };

	// const continueSteps = () => {
	// 	startWebcam();
	// 	setStep("normal");
	// };

	// Clean up on unmount - ALWAYS run this no matter what
	useEffect(() => {
		return () => {
			console.log("Component unmounting, stopping all tracks");
			stopAllTracks();
		};
	}, []);

	// Add effect handler for each state change
	// useEffect(() => {
	// 	console.log("Step changed to:", step);

	// 	// Stop camera when entering states that shouldn't have camera active
	// 	if (["initial", "captured", "confirmed"].includes(step)) {
	// 		stopAllTracks();
	// 	}
	// }, [step]);

	// When id changes, restart the camera
	// useEffect(() => {
	// 	if (id && (step === "streaming" || step === "normal")) {
	// 		const restartCamera = async () => {
	// 			stopAllTracks();
	// 			// Small delay to ensure camera is fully stopped
	// 			await new Promise((resolve) => setTimeout(resolve, 500));
	// 			startWebcam();
	// 		};

	// 		restartCamera();
	// 	}
	// }, [id]);

	useEffect(() => {
		console.log("Setting up event listener for image frame");

		const unlisten = listen<string>("image-frame", (event) => {
			const base64 = event.payload;
			// console.log("Received image frame:", base64);
			setImgSrc(`data:image/jpeg;base64,${base64}`);
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, []);

	return (
		<div className="h-full w-full flex flex-col justify-between">
			{error && <div className="text-red-500 p-4">{error}</div>}

			{step === "initial" && (
				<div className="flex-grow flex flex-col items-center justify-end mb-4">
					{/* <p className="text-white mb-4">
						Click the button below to start your camera
					</p> */}
					<Button onClick={startWebcam}>Start Camera</Button>
				</div>
			)}

			{step === "streaming" && (
				<>
					<div className="flex-grow flex items-center justify-center">
						{/* <video
							ref={videoRef}
							width={width}
							height={height}
							muted
							playsInline
							autoPlay
							className="max-w-full max-h-full"
						/> */}

						{imgSrc ? (
							<img
								src={imgSrc}
								alt="Live feed"
								className="rounded-xl shadow-lg w-full max-w-xl"
							/>
						) : (
							<div className="w-full flex justify-center">
								<div className="relative w-48 h-1 bg-transparent overflow-hidden rounded-full">
									<div className="absolute w-32 h-1 bg-white rounded-full animate-bounce-x"></div>
								</div>
								<style>
									{`
										@keyframes bounce-x {
											0%, 100% {
												transform: translateX(0);
												width: 0%;
											}
											25% {
												transform: translateX(50%);
												width: 25%;
											}
											50% {
												transform: translateX(100%);
												width: 0%;
											}
											75% {
												transform: translateX(150%);
												width: 25%;
											}
										}
										.animate-bounce-x {
											animation: bounce-x 1.5s infinite;
										}
									`}
								</style>
							</div>
						)}
					</div>
					<div className="pb-4 flex justify-center space-x-4">
						<Button
							onClick={() => {
								stopAllTracks();

								setStep("initial");
							}}
						>
							Cancel
						</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default Webcam;
