"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function OfflineScreen() {
  const [isOffline, setIsOffline] = useState(false);
  const [showScreen, setShowScreen] = useState(false);
  
  // Refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const satelliteRef = useRef<HTMLDivElement>(null);
  const signalBarsRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowScreen(true);
    };
    
    const handleOnline = () => {
      // Animate out before hiding
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 0,
          y: -50,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            setIsOffline(false);
            setShowScreen(false);
          }
        });
      } else {
        setIsOffline(false);
        setShowScreen(false);
      }
    };

    setIsOffline(!navigator.onLine);
    if (!navigator.onLine) {
      setShowScreen(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Run entrance animations when screen appears
  useEffect(() => {
    if (showScreen && containerRef.current) {
      const tl = gsap.timeline();

      tl.fromTo(containerRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      )
      .fromTo(iconRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 1, ease: "elastic.out(1, 0.5)" },
        "-=0.5"
      )
      .fromTo(satelliteRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, ease: "back.out(1.7)" },
        "-=0.8"
      )
      .fromTo(titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.6"
      )
      .fromTo(textRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      )
      .fromTo(buttonRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.3"
      )
      .fromTo(dotsRef.current?.children || [],
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.2, ease: "back.out(2)" },
        "-=0.3"
      );

      // Floating animation for satellite
      gsap.to(satelliteRef.current, {
        y: -10,
        x: 5,
        rotation: 5,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Pulsing animation for signal bars
      if (signalBarsRef.current) {
        const bars = signalBarsRef.current.children;
        gsap.to(bars, {
          opacity: 0.3,
          duration: 1,
          stagger: 0.3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }

      // Button hover animation
      if (buttonRef.current) {
        buttonRef.current.addEventListener('mouseenter', () => {
          gsap.to(buttonRef.current, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        buttonRef.current.addEventListener('mouseleave', () => {
          gsap.to(buttonRef.current, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      }
    }

    return () => {
      gsap.killTweensOf([iconRef.current, satelliteRef.current, signalBarsRef.current]);
    };
  }, [showScreen]);

  if (!showScreen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 overflow-hidden"
    >
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-r from-red-200/30 to-orange-200/30 dark:from-red-900/20 dark:to-orange-900/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-r from-blue-200/30 to-purple-200/30 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative max-w-2xl w-full">
        <div className="text-center space-y-8">
          {/* Main icon with satellite */}
          <div className="relative inline-block">
            {/* Satellite dish */}
            <div 
              ref={satelliteRef}
              className="absolute -top-10 -right-10 w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 rounded-lg shadow-xl transform rotate-12"
            >
              <div className="absolute top-2 left-2 w-3 h-3 bg-gray-100 dark:bg-gray-300 rounded-full" />
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded-full" />
              <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-600 rounded-lg" />
            </div>

            {/* Main icon */}
            <div
              ref={iconRef}
              className="relative bg-gradient-to-br from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600 p-8 rounded-full shadow-2xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
            </div>

            {/* Signal strength indicator */}
            <div
              ref={signalBarsRef}
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex items-end gap-1"
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-red-500 dark:bg-red-400 rounded-full"
                  style={{
                    height: `${(i + 1) * 6}px`,
                    opacity: 0.5
                  }}
                />
              ))}
            </div>
          </div>

          {/* Text content */}
          <div className="space-y-3">
            <h1
              ref={titleRef}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent"
            >
              No Internet Connection
            </h1>
            <p
              ref={textRef}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto"
            >
              You&apos;ve lost your connection to the digital world. 
              Don&apos;t worry, we&apos;ll be here when you return.
            </p>
          </div>

          {/* Animated dots */}
          <div ref={dotsRef} className="flex justify-center gap-3 py-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-red-400 to-orange-400 rounded-full"
                style={{
                  animation: `pulse 1.5s ${i * 0.2}s infinite`
                }}
              />
            ))}
          </div>

          {/* Status card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600 dark:text-red-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-2.829 2.829L9 9"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Signal Lost</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">No network</p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-xl mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">WiFi Offline</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Disconnected</p>
              </div>
            </div>

            <button
              ref={buttonRef}
              onClick={() => window.location.reload()}
              className="w-full px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transition-transform group-hover:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Reconnecting
            </button>
          </div>

          {/* Help text */}
          <p className="text-sm text-gray-400 dark:text-gray-600">
            Check your network cables, modem, and router
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}