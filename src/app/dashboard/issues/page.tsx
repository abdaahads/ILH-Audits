/**
 * CORRECTIVE ACTION PLAN (CAP) BOARD — src/app/dashboard/issues/page.tsx
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This is the operational nerve center for ILH. When an auditor scores
 * a compliance checkpoint as 2 or lower (out of 5), the system automatically
 * generates a Corrective Action Plan (CAP) ticket. This page displays those
 * tickets, allowing the Operations Team to track them from 'Open' to 'Resolved'.
 *
 * WHY IT MATTERS FOR ILH:
 * Audits are useless if issues aren't fixed. This page closes the loop.
 * For the Founder/CEO, a high number of 'Open' CAPs indicates that the
 * operations team is failing to execute on the auditor's findings.
 * 
 * BUSINESS WORKFLOW:
 *   1. Auto-Generation: Auditor submits failing score -> CAP created automatically.
 *   2. Assignment/Action: Ops Manager sees the issue here, dispatches vendor/staff.
 *   3. Update: Ops Manager updates status to 'In Progress' and adds notes.
 *   4. Resolution: Once fixed, status is changed to 'Resolved'.
 *
 * FOR DEVELOPERS:
 * - Data Mapping: CAPs in the DB only store UUIDs. This component fetches the
 *   related Properties, Questions, and Auditor Profiles to map those UUIDs
 *   into human-readable names for the UI (`CombinedActionItem`).
 * - State Management: Editing state is tracked locally (`editingStatuses`,
 *   `editingNotes`) to allow users to modify dropdowns/textareas before
 *   hitting "Save Changes". The Save button is disabled unless a change
 *   is detected.
 * ============================================================
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Building,
  User,
  Save,
  Loader2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { CorrectiveAction, Property, Profile } from "@/types/database";
import AuditDetailModal from "@/components/audit-detail-modal";

interface CombinedActionItem extends CorrectiveAction {
  propertyName: string;
  questionText: string;
  auditorName: string;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<CombinedActionItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [auditors, setAuditors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Audit for details view
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Editing state
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [editingStatuses, setEditingStatuses] = useState<Record<string, 'open' | 'in_progress' | 'resolved'>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Fetch corrective actions
      const { data: actionsData, error: actionsErr } = await supabase
        .from("corrective_actions")
        .select("*")
        .order("created_at", { ascending: false });

      if (actionsErr) {
        console.error("Error loading corrective actions:", actionsErr);
        toast.error("Failed to load corrective actions");
        setLoading(false);
        return;
      }

      // 2. Fetch properties for dropdown/mapping
      const { data: propsData } = await supabase
        .from("properties")
        .select("*")
        .order("name");

      setProperties(propsData || []);

      // 3. Fetch auditors for lookup
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      setAuditors(profilesData || []);

      if (actionsData && actionsData.length > 0) {
        // Fetch all questions & audits to map names
        const questionIds = [...new Set(actionsData.map((a) => a.question_id))];
        const auditIds = [...new Set(actionsData.map((a) => a.audit_id))];

        const [{ data: questions }, { data: audits }] = await Promise.all([
          supabase.from("audit_questions").select("id, question_text").in("id", questionIds),
          supabase.from("audits").select("id, auditor_id").in("id", auditIds),
        ]);

        const qMap = new Map((questions || []).map((q) => [q.id, q.question_text]));
        const auditAuditorMap = new Map((audits || []).map((a) => [a.id, a.auditor_id]));
        const pMap = new Map((propsData || []).map((p) => [p.id, p.name]));
        const uMap = new Map((profilesData || []).map((u) => [u.id, u.full_name]));

        const combined: CombinedActionItem[] = actionsData.map((a) => {
          const auditorId = auditAuditorMap.get(a.audit_id);
          return {
            ...a,
            propertyName: pMap.get(a.property_id) || "Unknown Property",
            questionText: qMap.get(a.question_id) || "Quality checkpoint",
            auditorName: auditorId ? (uMap.get(auditorId) || "System") : "System",
          };
        });

        setIssues(combined);

        // Prepopulate editing states
        const initialNotes: Record<string, string> = {};
        const initialStatuses: Record<string, 'open' | 'in_progress' | 'resolved'> = {};
        combined.forEach((item) => {
          initialNotes[item.id] = item.remediation_notes || "";
          initialStatuses[item.id] = item.status;
        });
        setEditingNotes(initialNotes);
        setEditingStatuses(initialStatuses);
      } else {
        setIssues([]);
      }
    } catch (error) {
      console.error("General CAP fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateIssue = async (id: string) => {
    setSavingId(id);
    const supabase = createClient();

    const newStatus = editingStatuses[id];
    const newNotes = editingNotes[id];

    try {
      const { error } = await supabase
        .from("corrective_actions")
        .update({
          status: newStatus,
          remediation_notes: newNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("CAP item updated successfully");
      
      // Update local issue state
      setIssues((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: newStatus, remediation_notes: newNotes }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating issue:", error);
      toast.error("Failed to update corrective action");
    } finally {
      setSavingId(null);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (propertyFilter !== "all" && issue.property_id !== propertyFilter) return false;
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return (
          <Badge className="bg-ilh-green-50 text-ilh-green-700 border-ilh-green-200 border uppercase text-[10px] font-extrabold px-2.5 py-0.5">
            <CheckCircle2 className="h-3 w-3 mr-1 text-ilh-green-500 inline-block" />
            Resolved
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 border uppercase text-[10px] font-extrabold px-2.5 py-0.5">
            <Clock className="h-3 w-3 mr-1 text-amber-500 inline-block animate-spin-slow" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 border uppercase text-[10px] font-extrabold px-2.5 py-0.5">
            <AlertTriangle className="h-3 w-3 mr-1 text-red-500 inline-block" />
            Open / Pending
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-7 w-7 text-red-500" />
          <h1 className="text-3xl font-bold text-ilh-navy-700">Corrective Action Plan (CAP)</h1>
        </div>
        <p className="mt-1 text-gray-500">
          Centralized tracker to monitor, assign, and resolve property compliance issues.
        </p>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <Filter className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-500">Filters:</span>

        <Select value={propertyFilter} onValueChange={(val) => { if (val) setPropertyFilter(val); }}>
          <SelectTrigger className="w-[200px] h-9 text-sm rounded-xl">
            <SelectValue placeholder="All Properties">
              {propertyFilter === "all"
                ? "All Properties"
                : (properties.find((p) => p.id === propertyFilter)?.name || "All Properties")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
          <SelectTrigger className="w-[160px] h-9 text-sm rounded-xl">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open / Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        {(propertyFilter !== "all" || statusFilter !== "all") && (
          <Badge variant="secondary" className="text-xs">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* ── Issue Cards ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white border rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-ilh-navy-400" />
          <p className="text-sm text-slate-500">Loading corrective action items...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed rounded-2xl text-center px-4">
          <CheckCircle2 className="h-12 w-12 text-ilh-green-500 mb-4 animate-bounce" />
          <h2 className="text-lg font-bold text-slate-700">All Systems Clear!</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            No compliance issues found in the system. Properties are meeting the high quality standards of Ivy League House!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredIssues.map((issue) => {
            const hasChanged = 
              editingStatuses[issue.id] !== issue.status || 
              editingNotes[issue.id] !== (issue.remediation_notes || "");
            
            return (
              <div
                key={issue.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:grid md:grid-cols-12 gap-0 group hover:shadow-md transition-all duration-200"
              >
                {/* Visual Status Indicator Col */}
                <div className="md:col-span-8 p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-slate-400" />
                        <h3 className="text-base font-extrabold text-ilh-navy-700">
                          {issue.propertyName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold">
                        Logged on {formatDate(issue.created_at)} · Auditor: {issue.auditorName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(issue.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-ilh-navy-400 hover:bg-slate-100 rounded-lg"
                        onClick={() => {
                          setSelectedAuditId(issue.audit_id);
                          setIsDetailOpen(true);
                        }}
                        title="View Full Source Audit"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-red-50/50 border border-red-100/50 rounded-xl p-4 text-sm text-slate-700">
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                      <div>
                        <strong className="text-xs text-red-700 uppercase tracking-wider block mb-1">Audit Failure Alert</strong>
                        {issue.issue_description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operations Updates Col */}
                <div className="md:col-span-4 bg-slate-50 p-6 border-t md:border-t-0 md:border-l border-slate-100 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Remediation Status
                      </label>
                      <Select
                        value={editingStatuses[issue.id] || "open"}
                        onValueChange={(val) => {
                          if (val) {
                            setEditingStatuses((prev) => ({
                              ...prev,
                              [issue.id]: val as 'open' | 'in_progress' | 'resolved',
                            }));
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-white h-9 text-xs rounded-xl">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open / Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Remediation Notes
                      </label>
                      <Textarea
                        placeholder="Attach remediation actions, repair orders, dates, or resolution details..."
                        value={editingNotes[issue.id] || ""}
                        onChange={(e) =>
                          setEditingNotes((prev) => ({
                            ...prev,
                            [issue.id]: e.target.value,
                          }))
                        }
                        className="bg-white resize-none text-xs rounded-xl h-20"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleUpdateIssue(issue.id)}
                    disabled={!hasChanged || savingId === issue.id}
                    className={`w-full h-9 text-xs font-bold rounded-xl transition-all ${
                      hasChanged
                        ? "bg-ilh-navy-500 hover:bg-ilh-navy-600 text-white shadow-md shadow-ilh-navy-500/10"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {savingId === issue.id ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Saving Updates
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 mr-1" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Audit Source Details Modal ── */}
      {selectedAuditId && (
        <AuditDetailModal
          auditId={selectedAuditId}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedAuditId(null);
          }}
        />
      )}
      
      {/* Dynamic animations injection */}
      <style jsx global>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
