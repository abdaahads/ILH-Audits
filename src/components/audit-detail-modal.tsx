"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Calendar,
  Building,
  User,
  CheckCircle,
  AlertTriangle,
  Camera,
  Printer,
  Loader2,
  Download,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AuditDetailModalProps {
  auditId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface QuestionResponseDetail {
  questionId: string;
  questionText: string;
  maxPoints: number;
  scoreAwarded: number;
  notes: string | null;
  imageUrl: string | null;
  categoryName: string;
  categoryWeight: number;
}

interface AuditFullDetails {
  id: string;
  propertyName: string;
  propertyLocation: string;
  auditorName: string;
  totalScore: number;
  conductedAt: string;
  status: string;
  responses: QuestionResponseDetail[];
}

export default function AuditDetailModal({
  auditId,
  isOpen,
  onClose,
}: AuditDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<AuditFullDetails | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchAuditDetails = useCallback(async () => {
    if (!auditId) return;
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Fetch main audit record with property and auditor details
      const { data: auditData, error: auditErr } = await supabase
        .from("audits")
        .select("id, total_score, status, conducted_at, property_id, auditor_id")
        .eq("id", auditId)
        .single();

      if (auditErr || !auditData) {
        console.error("Error fetching audit:", auditErr);
        setLoading(false);
        return;
      }

      // Fetch property and auditor profile
      const [propRes, auditorRes] = await Promise.all([
        supabase.from("properties").select("name, location").eq("id", auditData.property_id).single(),
        supabase.from("profiles").select("full_name").eq("id", auditData.auditor_id).single(),
      ]);

      const propertyName = propRes.data?.name || "Unknown Property";
      const propertyLocation = propRes.data?.location || "Unknown Location";
      const auditorName = auditorRes.data?.full_name || "Unknown Auditor";

      // 2. Fetch all responses for this audit
      const { data: responsesData, error: respErr } = await supabase
        .from("audit_responses")
        .select("question_id, score_awarded, notes, image_url")
        .eq("audit_id", auditId);

      if (respErr) {
        console.error("Error fetching responses:", respErr);
        setLoading(false);
        return;
      }

      // 3. Fetch all questions and categories for the responses to match details
      const questionIds = (responsesData || []).map((r) => r.question_id);
      
      const { data: questionsData } = await supabase
        .from("audit_questions")
        .select("id, question_text, max_points, category_id")
        .in("id", questionIds);

      const categoryIds = [...new Set((questionsData || []).map((q) => q.category_id))];

      const { data: categoriesData } = await supabase
        .from("audit_categories")
        .select("id, name, weight_percentage")
        .in("id", categoryIds);

      // Build maps for efficient lookups
      const qMap = new Map((questionsData || []).map((q) => [q.id, q]));
      const catMap = new Map((categoriesData || []).map((c) => [c.id, c]));

      const responsesDetails: QuestionResponseDetail[] = (responsesData || []).map((r) => {
        const q = qMap.get(r.question_id);
        const cat = q ? catMap.get(q.category_id) : null;

        return {
          questionId: r.question_id,
          questionText: q?.question_text || "Unknown Question",
          maxPoints: q?.max_points || 5,
          scoreAwarded: r.score_awarded,
          notes: r.notes,
          imageUrl: r.image_url,
          categoryName: cat?.name || "Other",
          categoryWeight: cat?.weight_percentage || 0,
        };
      });

      setAudit({
        id: auditData.id,
        propertyName,
        propertyLocation,
        auditorName,
        totalScore: Number(auditData.total_score),
        conductedAt: auditData.conducted_at,
        status: auditData.status,
        responses: responsesDetails,
      });
    } catch (error) {
      console.error("Detailed fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [auditId]);

  useEffect(() => {
    if (isOpen) {
      fetchAuditDetails();
    }
  }, [isOpen, fetchAuditDetails]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group responses by category
  const categoriesMap = new Map<string, QuestionResponseDetail[]>();
  if (audit) {
    audit.responses.forEach((resp) => {
      const list = categoriesMap.get(resp.categoryName) || [];
      list.push(resp);
      categoriesMap.set(resp.categoryName, list);
    });
  }

  const overallScore = audit ? audit.totalScore : 0;
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-ilh-green-600 border-ilh-green-200 bg-ilh-green-50";
    if (score >= 60) return "text-amber-600 border-amber-200 bg-amber-50";
    return "text-red-600 border-red-200 bg-red-50";
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "bg-ilh-green-500";
    if (pct >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const calculateCategoryScore = (items: QuestionResponseDetail[]) => {
    let scored = 0;
    let max = 0;
    items.forEach((item) => {
      scored += item.scoreAwarded;
      max += item.maxPoints;
    });
    return {
      scored,
      max,
      percentage: max > 0 ? (scored / max) * 100 : 0,
    };
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-0 sm:p-4 print:relative print:p-0 print:z-0">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-[90vh] max-w-4xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-slate-100 print:shadow-none print:border-none print:h-auto print:overflow-visible print:rounded-none">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-ilh-navy-700 text-white shrink-0 print:bg-white print:text-black print:border-b print:border-slate-200 print:px-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white print:hidden">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight print:text-2xl">Audit Report</h2>
              {audit && (
                <p className="text-xs text-white/70 mt-0.5 print:text-slate-500">
                  ID: <span className="font-mono">{audit.id.slice(0, 8)}</span> · Conducted on {formatDate(audit.conductedAt)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 h-9 w-9"
              onClick={handlePrint}
              title="Print / Export PDF"
            >
              <Printer className="h-4 w-4" />
            </Button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible print:p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-ilh-navy-500" />
              <p className="text-sm text-slate-500">Fetching audit data...</p>
            </div>
          ) : audit ? (
            <>
              {/* ============================================================
                  PRINT-ONLY HEADER BRANDING
                  ============================================================ */}
              <div className="hidden print:flex items-center justify-between border-b pb-6 mb-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-[#003366]">IVY LEAGUE HOUSE</h1>
                  <p className="text-sm text-slate-500 tracking-wider uppercase mt-1">Property Quality Audit Report</p>
                </div>
                <img
                  src="https://ivyleaguehouse.com/wp-content/uploads/2024/05/ILH-Logo.png"
                  alt="ILH Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>

              {/* High Level Stats Row */}
              <div className="grid gap-6 md:grid-cols-3 print:grid-cols-3">
                {/* Property & Auditor Details */}
                <div className="md:col-span-2 space-y-3 bg-slate-50 rounded-xl p-5 border border-slate-100 print:bg-white print:border-none print:p-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        <Building className="h-3.5 w-3.5" />
                        Property
                      </div>
                      <p className="text-base font-bold text-ilh-navy-700">{audit.propertyName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{audit.propertyLocation}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        <User className="h-3.5 w-3.5" />
                        Auditor
                      </div>
                      <p className="text-base font-bold text-ilh-navy-700">{audit.auditorName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ILH Certified Inspector</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center text-xs text-slate-500 print:border-none print:pt-0">
                    <span>Audit Status: <Badge className="bg-ilh-green-500 text-white border-none text-[10px] uppercase font-bold px-2 py-0.5 ml-1">{audit.status}</Badge></span>
                    <span>Date: <span className="font-semibold text-slate-700">{formatDate(audit.conductedAt)}</span></span>
                  </div>
                </div>

                {/* Score Circular Metric */}
                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-5 border border-slate-100 print:bg-white print:border-none print:p-0">
                  <div className="relative flex items-center justify-center">
                    {/* SVG Circular Progress */}
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke={
                          overallScore >= 80 
                            ? "#339966" 
                            : overallScore >= 60 
                              ? "#f59e0b" 
                              : "#ef4444"
                        }
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={
                          2 * Math.PI * 40 * (1 - overallScore / 100)
                        }
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-ilh-navy-700">
                        {overallScore.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Score
                      </span>
                    </div>
                  </div>
                  <Badge className={`mt-3 uppercase text-[10px] font-extrabold px-3 py-1 border ${getScoreColor(overallScore)}`}>
                    {overallScore >= 80 
                      ? "Excellent" 
                      : overallScore >= 60 
                        ? "Satisfactory" 
                        : "Action Required"}
                  </Badge>
                </div>
              </div>

              {/* Categories Score Breakdown */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 print:border-none print:p-0 print:mt-6">
                <h3 className="text-sm font-bold text-ilh-navy-700 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-ilh-green-500" />
                  Category Score Breakdown
                </h3>
                <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                  {Array.from(categoriesMap.entries()).map(([catName, items]) => {
                    const { scored, max, percentage } = calculateCategoryScore(items);
                    const weight = items[0]?.categoryWeight || 0;
                    return (
                      <div key={catName} className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100/50 print:bg-white print:border-none print:p-0 print:mb-4">
                        <div className="flex justify-between items-center text-xs font-semibold text-ilh-navy-700">
                          <span>{catName}</span>
                          <span className="text-slate-500 font-mono">
                            {scored}/{max} ({percentage.toFixed(0)}%)
                            <span className="text-[10px] text-slate-400 ml-1">
                              wt: {weight}%
                            </span>
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" indicatorClassName={getPercentageColor(percentage)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Question Checklist Details */}
              <div className="space-y-6 print:mt-8">
                <h3 className="text-sm font-bold text-ilh-navy-700 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-ilh-navy-500" />
                  Detailed Checkpoints & Responses
                </h3>
                
                <div className="space-y-8 print:space-y-6">
                  {Array.from(categoriesMap.entries()).map(([catName, items]) => (
                    <div key={catName} className="space-y-3 print:break-inside-avoid">
                      <h4 className="text-xs font-black text-[#003366] bg-[#003366]/5 px-3 py-1.5 rounded-md uppercase tracking-widest border border-[#003366]/10 print:bg-slate-100 print:text-black">
                        {catName}
                      </h4>
                      <div className="divide-y divide-slate-100">
                        {items.map((item, idx) => {
                          const isFailed = item.scoreAwarded <= 2;
                          return (
                            <div key={item.questionId} className="py-4 first:pt-1 last:pb-1 flex flex-col md:flex-row md:items-start gap-4">
                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-start gap-2.5">
                                  <span className="text-xs font-bold text-slate-300 mt-0.5 w-5 shrink-0">
                                    {idx + 1}.
                                  </span>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {item.questionText}
                                  </p>
                                </div>
                                
                                {item.notes && (
                                  <div className="ml-7 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-600 italic">
                                    <strong>Auditor Note:</strong> &ldquo;{item.notes}&rdquo;
                                  </div>
                                )}

                                {isFailed && (
                                  <div className="ml-7 flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    CAP Issue Logged Automatically (Score &le; 2)
                                  </div>
                                )}
                              </div>

                              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0 ml-7 md:ml-0">
                                {/* Score Indicator */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400 font-medium">Score:</span>
                                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                    item.scoreAwarded >= 4 
                                      ? "bg-ilh-green-500 text-white" 
                                      : item.scoreAwarded >= 3 
                                        ? "bg-amber-400 text-white" 
                                        : "bg-red-500 text-white"
                                  }`}>
                                    {item.scoreAwarded}
                                  </span>
                                  <span className="text-xs text-slate-300">/ {item.maxPoints}</span>
                                </div>

                                {/* Attachment Thumb */}
                                {item.imageUrl && (
                                  <div 
                                    className="relative group cursor-zoom-in shrink-0 print:mt-1"
                                    onClick={() => setSelectedImage(item.imageUrl)}
                                  >
                                    <img
                                      src={item.imageUrl}
                                      alt="Evidence"
                                      className="h-10 w-10 rounded-lg object-cover border border-slate-200 group-hover:opacity-80 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-[8px] font-bold print:hidden">
                                      VIEW
                                    </div>
                                    <span className="hidden print:inline-block text-[9px] text-slate-400 ml-2 font-mono">(Photo attached)</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Audit data could not be loaded. Please try again.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          PHOTO LIGHTBOX / FULL SCREEN MODAL
          ============================================================ */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 print:hidden">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white rounded-full bg-white/10 p-2.5 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={selectedImage}
            alt="Evidence full view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl animate-scale-in"
          />
        </div>
      )}

      {/* ============================================================
          PRINT STYLES (INJECTED IN HEAD ONCE DETECTED)
          ============================================================ */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          /* Print only this modal */
          .fixed.inset-0.z-50.flex.items-center.justify-center.overflow-hidden {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            display: block !important;
            z-index: 0 !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          .fixed.inset-0.z-50.flex.items-center.justify-center.overflow-hidden * {
            visibility: visible;
          }
          /* Hide backdrop and lightbox */
          .bg-slate-900\\/60, .z-\\[100\\] {
            display: none !important;
          }
          /* Expand modal card */
          .max-w-4xl {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            height: auto !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }
          .overflow-y-auto {
            overflow: visible !important;
            height: auto !important;
          }
          /* Print optimization spacing */
          .p-6 {
            padding: 0 !important;
          }
          .shrink-0 {
            background-color: transparent !important;
            border-bottom: 2px solid #003366 !important;
            color: black !important;
          }
          .flex.h-10.w-10 {
            display: none !important;
          }
          .divide-y > * {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
