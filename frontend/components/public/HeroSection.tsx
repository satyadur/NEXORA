"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { GraduationCap, BarChart3, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/ui/animated-section";

export default function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
      .fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.6"
      )
      .fromTo(
        buttonsRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: "power3.out" },
        "-=0.4"
      );
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container mx-auto px-6 py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Next-Gen Learning Platform</span>
          </div>

          {/* Main Title */}
          <h1
            ref={titleRef}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Transform Your{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Coaching Institute
            </span>{" "}
            with Smart LMS
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            A powerful role-based platform to manage classrooms, track student progress,
            and deliver exceptional learning experiences.
          </p>

          {/* CTA Buttons */}
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button size="lg" className="gap-2 text-base px-8 group">
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <AnimatedSection animation="slideUp" delay={0.2}>
            <FeatureCard
              icon={<GraduationCap className="h-8 w-8" />}
              title="Classroom Management"
              description="Create and manage multiple classrooms, batches, and student groups with ease."
              color="from-blue-500/20 to-blue-600/20"
            />
          </AnimatedSection>

          <AnimatedSection animation="slideUp" delay={0.4}>
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Advanced Analytics"
              description="Track student performance, submission rates, and generate detailed reports."
              color="from-purple-500/20 to-purple-600/20"
            />
          </AnimatedSection>

          <AnimatedSection animation="slideUp" delay={0.6}>
            <FeatureCard
              icon={<ShieldCheck className="h-8 w-8" />}
              title="Secure Role-Based Access"
              description="Three-tier architecture with Admin, Teacher, and Student roles."
              color="from-green-500/20 to-green-600/20"
            />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description, color }: any) {
  return (
    <div className="group relative p-8 rounded-2xl border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`} />
      <div className="relative z-10">
        <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}