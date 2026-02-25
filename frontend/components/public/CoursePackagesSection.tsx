"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Rocket, Crown, Check, Sparkles } from "lucide-react";
import { AnimatedSection } from "@/components/ui/animated-section";

const packages = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Foundation",
    price: "₹4,999",
    period: "/month",
    description: "Perfect for beginners starting their learning journey",
    features: [
      "Basic Classroom Access",
      "Weekly Assignments",
      "Performance Tracking",
      "Email Support",
      "5 Active Courses",
    ],
    color: "from-blue-500 to-blue-600",
    borderColor: "border-blue-200 dark:border-blue-800",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "Advanced",
    price: "₹9,999",
    period: "/month",
    description: "Most popular choice for serious learners",
    features: [
      "Everything in Foundation",
      "Live Doubt Sessions",
      "Detailed Analytics",
      "Priority Support",
      "15 Active Courses",
      "Certificate of Completion",
    ],
    popular: true,
    color: "from-purple-500 to-purple-600",
    borderColor: "border-purple-200 dark:border-purple-800",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    icon: <Crown className="h-6 w-6" />,
    title: "Pro Elite",
    price: "₹14,999",
    period: "/month",
    description: "Ultimate learning experience with personal mentorship",
    features: [
      "All Advanced Features",
      "Personal Mentor",
      "Premium Reports",
      "24/7 Priority Support",
      "Unlimited Courses",
      "Career Guidance",
      "Interview Preparation",
    ],
    color: "from-amber-500 to-amber-600",
    borderColor: "border-amber-200 dark:border-amber-800",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
];

export default function CoursePackagesSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        <AnimatedSection animation="fadeIn">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Learning Path
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Flexible packages designed to match your learning goals and pace
            </p>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <AnimatedSection
              key={index}
              animation="scale"
              delay={index * 0.2}
              className="h-full"
            >
              <Card
                className={`relative h-full transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  pkg.popular ? "border-2 border-primary shadow-xl" : ""
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </div>
                  </div>
                )}

                <CardContent className="p-8">
                  {/* Header */}
                  <div className={`inline-flex p-3 rounded-xl ${pkg.bgColor} border ${pkg.borderColor} mb-6`}>
                    <div className={`text-${pkg.color.split('-')[1]}-600`}>
                      {pkg.icon}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{pkg.title}</h3>
                  <p className="text-muted-foreground mb-4">{pkg.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{pkg.price}</span>
                    <span className="text-muted-foreground">{pkg.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full ${pkg.bgColor} flex items-center justify-center`}>
                          <Check className={`h-3 w-3 text-${pkg.color.split('-')[1]}-600`} />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <Button
                    className={`w-full bg-gradient-to-r ${pkg.color} text-white hover:opacity-90 transition-opacity`}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}