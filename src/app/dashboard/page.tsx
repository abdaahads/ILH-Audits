/**
 * FOUNDER ANALYTICS DASHBOARD — src/app/dashboard/page.tsx
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This is the landing page after authentication. It provides a high-level,
 * data-driven overview of the entire ILH portfolio's compliance health.
 *
 * WHY IT MATTERS FOR ILH (THE EXECUTIVE VIEW):
 * While field auditors care about individual questions and Operations
 * Managers care about CAP tickets, the Founder and Executive Team care
 * about MACRO trends. This dashboard answers their core questions:
 *
 *   1. "How are we doing overall?" (Top 4 Stat Cards: Avg Score, Total Audits)
 *   2. "Which property is our flagship standard?" (Leaderboard #1)
 *   3. "Which property is putting us at legal/safety risk?" (Portfolio Chart)
 *
 * THE COMPLIANCE PERFORMANCE CHART:
 * The bar chart visually maps the health of all 9 properties. It intentionally
 * uses a strict traffic-light color system:
 *   - Green (≥80%): Excellent.
 *   - Amber (60-79%): Warning.
 *   - Red (<60%): Risk / CAP required immediately.
 * A founder can glance at this chart and instantly know if they need to
 * call the ILH Delhi manager to discuss a failing score.
 *
 * FOR DEVELOPERS:
 * - Data fetching is heavily parallelized using `Promise.all` to ensure
 *   the page loads quickly.
 * - The leaderboard manually aggregates scores by fetching all audits
 *   and computing the average per property in memory. (In a massive DB,
 *   this would be moved to a Postgres materialized view, but for 9
 *   properties, client-side aggregation is perfectly fast).
 * ============================================================
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  ClipboardCheck,
  TrendingUp,
  Users,
  Trophy,
  Clock,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AuditDetailModal from "@/components/audit-detail-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ── Interfaces ── */
interface Stats {
  totalProperties: number;
  totalAudits: number;
  avgScore: number;
  activeAuditors: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  location: string;
  avg_score: number;
  audit_count: number;
}

interface RecentAudit {
  id: string;
  property_name: string;
  auditor_name: string;
  total_score: number;
  status: string;
  conducted_at: string;
}

/* ── Stat Card Component ── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow animate-slide-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-ilh-navy-700">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Score Badge ── */
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-ilh-green-50 text-ilh-green-700 border-ilh-green-200"
      : score >= 60
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score.toFixed(1)}%
    </span>
  );
}

