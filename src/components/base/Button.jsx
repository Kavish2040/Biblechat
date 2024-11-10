// src/components/base/Button.jsx

import React from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import "./Button.css"; // Ensure this CSS file is in the same directory

const Button = ({ label, onClick, isLoading, disabled }) => {
  return (
    <button
      className={`button ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ScaleLoader
          color="#e0e0e0" // Light gray to contrast against dark background
          height={10}
          width={2.5}
          margin={0.5}
          loading={true}
          size={50}
          className="spinner"
        />
      ) : (
        <span className="button-label">{label}</span>
      )}
      <div className="waveform"></div> {/* Waveform Element */}
    </button>
  );
};

export default Button;
