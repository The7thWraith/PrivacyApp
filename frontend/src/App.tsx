import React from "react";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import WelcomePage from "./pages/Welcome";
import MainAppPage from "./pages/Home";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<WelcomePage />} />
				<Route path="/home" element={<MainAppPage />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;