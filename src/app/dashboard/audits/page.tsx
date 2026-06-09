/**
 * AUDIT HISTORY PAGE — src/app/dashboard/audits/page.tsx
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This page acts as the central ledger for all inspections. It displays
 * a sortable, filterable list of all past and ongoing audits across the
 * entire ILH portfolio. Clicking a row opens the detailed Audit Report modal.
 *
 * WHY IT MATTERS FOR ILH:
 * This is the primary accountability tool for the Operations Head.
 * By filtering by property and status, they can quickly answer questions like:
 *   - "Did the site manager at ILH Pune complete their Q3 EHS audit?"
 *   - "Which properties scored below 80% this month?"
 * 
 * SCORE THRESHOLDS (Visual Cues):
 *   - Green (≥80%): Meets ILH Standards. Operations are healthy.
 *   - Amber (60-79%): Warning. Sub-standard compliance, intervention needed.
 *   - Red (<60%): Critical. Immediate escalation to founder required.
 *
 * STATUS DEFINITIONS:
 *   - 'In Progress': The auditor has started the inspection but hasn't
 *     submitted it. (Usually means they lost connection or are taking a break).
 *   - 'Completed': The audit is locked in the database and immutable.
 *
 * FOR DEVELOPERS:
 * - Data fetching happens client-side via `useEffect` using the Supabase
 *   client.
 * - The URL query parameter `?property=<id>` is parsed on mount to
 *   auto-filter the list (e.g., when clicking a property card from the
 *   Properties page).
 * ============================================================
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ClipboardCheck, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import AuditDetailModal from "@/components/audit-detail-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ── Types ── */
interface AuditRow {
  id: string;
  property_id: string;
  property_name: string;
  auditor_name: string;
  total_score: number;
  status: string;
  conducted_at: string;
}

interface PropertyOption {
  id: string;
  name: string;
}

/* ── Score Badge ── */
function ScoreBadge({ score }: { score: number }) {
  const style =
    score >= 80
      ? "bg-ilh-green-50 text-ilh-green-700 border-ilh-green-200"
      : score >= 60
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {score.toFixed(1)}%
    </span>
  );
}

/* ── Status Badge ── */
function StatusBadge({ status }: { status: string }) {
  const style =
    status === "completed"
      ? "bg-ilh-green-50 text-ilh-green-700 border-ilh-green-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  const label = status === "completed" ? "Completed" : "In Progress";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

/* ── Main Page ── */
export default function AuditHistoryPage() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);

  /* Modal state */
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  /* Filters */
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const propId = params.get("property");
      if (propId) {
        setPropertyFilter(propId);
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    try {
      /* Fetch all audits */
      const { data: auditsData } = await supabase
        .from("audits")
        .select("id, property_id, auditor_id, total_score, status, conducted_at")
        .order("conducted_at", { ascending: false });

      /* Fetch properties for filter dropdown and name mapping */
      const { data: propsData } = await supabase
        .from("properties")
        .select("id, name")
        .order("name");

      setProperties(propsData || []);

      if (auditsData && auditsData.length > 0) {
        /* Fetch auditor names */
        const auditorIds = [...new Set(auditsData.map((a) => a.auditor_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", auditorIds);

        const propMap = new Map((propsData || []).map((p) => [p.id, p.name]));
        const auditorMap = new Map(
          (profiles || []).map((p) => [p.id, p.full_name])
        );

        setAudits(
          auditsData.map((a) => ({
            id: a.id,
            property_id: a.property_id,
            property_name: propMap.get(a.property_id) || "Unknown",
            auditor_name: auditorMap.get(a.auditor_id) || "Unknown",
            total_score: Number(a.total_score),
            status: a.status,
            conducted_at: a.conducted_at,
          }))
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Filtered audits */
  const filteredAudits = useMemo(() => {
    return audits.filter((a) => {
      if (propertyFilter !== "all" && a.property_id !== propertyFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [audits, propertyFilter, statusFilter]);

  /** Format date */
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7 text-ilh-navy-500" />
          <h1 className="text-3xl font-bold text-ilh-navy-700">
            Audit History
          </h1>
        </div>
        <p className="mt-1 text-gray-500">
          View all completed and in-progress audits
        </p>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <Filter className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-500">Filters:</span>

        <Select value={propertyFilter} onValueChange={(val) => { if (val) setPropertyFilter(val); }}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
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
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>

        {(propertyFilter !== "all" || statusFilter !== "all") && (
          <Badge variant="secondary" className="text-xs">
            {filteredAudits.length} result{filteredAudits.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardCheck className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No audits found</p>
            <p className="text-gray-300 text-xs mt-1">
              {audits.length > 0
                ? "Try adjusting your filters"
                : "Start your first audit to see records here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.map((audit) => (
                  <TableRow 
                    key={audit.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer animate-fade-in"
                    onClick={() => {
                      setSelectedAuditId(audit.id);
                      setIsDetailOpen(true);
                    }}
                  >
                    <TableCell className="font-medium text-ilh-navy-700">
                      {audit.property_name}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {audit.auditor_name}
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={audit.total_score} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={audit.status} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {formatDate(audit.conducted_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

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
    </div>
  );
}
