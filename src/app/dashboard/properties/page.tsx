/**
 * PROPERTY PORTFOLIO PAGE — src/app/dashboard/properties/page.tsx
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * Displays a grid of all ILH student housing properties across India.
 * Each property card shows its bed capacity, physical location, and its
 * MOST RECENT audit compliance score.
 *
 * WHY IT MATTERS FOR ILH:
 * This is the geographic and structural view of the company. When an
 * auditor is assigned to inspect a property (e.g., ILH Pune), they use
 * this page to select the property before starting the 'New Audit' flow.
 * 
 * The `total_beds` metric is prominently displayed because compliance
 * difficulty scales with capacity. An 80% score at a 700-bed facility
 * (like Pune) represents significantly more operational effort than an
 * 80% score at a 200-bed facility (like Vizag).
 *
 * FOR DEVELOPERS:
 * - Complex Join Logic: Supabase doesn't easily support "fetch all properties
 *   with ONLY their most recent audit" in a single REST call without custom
 *   RPCs. Therefore, this component fetches ALL completed audits, sorts them
 *   by date descending in memory, and maps the first one found to the
 *   property card.
 * - The 'View Audits' link passes `?property=<id>` to the Audit History
 *   page, instantly applying the filter.
 * ============================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, MapPin, BedDouble, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Property, Audit } from "@/types/database";
import PropertyDetailModal from "@/components/property-detail-modal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Property enriched with the latest completed audit score */
interface PropertyWithLatestScore extends Property {
  latest_score: number | null;
  latest_max_score: number | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Compute score percentage from raw / max values.
 * Returns null when there is no audit data.
 */
function scorePercentage(
  score: number | null,
  max: number | null
): number | null {
  if (score === null || max === null || max === 0) return null;
  return Math.round((score / max) * 100);
}

/**
 * Return Tailwind classes for a score badge (Neumorphic).
 */
function scoreBadgeClasses(pct: number | null): string {
  if (pct === null)
    return "bg-[#E0E5EC] text-slate-500 shadow-neo-raised-sm";
  if (pct >= 80)
    return "bg-[#E0E5EC] text-ilh-green-700 shadow-neo-raised-sm";
  if (pct >= 60)
    return "bg-[#E0E5EC] text-amber-700 shadow-neo-raised-sm";
  return "bg-[#E0E5EC] text-red-700 shadow-neo-raised-sm";
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader for a single property card                        */
/* ------------------------------------------------------------------ */

function PropertyCardSkeleton() {
  return (
    <div className="bg-[#E0E5EC] rounded-2xl shadow-neo-raised p-6 animate-pulse">
      {/* Name */}
      <div className="h-5 w-3/4 bg-[#E0E5EC] rounded shadow-neo-pressed-sm mb-4" />

      {/* Location */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-4 rounded bg-[#E0E5EC] shadow-neo-pressed-sm" />
        <div className="h-4 w-1/2 bg-[#E0E5EC] rounded shadow-neo-pressed-sm" />
      </div>

      {/* Beds */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 rounded bg-[#E0E5EC] shadow-neo-pressed-sm" />
        <div className="h-4 w-1/3 bg-[#E0E5EC] rounded shadow-neo-pressed-sm" />
      </div>

      {/* Score badge */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-16 bg-[#E0E5EC] rounded-full shadow-neo-pressed-sm" />
        <div className="h-4 w-24 bg-[#E0E5EC] rounded shadow-neo-pressed-sm" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyWithLatestScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ── Data Fetching ── */
  useEffect(() => {
    async function fetchProperties() {
      const supabase = createClient();

      // 1. Fetch all properties
      const { data: propertyRows, error: propError } = await supabase
        .from("properties")
        .select("*")
        .order("name");

      if (propError || !propertyRows) {
        console.error("Failed to load properties:", propError);
        setProperties([]);
        setLoading(false);
        return;
      }

      // 2. For every property, find the latest completed audit
      const { data: auditRows, error: auditError } = await supabase
        .from("audits")
        .select("property_id, total_score, max_possible_score, conducted_at")
        .eq("status", "completed")
        .order("conducted_at", { ascending: false });

      // Build a map: property_id → latest audit score
      const latestAuditMap = new Map<
        string,
        { total_score: number; max_possible_score: number }
      >();

      if (!auditError && auditRows) {
        for (const audit of auditRows) {
          // First occurrence per property_id is the latest (ordered desc)
          if (!latestAuditMap.has(audit.property_id)) {
            latestAuditMap.set(audit.property_id, {
              total_score: audit.total_score,
              max_possible_score: audit.max_possible_score,
            });
          }
        }
      }

      // 3. Merge data
      const merged: PropertyWithLatestScore[] = (propertyRows as Property[]).map(
        (prop) => {
          const latest = latestAuditMap.get(prop.id);
          return {
            ...prop,
            latest_score: latest ? latest.total_score : null,
            latest_max_score: latest ? latest.max_possible_score : null,
          };
        }
      );

      setProperties(merged);
      setLoading(false);
    }

    fetchProperties();
  }, []);

  /* ── Loading State ── */
  if (loading) {
    return (
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-700">Properties</h1>
          <p className="mt-1 text-sm text-slate-500">
            All ILH student housing locations
          </p>
        </div>

        {/* 6 skeleton cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Empty State ── */
  if (properties.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-700">Properties</h1>
          <p className="mt-1 text-sm text-slate-500">
            All ILH student housing locations
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#E0E5EC] shadow-neo-pressed py-16 px-6 text-center">
          <Building2 className="h-12 w-12 text-slate-400 mb-4" />
          <h2 className="text-lg font-semibold text-slate-600">
            No properties yet
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            Properties will appear here once they&apos;ve been added to the
            system. Contact an administrator to get started.
          </p>
        </div>
      </div>
    );
  }

  /* ── Property Grid ── */
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-700">Properties</h1>
        <p className="mt-1 text-sm text-slate-500">
          All ILH student housing locations
        </p>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => {
          const pct = scorePercentage(
            property.latest_score,
            property.latest_max_score
          );

          return (
            <div
              key={property.id}
              onClick={() => {
                setSelectedPropertyId(property.id);
                setIsModalOpen(true);
              }}
              className="bg-[#E0E5EC] rounded-2xl shadow-neo-raised p-6 hover:shadow-neo-pressed transition-all duration-300 cursor-pointer animate-scale-in"
            >
              {/* Property Name */}
              <h3 className="text-lg font-bold text-slate-700 mb-3">
                {property.name}
              </h3>

              {/* Location */}
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-500 truncate">
                  {property.location}
                </span>
              </div>

              {/* Bed count */}
              <div className="flex items-center gap-2 mb-5">
                <BedDouble className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-500">
                  {property.total_beds} beds
                </span>
              </div>

              {/* Score badge + View Audits link */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBadgeClasses(pct)}`}
                >
                  {pct !== null ? `${pct}%` : "No audits"}
                </span>

                <Link
                  href={`/dashboard/audits?property=${property.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-ilh-navy-500 hover:text-ilh-navy-700 transition-colors"
                >
                  View Audits
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPropertyId && (
        <PropertyDetailModal
          propertyId={selectedPropertyId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPropertyId(null);
          }}
        />
      )}
    </div>
  );
}
