import React from "react";
import "../LoadingScreen.css"; // Import the CSS for animation

const LoadingScreen = () => {
  return (
    <div className="loading-container">
      <img src="/Lg1.png" alt="App Logo" className="breathing-logo" />
    </div>
  );
};

export default LoadingScreen;
