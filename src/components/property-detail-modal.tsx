"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Building,
  MapPin,
  BedDouble,
  Activity,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AuditDetailModal from "./audit-detail-modal";

interface PropertyDetailModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface HistoricalAudit {
  id: string;
  totalScore: number;
  conductedAt: string;
  auditorName: string;
}

interface CategoryAvg {
  name: string;
  score: number;
  max: number;
  percentage: number;
}

interface OpenIssue {
  id: string;
  issueDescription: string;
  status: string;
  createdAt: string;
}

export default function PropertyDetailModal({
  propertyId,
  isOpen,
  onClose,
}: PropertyDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<{ name: string; location: string; beds: number } | null>(null);
  const [history, setHistory] = useState<HistoricalAudit[]>([]);
  const [categoryAvgs, setCategoryAvgs] = useState<CategoryAvg[]>([]);
  const [openIssues, setOpenIssues] = useState<OpenIssue[]>([]);
  
  // Details Modal
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [isAuditDetailOpen, setIsAuditDetailOpen] = useState(false);

  const fetchPropertyDeepData = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Fetch property metadata
      const { data: propData, error: propErr } = await supabase
        .from("properties")
        .select("name, location, total_beds")
        .eq("id", propertyId)
        .single();

      if (propErr || !propData) {
        console.error("Error fetching property info:", propErr);
        setLoading(false);
        return;
      }

      setProperty({
        name: propData.name,
        location: propData.location,
        beds: propData.total_beds,
      });

      // 2. Fetch completed audits history (limit 15 for sparkline/history)
      const { data: auditsData } = await supabase
        .from("audits")
        .select("id, total_score, conducted_at, auditor_id")
        .eq("property_id", propertyId)
        .eq("status", "completed")
        .order("conducted_at", { ascending: false });

      const auditList = auditsData || [];

      // Fetch auditor names for the audit history list
      if (auditList.length > 0) {
        const auditorIds = [...new Set(auditList.map((a) => a.auditor_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", auditorIds);

        const auditorMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));

        setHistory(
          auditList.map((a) => ({
            id: a.id,
            totalScore: Number(a.total_score),
            conductedAt: a.conducted_at,
            auditorName: auditorMap.get(a.auditor_id) || "Inspector",
          }))
        );

        // 3. Compute Category Averages
        // Fetch all audit responses for all completed audits of this property
        const auditIds = auditList.map((a) => a.id);
        const { data: responses } = await supabase
          .from("audit_responses")
          .select("question_id, score_awarded")
          .in("audit_id", auditIds);

        if (responses && responses.length > 0) {
          const uniqueQuestionIds = [...new Set(responses.map((r) => r.question_id))];
          
          const [{ data: questions }, { data: categories }] = await Promise.all([
            supabase.from("audit_questions").select("id, category_id, max_points").in("id", uniqueQuestionIds),
            supabase.from("audit_categories").select("id, name"),
          ]);

          const qMap = new Map((questions || []).map((q) => [q.id, q]));
          const catMap = new Map((categories || []).map((c) => [c.id, c.name]));

          // Accumulate scores per category
          const catScores: Record<string, { scored: number; max: number }> = {};
          
          responses.forEach((resp) => {
            const q = qMap.get(resp.question_id);
            if (q) {
              const catName = catMap.get(q.category_id) || "Other";
              const current = catScores[catName] || { scored: 0, max: 0 };
              catScores[catName] = {
                scored: current.scored + resp.score_awarded,
                max: current.max + q.max_points,
              };
            }
          });

          setCategoryAvgs(
            Object.entries(catScores).map(([name, scores]) => ({
              name,
              score: scores.scored,
              max: scores.max,
              percentage: scores.max > 0 ? (scores.scored / scores.max) * 100 : 0,
            }))
          );
        } else {
          setCategoryAvgs([]);
        }
      } else {
        setHistory([]);
        setCategoryAvgs([]);
      }

      // 4. Fetch open/pending corrective actions (CAP)
      const { data: issuesData } = await supabase
        .from("corrective_actions")
        .select("id, issue_description, status, created_at")
        .eq("property_id", propertyId)
        .neq("status", "resolved")
        .order("created_at", { ascending: false });

      setOpenIssues(
        (issuesData || []).map((i) => ({
          id: i.id,
          issueDescription: i.issue_description,
          status: i.status,
          createdAt: i.created_at,
        }))
      );

    } catch (error) {
      console.error("Error fetching property health profiles:", error);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (isOpen) {
      fetchPropertyDeepData();
    }
  }, [isOpen, fetchPropertyDeepData]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Sparkline generator
  const renderSparkline = () => {
    if (history.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-28 border border-slate-150 border-dashed rounded-xl bg-slate-50 text-xs text-slate-400 font-semibold p-4">
          <Activity className="h-6 w-6 text-slate-300 mb-1" />
          More audits required to compute trend sparkline.
        </div>
      );
    }

    // Sort chronologically (oldest to newest)
    const sortedHistory = [...history].reverse();
    const scores = sortedHistory.map((h) => h.totalScore);
    const width = 500;
    const height = 100;
    const padding = 10;

    const minScore = 0; // standard base
    const maxScore = 100; // standard cap

    const points = scores.map((score, index) => {
      const x = padding + (index / (scores.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((score - minScore) / (maxScore - minScore)) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(" ");

    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-ilh-green-500" />
            Compliance Performance Trend
          </span>
          <span>Last {scores.length} Audits</span>
        </div>
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
            {/* Grid Line 80% (Excellent threshold) */}
            <line 
              x1="0" 
              y1={height - padding - 0.8 * (height - 2 * padding)} 
              x2={width} 
              y2={height - padding - 0.8 * (height - 2 * padding)} 
              stroke="#def2e6" 
              strokeWidth="1.5" 
              strokeDasharray="4,4" 
            />
            {/* Grid Line 60% (Warning threshold) */}
            <line 
              x1="0" 
              y1={height - padding - 0.6 * (height - 2 * padding)} 
              x2={width} 
              y2={height - padding - 0.6 * (height - 2 * padding)} 
              stroke="#fef3c7" 
              strokeWidth="1.5" 
              strokeDasharray="4,4" 
            />

            {/* Path */}
            <polyline
              fill="none"
              stroke="#003366"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Circles for points */}
            {scores.map((score, idx) => {
              const x = padding + (idx / (scores.length - 1)) * (width - 2 * padding);
              const y = height - padding - ((score - minScore) / (maxScore - minScore)) * (height - 2 * padding);
              return (
                <g key={idx} className="group">
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill={score >= 80 ? "#339966" : score >= 60 ? "#f59e0b" : "#ef4444"}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:r-7 transition-all cursor-pointer shadow"
                  />
                  <title>{`Audit score: ${score.toFixed(1)}%`}</title>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase pt-1">
          <span>{formatDate(sortedHistory[0].conductedAt)} ({sortedHistory[0].totalScore.toFixed(0)}%)</span>
          <span>{formatDate(sortedHistory[sortedHistory.length - 1].conductedAt)} ({sortedHistory[sortedHistory.length - 1].totalScore.toFixed(0)}%)</span>
        </div>
      </div>
    );
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "bg-ilh-green-500";
    if (pct >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-0 sm:p-4">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-[90vh] max-w-4xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-ilh-navy-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{property?.name || "Property Profile"}</h2>
              <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {property?.location}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-ilh-navy-500" />
              <p className="text-sm text-slate-500">Generating property profile...</p>
            </div>
          ) : property ? (
            <>
              {/* Quick Info & Beds */}
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <BedDouble className="h-4 w-4 text-slate-400" />
                  Capacity: <strong>{property.beds} Student Beds</strong>
                </span>
                <span className="h-3 w-px bg-slate-200" />
                <span>
                  Inspection Logs: <strong>{history.length} Audits Completed</strong>
                </span>
                <span className="h-3 w-px bg-slate-200" />
                <span>
                  Outstanding Issues: <strong>{openIssues.length} Pending Actions</strong>
                </span>
              </div>

              {/* Sparkline & Categories Row */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* SVG Performance Sparkline */}
                {renderSparkline()}

                {/* Categories Average breakdown */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-ilh-navy-500" />
                    Operational Department Ratings
                  </h3>
                  
                  {categoryAvgs.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No department data compiled yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryAvgs.map((cat) => (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-semibold text-ilh-navy-700">
                            <span>{cat.name}</span>
                            <span className="text-slate-500 font-bold">{cat.percentage.toFixed(0)}%</span>
                          </div>
                          <Progress value={cat.percentage} className="h-2" indicatorClassName={getPercentageColor(cat.percentage)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Action Items & Audit Logs row */}
              <div className="grid gap-6 md:grid-cols-2">
                
                {/* Outstanding CAP Issues */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Pending Action Items ({openIssues.length})
                  </h3>

                  {openIssues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 border border-dashed rounded-xl p-4">
                      <CheckCircle2 className="h-8 w-8 text-ilh-green-500 mb-1" />
                      <p className="text-xs font-bold text-slate-600">No Pending Actions</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Property is fully compliant and clear.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {openIssues.map((issue) => (
                        <div key={issue.id} className="p-3 bg-red-50/50 border border-red-100/50 rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <Badge className="bg-red-100 text-red-700 border-none uppercase text-[8px] font-bold px-2">
                              {issue.status}
                            </Badge>
                            <span className="text-[9px] text-slate-400 font-semibold">{formatDate(issue.createdAt)}</span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium line-clamp-2">
                            {issue.issueDescription}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audit Logs */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
                    <ClipboardCheck className="h-4 w-4 text-ilh-green-500" />
                    Audit Logs History
                  </h3>

                  {history.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No inspection audits logged yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {history.map((audit) => (
                        <div
                          key={audit.id}
                          onClick={() => {
                            setSelectedAuditId(audit.id);
                            setIsAuditDetailOpen(true);
                          }}
                          className="flex items-center justify-between p-3 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-ilh-navy-700">
                              Inspection Log
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {formatDate(audit.conductedAt)} · By {audit.auditorName}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex h-6 w-12 items-center justify-center rounded-full text-xs font-bold ${
                              audit.totalScore >= 80 
                                ? "bg-ilh-green-50 text-ilh-green-700 border-ilh-green-200 border" 
                                : audit.totalScore >= 60 
                                  ? "bg-amber-50 text-amber-700 border-amber-200 border" 
                                  : "bg-red-50 text-red-700 border-red-200 border"
                            }`}>
                              {audit.totalScore.toFixed(0)}%
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Property data could not be loaded. Please try again.
            </div>
          )}
        </div>
      </div>

      {/* ── Source Audit Details Modal ── */}
      {selectedAuditId && (
        <AuditDetailModal
          auditId={selectedAuditId}
          isOpen={isAuditDetailOpen}
          onClose={() => {
            setIsAuditDetailOpen(false);
            setSelectedAuditId(null);
          }}
        />
      )}
    </div>
  );
}
