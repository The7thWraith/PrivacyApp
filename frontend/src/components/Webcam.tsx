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

	const startWebcam = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width,
					height,
					facingMode,
					deviceId: id
				},
				audio: false
			});

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.onloadedmetadata = () => {
					videoRef.current?.play();
					setIsStreaming(true);
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
		}
	};

	const stopWebcam = () => {
		if (videoRef.current && videoRef.current.srcObject) {
			const stream = videoRef.current.srcObject as MediaStream;
			const tracks = stream.getTracks();

			tracks.forEach((track) => track.stop());
			videoRef.current.srcObject = null;
			setIsStreaming(false);
		}
	};

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (isStreaming) {
				stopWebcam();
			}
		};
	}, [isStreaming]);

	useEffect(() => {
		if (!isStreaming) return;

		if (isStreaming) {
			stopWebcam();
		}

		if (id) {
			startWebcam();
		}
	}, [id]);

	return (
		<div className="h-full w-full flex flex-col justify-between">
			<div className="flex-grow flex items-center justify-center">
				<video
					ref={videoRef}
					width={width}
					height={height}
					muted
					playsInline
					style={{ display: isStreaming ? "block" : "none" }}
				/>
			</div>

			{error && <div className="error-message">{error}</div>}

			<div className="pb-4 flex justify-center">
				{!isStreaming ? (
					<Button onClick={startWebcam}>Start Camera</Button>
				) : (
					<Button onClick={stopWebcam}>Stop Camera</Button>
				)}
			</div>
		</div>
	);
};

export default Webcam;
