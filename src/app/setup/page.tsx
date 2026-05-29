"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ArrowRight,
  Clipboard,
  Check,
  Server,
  Key,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    toast.success("Template copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    setChecking(true);
    toast.info("Verifying keys...");
    setTimeout(() => {
      setChecking(false);
      // Hard refresh to re-trigger middleware verification
      window.location.href = "/dashboard";
    }, 1500);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 bg-slate-900 font-sans">
      
      {/* Animated visual background mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003366]/40 via-[#001122] to-black" />
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#003366]/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#339966]/10 blur-[140px]" />
      </div>

      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl space-y-6 animate-scale-in">
          
          {/* Logo Area */}
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              src="https://ivyleaguehouse.com/wp-content/uploads/2024/05/ILH-Logo.png"
              alt="ILH Logo"
              className="h-14 w-auto object-contain drop-shadow"
            />
            <h1 className="text-xl font-bold text-white tracking-wide mt-2">
              Setup Your Supabase Environment
            </h1>
            <p className="text-xs text-white/50 max-w-md">
              To launch the property audits system, you need to link your local instance with a Supabase back-end.
            </p>
          </div>

          <hr className="border-white/10" />

          {/* Guide Steps */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#339966] uppercase tracking-widest flex items-center gap-2">
              <Settings className="h-4 w-4" /> Onboarding Instructions
            </h3>

            <div className="space-y-3.5 text-xs text-white/80">
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#003366] text-[10px] font-bold text-white">
                  1
                </span>
                <p>
                  Create a new file named <code className="font-mono text-[#339966] bg-white/5 px-1.5 py-0.5 rounded border border-white/10">.env.local</code> in the root folder of your project.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#003366] text-[10px] font-bold text-white">
                  2
                </span>
                <div className="space-y-2 flex-1">
                  <p>Copy and paste the template variables below into that file:</p>
                  <div className="relative">
                    <pre className="bg-black/40 border border-white/10 rounded-xl p-3.5 font-mono text-[10px] text-white/70 overflow-x-auto leading-relaxed select-all">
                      {envTemplate}
                    </pre>
                    <button
                      onClick={handleCopy}
                      className="absolute right-3 top-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Copy template"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-ilh-green-400" /> : <Clipboard className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#003366] text-[10px] font-bold text-white">
                  3
                </span>
                <p>
                  Retrieve your real keys from the <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer" className="text-[#339966] hover:underline font-bold inline-flex items-center gap-0.5">Supabase Dashboard <RefreshCw className="h-3 w-3 inline" /></a> and insert them into the variables.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Action Button */}
          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              disabled={checking}
              className="w-full h-11 bg-[#339966] hover:bg-[#2d8559] text-white font-bold rounded-xl shadow-lg shadow-[#339966]/10 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-transform"
            >
              {checking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verifying Configuration...
                </>
              ) : (
                <>
                  <span>Verify and Refresh</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <p className="text-center text-[10px] text-white/30">
              Note: You must restart the development server (<code className="font-mono bg-white/5 px-1 rounded">npm run dev</code>) after adding the .env.local file.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
