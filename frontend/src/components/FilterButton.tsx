import React from "react";

interface FilterButtonProps {
	label: string;
	active: boolean;
	onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
	label,
	active,
	onClick
}) => {
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

export default FilterButton;
