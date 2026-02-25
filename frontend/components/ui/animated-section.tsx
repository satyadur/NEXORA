"use client";

import { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: "fadeIn" | "slideUp" | "slideInLeft" | "slideInRight" | "scale";
  delay?: number;
  duration?: number;
  threshold?: number;
}

export function AnimatedSection({
  children,
  className = "",
  animation = "fadeIn",
  delay = 0,
  duration = 0.8,
  threshold = 0.2,
}: AnimatedSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    // Set initial styles based on animation
    const initialStyles = {
      fadeIn: { opacity: 0 },
      slideUp: { opacity: 0, y: 50 },
      slideInLeft: { opacity: 0, x: -50 },
      slideInRight: { opacity: 0, x: 50 },
      scale: { opacity: 0, scale: 0.8 },
    };

    gsap.set(element, initialStyles[animation]);

    // Create animation
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: element,
        start: `top bottom-=${threshold * 100}%`,
        onEnter: () => {
          gsap.to(element, {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            duration,
            delay,
            ease: "power3.out",
          });
        },
        once: true,
      });
    }, element);

    return () => ctx.revert();
  }, [animation, delay, duration, threshold]);

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  );
}

export function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = counterRef.current;
    if (!element) return;

    const obj = { count: 0 };
    
    gsap.to(obj, {
      count: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        element.textContent = Math.round(obj.count).toString();
      },
    });
  }, [value, duration]);

  return <span ref={counterRef}>0</span>;
}