import React from "react";

interface BatLogoProps {
  className?: string;
}

export const BatLogo: React.FC<BatLogoProps> = ({ className = "" }) => {
  return (
    <img
      src="/Lg1.png"
      alt="Batman Logo"
      className={`${className} bat-logo`}
    />
  );
};