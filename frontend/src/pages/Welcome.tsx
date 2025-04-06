import React from "react";

import { useNavigate } from "react-router-dom";

const Welcome = () => {
	const navigate = useNavigate();

	return (
		<div>
			<p>Welcome</p>

			<button onClick={() => navigate("/home")}>Go to Home</button>
		</div>
	);
};

export default Welcome;
