import React from "react";

interface ButtonProps {
	text?: string;
	onClick?: () => void;
	className?: string;
    children?:any;
}

const Button: React.FC<ButtonProps> = ({
	text = "Begin",
	onClick,
	className = "",
    children
}) => {
	return (
		<button
			onClick={onClick}
			className={`bg-white text-gray-800 font-medium text-xl py-3 px-8 rounded-full ${className}`}
			style={{
				boxShadow: "4px 4px 4px 0 rgba(0, 0, 0, 0.25)"
			}}
		>
			{children}
		</button>
	);
};

export default Button;
