"use client";
import React from "react";

interface BackdropProps {
  onClick: () => void;
}

const Backdrop: React.FC<BackdropProps> = ({ onClick }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-10"
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        setTimeout(onClick, 150); // Add a slight delay to ensure touch events on context menu items are handled first
      }}
    />
  );
};

export default Backdrop;
