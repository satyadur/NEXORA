"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Crown, Star, Loader2 } from "lucide-react";
import { RegisterFormValues } from "../schemas/register.schema";
import { Skeleton } from "@/components/ui/skeleton";
import { usePackages } from "@/hooks/usePackages";

interface Props {
  form: UseFormReturn<RegisterFormValues>;
}

// Map package IDs to icons
const getPackageIcon = (id: string) => {
  switch (id) {
    case "basic":
      return Star;
    case "standard":
      return Sparkles;
    case "premium":
      return Crown;
    default:
      return Star;
  }
};

export default function PackageStep({ form }: Props) {
  const { data, isLoading, error } = usePackages();
  const packages = data?.packages || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load packages. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Choose Your Learning Package</h3>
        <p className="text-sm text-muted-foreground">
          Select the package that best fits your learning goals
        </p>
      </div>

      <FormField
        control={form.control}
        name="selectedPackage"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid gap-4 md:grid-cols-3"
              >
                {packages.map((pkg) => {
                  const Icon = getPackageIcon(pkg.id);
                  const isSelected = field.value === pkg.id;
                  
                  return (
                    <div key={pkg.id} className="relative group">
                      <RadioGroupItem
                        value={pkg.id}
                        id={pkg.id}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={pkg.id}
                        className={`block cursor-pointer rounded-lg border-2 p-6 transition-all hover:shadow-lg hover:scale-105 ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-muted hover:border-primary/50"
                        } ${pkg.popular ? "relative overflow-hidden" : ""}`}
                      >
                        {pkg.popular && (
                          <>
                            <div className="absolute top-0 right-0">
                              <Badge className="rounded-bl-lg rounded-tr-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                Most Popular
                              </Badge>
                            </div>
                            <div className="absolute top-0 left-0 w-20 h-20 overflow-hidden">
                              <div className="absolute transform -rotate-45 bg-amber-500 text-white text-xs py-1 px-8 -left-8 top-5">
                                POPULAR
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-3 rounded-full transition-colors ${
                            isSelected 
                              ? "bg-primary text-white" 
                              : "bg-muted group-hover:bg-primary/10"
                          }`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{pkg.name}</h4>
                            <div className="flex items-baseline gap-1">
                              <p className="text-3xl font-bold">
                                ₹{pkg.price.toLocaleString()}
                              </p>
                              {pkg.price > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  /year
                                </span>
                              )}
                            </div>
                            {pkg.price === 0 && (
                              <p className="text-xs text-green-600">Free Forever</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 mt-4">
                          {pkg.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className={`h-4 w-4 ${
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              } shrink-0 mt-0.5`} />
                              <span className="text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-dashed">
                          <p className="text-xs font-medium mb-2">Package includes:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Courses:</span>
                              <span className="font-medium">{pkg.limits.courses}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Certificates:</span>
                              <span className="font-medium">{pkg.limits.certificates ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex items-center gap-1 col-span-2">
                              <span className="text-muted-foreground">Mentoring:</span>
                              <span className="font-medium">{pkg.limits.mentoring}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 text-xs text-muted-foreground">
                          Duration: {pkg.duration}
                        </div>

                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </label>
                    </div>
                  );
                })}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Package Comparison Link */}
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Not sure which package to choose?{" "}
          <button
            type="button"
            onClick={() => window.open('/packages/compare', '_blank')}
            className="text-primary font-medium hover:underline"
          >
            Compare all features
          </button>
        </p>
      </div>
    </div>
  );
}