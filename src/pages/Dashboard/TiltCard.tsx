import { useState, useRef } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import { type ActionCard } from "./utils";

export const TiltCard = ({
  a,
  isActive,
  onClick,
  hoverStyle,
}: {
  a: ActionCard;
  isActive: boolean;
  onClick: () => void;
  hoverStyle?: string;
}) => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [style, setStyle] = useState({});
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = (y / rect.height - 0.5) * -15; // Inverted logic for natural tilt
    const rotateY = (x / rect.width - 0.5) * 15;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: "none",
    });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.2, // Subtle white reflection
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
    });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden w-full text-left rounded-[2rem] p-6 cursor-pointer outline-none ${
        isActive
          ? "bg-gradient-to-br from-[var(--cv-accent)]/20 via-[var(--cv-accent)]/10 to-transparent border border-[var(--cv-accent)]/50 shadow-[0_10px_40px_rgba(var(--cv-accent-rgb),0.2)]"
          : "border border-white/5 bg-white/[0.02] backdrop-blur-md hover:border-white/10 hover:bg-white/5"
      } ${hoverStyle || ""}`}
      style={{
        ...style,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Responsive Glare Effect - Shines over the card as mouse moves */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[2rem] transition-opacity duration-300 z-20"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
          opacity: glare.opacity,
          mixBlendMode: "overlay",
        }}
      />

      {/* Layer 1: Parallax Icon & Text Container */}
      <div
        className="relative z-10 flex flex-col h-full pointer-events-none transform-gpu transition-all duration-300 group-hover:translate-z-10"
        style={{
          transform: style.hasOwnProperty("transform")
            ? "translateZ(30px)"
            : "translateZ(0px)",
        }}
      >
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`h-14 w-14 shrink-0 rounded-2xl grid place-items-center text-2xl transition-all duration-500 ${
              isActive
                ? "bg-[var(--cv-accent)] text-white shadow-lg shadow-[var(--cv-accent)]/40 scale-105"
                : "bg-[var(--cv-accent)]/10 border border-[var(--cv-accent)]/20 text-[var(--cv-accent)] group-hover:bg-[var(--cv-accent)]/20 group-hover:scale-110"
            }`}
          >
            {a.icon}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3
              className={`text-lg font-bold truncate transition-colors duration-300 ${isActive ? "text-white" : "text-white/80 group-hover:text-white"}`}
            >
              {a.title}
            </h3>
          </div>
        </div>

        {/* Layer 2: Deeper Parallax for description */}
        <p
          className={`text-sm leading-relaxed mb-6 mt-2 transition-colors duration-300 h-[40px] transform-gpu ${isActive ? "text-white/90" : "text-white/50 group-hover:text-white/70"}`}
          style={{
            transform: style.hasOwnProperty("transform")
              ? "translateZ(20px)"
              : "translateZ(0px)",
          }}
        >
          {a.desc}
        </p>

        {/* Layer 3: Elevated Action Bar */}
        <div
          className="flex items-center justify-between border-t border-white/10 pt-5 mt-auto transform-gpu transition-all duration-300"
          style={{
            transform: style.hasOwnProperty("transform")
              ? "translateZ(40px)"
              : "translateZ(0px)",
          }}
        >
          <span
            className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? "text-[var(--cv-accent)]" : "text-white/30 group-hover:text-white/60"}`}
          >
            {isActive ? "Actively Viewing" : "Press to Expand"}
          </span>
          <div
            className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-500 ${
              isActive
                ? "border-[var(--cv-accent)] text-[var(--cv-accent)] bg-[var(--cv-accent)]/10 shadow-[0_0_15px_rgba(var(--cv-accent-rgb),0.3)]"
                : "border-white/10 text-white/30 group-hover:border-[var(--cv-accent)]/50 group-hover:text-[var(--cv-accent)] group-hover:bg-[var(--cv-accent)]/5"
            }`}
          >
            <ArrowRightOutlined
              className={
                isActive
                  ? ""
                  : "-rotate-45 group-hover:rotate-0 transition-transform duration-500"
              }
            />
          </div>
        </div>
      </div>
    </button>
  );
};
