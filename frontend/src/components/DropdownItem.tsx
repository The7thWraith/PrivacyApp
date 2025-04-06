import React from 'react'
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

export default DropdownOption;