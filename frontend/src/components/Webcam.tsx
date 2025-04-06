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

	const startWebcam = async () => {
		if (step === "initial") setStep("streaming"); // Set step immediately to update UI

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width,
					height,
					facingMode,
					deviceId: id ? { exact: id } : undefined
				},
				audio: false
			});

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.onloadedmetadata = () => {
					if (videoRef.current) {
						videoRef.current
							.play()
							.then(() => {
								setIsStreaming(true);
							})
							.catch((err) => {
								console.error("Error playing video:", err);
								setError(`Error playing video: ${err.message}`);
								setStep("initial");
							});
					}
				};
			}

			setError(null);
		} catch (err) {
			setError(
				`Failed to access webcam: ${
					err instanceof Error ? err.message : String(err)
				}`
			);
			setIsStreaming(false);
			setStep("initial");
		}
	};

	const stopWebcam = () => {
		if (videoRef.current && videoRef.current.srcObject) {
			const stream = videoRef.current.srcObject as MediaStream;
			const tracks = stream.getTracks();

			tracks.forEach((track) => track.stop());
			videoRef.current.srcObject = null;
		}
		setIsStreaming(false);
		setStep("initial");
		setCapturedImage(null);
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
	};

	const confirmImage = () => {
		if (capturedImage) {
			localStorage.setItem("userImage", capturedImage);
			setStep("confirmed");
		}
	};

	const retakeImage = () => {
		setCapturedImage(null);
		setStep("streaming");
	};

	const continueSteps = () => {
		startWebcam();
		setStep("normal");
	};

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (isStreaming) {
				stopWebcam();
			}
		};
	}, [isStreaming]);

	// Handle camera ID changes
	useEffect(() => {
		if (id && isStreaming) {
			stopWebcam();
			setTimeout(() => {
				startWebcam();
			}, 300);
		}
	}, [id]);

	console.log("Current step:", step, "isStreaming:", isStreaming);

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
						<Button onClick={stopWebcam}>Cancel</Button>
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
						<Button onClick={stopWebcam}>Stop Camera</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default Webcam;
