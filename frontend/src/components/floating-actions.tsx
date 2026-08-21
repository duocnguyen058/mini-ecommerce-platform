"use client";
import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fab-group">
      <a 
        href="https://zalo.me/0123456789" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fab-btn fab-zalo"
        aria-label="Chat Zalo"
      >
        <svg viewBox="0 0 24 24" className="size-6 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.42 10.96a8.96 8.96 0 00-11.43-8.6c-4.94 1.25-8.31 5.95-7.85 11.08.38 4.3 3.65 7.82 7.9 8.65l.55.1 1.76 2.37c.32.42 1 .1 1-.43v-1.74a8.93 8.93 0 007.82-5.46 8.98 8.98 0 00.25-5.97zM11.5 14h-1c-.28 0-.5-.22-.5-.5V11h-1v2.5c0 .28-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5v-4c0-.28.22-.5.5-.5h3.5c.28 0 .5.22.5.5v4c0 .28-.22.5-.5.5zm5.5 0h-1c-.28 0-.5-.22-.5-.5v-1.5h-1.5V13.5c0 .28-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5v-4c0-.28.22-.5.5-.5h3.5c.28 0 .5.22.5.5v1.5h-1.5V11h1.5c.28 0 .5.22.5.5v2c0 .28-.22.5-.5.5z"/>
        </svg>
      </a>
      <button 
        onClick={scrollToTop}
        className={`fab-btn fab-top ${showTop ? "" : "hidden"}`}
        aria-label="Lên đầu trang"
      >
        <ChevronUp className="size-6" />
      </button>
    </div>
  );
}
