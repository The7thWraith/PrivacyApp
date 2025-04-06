import React, { useRef, useState, useEffect } from "react";
import Button from "./Button";

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

	// Guaranteed stream cleanup function
	const stopAllTracks = () => {
		// First, stop any tracks in our stored stream reference
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(track => {
				console.log("Stopping track:", track.kind, track.id, track.readyState);
				track.stop();
			});
			streamRef.current = null;
		}
		
		// Also check video element's srcObject as a backup
		if (videoRef.current && videoRef.current.srcObject) {
			const stream = videoRef.current.srcObject as MediaStream;
			stream.getTracks().forEach(track => {
				console.log("Stopping track from video:", track.kind, track.id, track.readyState);
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
		
		if (step === "initial") setStep("streaming");

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
			
			console.log("Camera access granted. Track states:", 
				stream.getTracks().map(t => `${t.kind}: ${t.readyState}`));

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

			setError(null);
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

	const captureImage = () => {
		if (!videoRef.current) return;

		const canvas = document.createElement("canvas");
		canvas.width = videoRef.current.videoWidth;
		canvas.height = videoRef.current.videoHeight;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

		const imageDataUrl = canvas.toDataURL("image/jpeg");
		setCapturedImage(imageDataUrl);
		setStep("captured");
		
		// Always stop webcam after capturing
		stopAllTracks();
	};

	const confirmImage = () => {
		if (capturedImage) {
			localStorage.setItem("userImage", capturedImage);
			setStep("confirmed");
		}
	};

	const retakeImage = () => {
		setCapturedImage(null);
		startWebcam();
	};

	const continueSteps = () => {
		startWebcam();
		setStep("normal");
	};

	// Clean up on unmount - ALWAYS run this no matter what
	useEffect(() => {
		return () => {
			console.log("Component unmounting, stopping all tracks");
			stopAllTracks();
		};
	}, []);

	// Add effect handler for each state change
	useEffect(() => {
		console.log("Step changed to:", step);
		
		// Stop camera when entering states that shouldn't have camera active
		if (["initial", "captured", "confirmed"].includes(step)) {
			stopAllTracks();
		}
	}, [step]);
	
	// When id changes, restart the camera
	useEffect(() => {
		if (id && (step === "streaming" || step === "normal")) {
			const restartCamera = async () => {
				stopAllTracks();
				// Small delay to ensure camera is fully stopped
				await new Promise(resolve => setTimeout(resolve, 500));
				startWebcam();
			};
			
			restartCamera();
		}
	}, [id]);

	return (
		<div className="h-full w-full flex flex-col justify-between">
			{error && <div className="text-red-500 p-4">{error}</div>}

			{step === "initial" && (
				<div className="flex-grow flex flex-col items-center justify-center">
					<p className="text-white mb-4">
						Click the button below to start your camera
					</p>
					<Button onClick={startWebcam}>Start Camera</Button>
				</div>
			)}

			{step === "streaming" && (
				<>
					<div className="flex-grow flex items-center justify-center">
						<video
							ref={videoRef}
							width={width}
							height={height}
							muted
							playsInline
							autoPlay
							className="max-w-full max-h-full"
						/>
					</div>
					<div className="pb-4 flex justify-center space-x-4">
						<Button onClick={captureImage}>Take Photo</Button>
						<Button onClick={() => {
							stopAllTracks();
							setStep("initial");
						}}>Cancel</Button>
					</div>
				</>
			)}

			{step === "captured" && (
				<>
					<div className="flex-grow flex items-center justify-center">
						{capturedImage && (
							<img
								src={capturedImage}
								alt="Captured"
								className="max-w-full max-h-full"
							/>
						)}
					</div>
					<div className="pb-4 flex justify-center space-x-4">
						<Button onClick={retakeImage}>Retake Photo</Button>
						<Button onClick={confirmImage}>Confirm Photo</Button>
					</div>
				</>
			)}

			{step === "confirmed" && (
				<div className="flex-grow flex flex-col items-center justify-center">
					<div className="mb-4">
						{capturedImage && (
							<img
								src={capturedImage}
								alt="Confirmed"
								className="max-w-full max-h-full rounded-lg"
							/>
						)}
					</div>
					<Button onClick={continueSteps}>Continue</Button>
				</div>
			)}

			{step === "normal" && (
				<>
					<div className="flex-grow flex items-center justify-center">
						<video
							ref={videoRef}
							width={width}
							height={height}
							muted
							playsInline
							autoPlay
							className="max-w-full max-h-full"
						/>
					</div>
					<div className="pb-4 flex justify-center space-x-4">
						<Button onClick={() => {
							stopAllTracks();
							setStep("initial");
						}}>Stop Camera</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default Webcam;