"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // 1. ADDED: Import for session management
import { ArrowLeft, Loader2 } from "lucide-react"; // 2. ADDED: Loader icon for UX
import Link from "next/link";
import Stepper from "@/components/ui/Stepper";
import Step1_Profile from "@/components/onboarding/seller/Step1_Profile";
import Step2_Verification from "@/components/onboarding/seller/Step2_Verification";
import Step3_Payouts from "@/components/onboarding/seller/Step3_Payout";
import Step4_Review from "@/components/onboarding/seller/Step4_Review";

const STEPS = [
  { number: 1, title: "Shop Profile" },
  { number: 2, title: "Verification" },
  { number: 3, title: "Payouts" },
  { number: 4, title: "Review & Submit" },
];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { update } = useSession(); // 3. FIXED: Extracting update function to refresh session
  
  // State for the wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false); // 4. FIXED: Missing loading state defined
  const [formData, setFormData] = useState({
    shopName: "",
    shopHandle: "",
    shopDescription: "",
    businessType: "individual",
    panNumber: "",
    legalName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleFinalSubmit = async () => {
    setLoading(true); 
    try {
      const res = await fetch("/api/seller/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Industry Practice: Force JWT update so the backend sees the new 'seller' role
        await update({ role: "seller" }); 
        router.push("/dashboard/seller");
      } else {
        const data = await res.json();
        alert(data.error || "Something went wrong during submission");
      }
    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1_Profile formData={formData} setFormData={setFormData} />;
      case 2:
        return <Step2_Verification formData={formData} setFormData={setFormData} />;
      case 3:
        return <Step3_Payouts formData={formData} setFormData={setFormData} />;
      case 4:
        return <Step4_Review formData={formData} setCurrentStep={setCurrentStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
          
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="text-slate-400 hover:text-slate-900">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <p className="text-sm font-bold text-indigo-600">SELLER ONBOARDING</p>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {STEPS.find(s => s.number === currentStep)?.title}
              </h1>
            </div>
          </div>

          <div className="mb-8">
            <Stepper steps={STEPS} currentStep={currentStep} />
          </div>

          {/* 5. FIXED: Tailwind optimized class for min-height */}
          <div className="min-h-62.5"> 
            {renderCurrentStep()}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
            {currentStep > 1 ? (
              <button 
                onClick={handleBack} 
                disabled={loading}
                className="btn-secondary disabled:opacity-50"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length ? (
              <button 
                onClick={handleNext} 
                className="btn-primary"
              >
                Next Step
              </button>
            ) : (
              <button 
                onClick={handleFinalSubmit} 
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Finish & Go to Dashboard"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}