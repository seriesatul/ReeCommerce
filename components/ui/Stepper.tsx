"use client";

import { Check } from "lucide-react";

interface Step {
  number: number;
  title: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* The Connecting Line Background */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 -z-0" />
        
        {/* The Active Connecting Line (Progress) */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-indigo-600 transition-all duration-500 ease-in-out -z-0" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              {/* Circle */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                  isCompleted
                    ? "bg-indigo-600 border-indigo-600"
                    : isActive
                    ? "bg-white border-indigo-600"
                    : "bg-white border-slate-200"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-white" />
                ) : (
                  <span className={`text-sm font-bold ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                    {step.number}
                  </span>
                )}
              </div>

              {/* Title - Positioned absolutely below to avoid shifting the line */}
              <div className="absolute top-12 whitespace-nowrap text-center">
                <p
                  className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                    isActive ? "text-indigo-600" : isCompleted ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {step.title}
                </p>
                {isActive && (
                  <p className="text-[8px] font-medium text-indigo-400 animate-pulse">
                    In Progress
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Spacer to give room for the absolute titles below */}
      <div className="h-10" />
    </div>
  );
}