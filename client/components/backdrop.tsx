"use client";
import React from "react";

interface BackdropProps {
  onClick: () => void;
}

const Backdrop: React.FC<BackdropProps> = ({ onClick }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-10"
      onClick={onClick}
      tabIndex={0}
      role="button"
    ></div>
  );
};

export default Backdrop;
