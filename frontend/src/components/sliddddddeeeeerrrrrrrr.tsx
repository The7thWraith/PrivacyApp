import React, { useState } from "react";

const Slider = ({ id, label, value, min, max, onSliderChange }) => {
	const [currentValue, setCurrentValue] = useState(value);

	const handleSliderChange = (e) => {
		const newValue = e.target.value;
		setCurrentValue(newValue);
		onSliderChange(id, newValue);
	};

	return (
		<div className="flex items-center justify-between bg-neutral-700 rounded-lg p-3 mb-6 w-full">
			<span className="text-gray-300">{label}</span>
			<div className="flex items-center gap-2">
				<span className="text-white font-medium">{currentValue}%</span>
                <div className="relative w-32 flex items-center">
					<input
						type="range"
						min={min}
						max={max}
						value={currentValue}
						onChange={handleSliderChange}
						className="slider bg-blue-500 w-full"
						style={{
							appearance: 'none',
							width: '100%',
							height: '2px',
							borderRadius: '4px',
							backgroundColor: '#8e8e8e', // Grey track
							outline: 'none',
							position: 'relative',
						}}
					/>
				</div>
			</div>
		</div>
	);
};

export default Slider;
