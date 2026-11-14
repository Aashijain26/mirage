import React, { useRef, useState } from "react";

export function SpotlightCard({
  children,
  className = "",
  blueGlow = true,
  onClick,
  ...props
}) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-300 ${
        blueGlow
          ? "hover:border-[#2563eb]/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.14)]"
          : "hover:border-white/30"
      } ${className}`}
      {...props}
    >
      {/* Translucent white circular spotlight with subtle blue shade */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-[inherit] z-0"
          style={{
            background: `radial-gradient(190px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.12), rgba(59, 130, 246, 0.08) 45%, transparent 80%)`
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
