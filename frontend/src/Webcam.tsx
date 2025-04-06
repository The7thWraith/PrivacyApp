import React, { useRef, useState, useEffect } from "react";

interface WebcamProps {
	width?: number;
	height?: number;
	facingMode?: string;
}

const Webcam: React.FC<WebcamProps> = ({
	width = 640,
	height = 480,
	facingMode = "user"
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
					facingMode
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

	return (
		<div className="webcam-container">
			<video
				ref={videoRef}
				width={width}
				height={height}
				muted
				playsInline
				style={{ display: isStreaming ? "block" : "none" }}
			/>

			{error && <div className="error-message">{error}</div>}

			<div className="controls">
				{!isStreaming ? (
					<button onClick={startWebcam}>Start Camera</button>
				) : (
					<button onClick={stopWebcam}>Stop Camera</button>
				)}
			</div>
		</div>
	);
};

export default Webcam;