/* ── Medal Icon ── */
function MedalIcon({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-amber-400 text-amber-900",
    2: "bg-gray-300 text-gray-700",
    3: "bg-amber-700 text-amber-100",
  };

  if (rank <= 3) {
    return (
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${colors[rank]}`}
      >
        {rank}
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
      {rank}
    </span>
  );
}

/* ── Skeleton Loader ── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gray-100 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard Page ── */
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    totalAudits: 0,
    avgScore: 0,
    activeAuditors: 0,
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    try {
      /* Fetch stats */
      const [propsRes, auditsRes, profilesRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact" }),
        supabase.from("audits").select("id, total_score, auditor_id").eq("status", "completed"),
        supabase.from("profiles").select("id").eq("role", "auditor"),
      ]);

      const totalProperties = propsRes.count || 0;
      const completedAudits = auditsRes.data || [];
      const totalAudits = completedAudits.length;
      const avgScore =
        totalAudits > 0
          ? completedAudits.reduce((sum, a) => sum + Number(a.total_score), 0) / totalAudits
          : 0;
      const activeAuditors = new Set(completedAudits.map((a) => a.auditor_id)).size ||
        profilesRes.data?.length || 0;

      setStats({ totalProperties, totalAudits, avgScore, activeAuditors });

      /* Fetch leaderboard — all properties with their avg audit score */
      const { data: properties } = await supabase
        .from("properties")
        .select("id, name, location");

      if (properties && properties.length > 0) {
        const { data: allAudits } = await supabase
          .from("audits")
          .select("property_id, total_score")
          .eq("status", "completed");

        const propScores: LeaderboardEntry[] = properties.map((p) => {
          const propAudits = (allAudits || []).filter((a) => a.property_id === p.id);
          const avg =
            propAudits.length > 0
              ? propAudits.reduce((sum, a) => sum + Number(a.total_score), 0) / propAudits.length
              : 0;
          return {
            id: p.id,
            name: p.name,
            location: p.location,
            avg_score: avg,
            audit_count: propAudits.length,
          };
        });

        propScores.sort((a, b) => b.avg_score - a.avg_score);
        setLeaderboard(propScores);
      }

      /* Fetch recent audits */
      const { data: recent } = await supabase
        .from("audits")
        .select("id, total_score, status, conducted_at, property_id, auditor_id")
        .order("conducted_at", { ascending: false })
        .limit(10);

      if (recent && recent.length > 0) {
        const propertyIds = [...new Set(recent.map((a) => a.property_id))];
        const auditorIds = [...new Set(recent.map((a) => a.auditor_id))];

        const [{ data: propNames }, { data: auditorNames }] = await Promise.all([
          supabase.from("properties").select("id, name").in("id", propertyIds),
          supabase.from("profiles").select("id, full_name").in("id", auditorIds),
        ]);

        const propMap = new Map((propNames || []).map((p) => [p.id, p.name]));
        const auditorMap = new Map((auditorNames || []).map((a) => [a.id, a.full_name]));

        setRecentAudits(
          recent.map((a) => ({
            id: a.id,
            property_name: propMap.get(a.property_id) || "Unknown",
            auditor_name: auditorMap.get(a.auditor_id) || "Unknown",
            total_score: Number(a.total_score),
            status: a.status,
            conducted_at: a.conducted_at,
          }))
        );
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Format date for display */
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-ilh-navy-700">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Welcome back. Here&apos;s your audit overview.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Building2}
            label="Total Properties"
            value={stats.totalProperties}
            color="bg-ilh-navy-500"
            delay={0}
          />
          <StatCard
            icon={ClipboardCheck}
            label="Total Audits"
            value={stats.totalAudits}
            color="bg-ilh-green-500"
            delay={100}
          />
          <StatCard
            icon={TrendingUp}
            label="Average Score"
            value={`${stats.avgScore.toFixed(1)}%`}
            color="bg-ilh-navy-300"
            delay={200}
          />
          <StatCard
            icon={Users}
            label="Active Auditors"
            value={stats.activeAuditors}
            color="bg-ilh-green-700"
            delay={300}
          />
        </div>
      )}

      {/* ── Visual Analytics Section (Founder Overview) ── */}
      {!loading && leaderboard.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up opacity-0"
          style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-ilh-navy-500" />
            <h2 className="text-lg font-bold text-ilh-navy-700">Portfolio Compliance Performance Chart</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-48 gap-3 pt-6 px-4 border-b border-slate-100 overflow-x-auto">
              {leaderboard.map((prop) => {
                const heightPercent = `${Math.max(10, prop.avg_score)}%`;
                const color = prop.avg_score >= 80 
                  ? "bg-ilh-green-500 hover:bg-ilh-green-600" 
                  : prop.avg_score >= 60 
                    ? "bg-amber-400 hover:bg-amber-500" 
                    : "bg-red-500 hover:bg-red-600";
                
                return (
                  <div key={prop.id} className="flex flex-col items-center flex-1 min-w-[50px] group cursor-pointer justify-end">
                    <div className="relative w-full flex justify-center items-end h-32 mb-2">
                      {/* Bar tooltip */}
                      <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-ilh-navy-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md z-10 font-mono">
                        {prop.avg_score.toFixed(1)}%
                      </span>
                      {/* Bar */}
                      <div 
                        style={{ height: heightPercent }}
                        className={`w-8 sm:w-10 rounded-t-lg transition-all duration-500 shadow-sm ${color}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-full mt-2 text-center select-none group-hover:text-ilh-navy-700">
                      {prop.name.replace("ILH ", "")}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ilh-green-500" />Excellent (&ge;80%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Satisfactory (60%-79%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Risk / CAP (&lt;60%)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Leaderboard + Recent Audits ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up opacity-0"
          style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-ilh-navy-700">
              Property Leaderboard
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-gray-100 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-50 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No audit data yet. Complete an audit to see rankings.
            </p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors"
                >
                  <MedalIcon rank={idx + 1} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ilh-navy-700 truncate">
                      {entry.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{entry.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20">
                      <Progress
                        value={entry.avg_score}
                        className="h-2"
                      />
                    </div>
                    <ScoreBadge score={entry.avg_score} />
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {entry.audit_count} audits
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audits */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up opacity-0"
          style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-ilh-navy-400" />
            <h2 className="text-lg font-bold text-ilh-navy-700">
              Recent Audits
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
              ))}
            </div>
          ) : recentAudits.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No audits completed yet. Start your first audit!
            </p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Property</TableHead>
                    <TableHead className="text-xs">Auditor</TableHead>
                    <TableHead className="text-xs">Score</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAudits.map((audit) => (
                    <TableRow 
                      key={audit.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedAuditId(audit.id);
                        setIsDetailOpen(true);
                      }}
                    >
                      <TableCell className="text-sm font-medium text-ilh-navy-700">
                        {audit.property_name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {audit.auditor_name}
                      </TableCell>
                      <TableCell>
                        <ScoreBadge score={audit.total_score} />
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {formatDate(audit.conducted_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
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
