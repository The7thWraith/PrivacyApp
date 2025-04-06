import React, { useEffect } from "react";

const DropdownOption = ({
	id,
	label,
	value,
	options,
	isOpen,
	onToggle,
	onSelect
}) => {
	return (
		<div className="flex items-center justify-between bg-neutral-700 rounded-lg p-3 mb-6 w-full relative">
			<span className="text-gray-300">{label}</span>
			<div
				className="flex items-center bg-neutral-700 gap-2 cursor-pointer max-w-[65%] overflow-hidden"
				onClick={() => onToggle(id)}
			>
				<span className="text-white font-medium truncate">{value}</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					height="24px"
					viewBox="0 -960 960 960"
					width="24px"
					fill="#e3e3e3"
					className={`transform transition-transform duration-300 flex-shrink-0 ${
						isOpen ? "rotate-180" : ""
					}`}
				>
					<path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
				</svg>
			</div>

			<div
				className={`absolute right-0 w-64 bg-neutral-800 border-none rounded-md shadow-lg overflow-hidden z-10 top-full
           transition-all duration-300 origin-top ${
				isOpen
					? "opacity-100 scale-y-100"
					: "opacity-0 scale-y-0 pointer-events-none"
			}`}
			>
				<div className="py-0 max-h-48 overflow-y-auto">
					{options.map((option, index) => {
						const isFirst = index === 0;
						const isLast = index === options.length - 1;

						return (
							<div
								key={option}
								className={`
                  px-4 py-2 text-sm cursor-pointer truncate
                  ${index !== 0 ? "border-t border-gray-700" : ""}
                  ${
						value === option
							? `bg-blue-500 text-white ${
									isFirst ? "rounded-t-md" : ""
							  } ${isLast ? "rounded-b-md" : ""}`
							: "text-gray-200 hover:bg-neutral-700"
					}
                `}
								onClick={() => onSelect(id, option)}
							>
								{option}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default DropdownOption;