"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Building2, MapPin, BedDouble, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Property, Audit } from "@/types/database";

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
 * Return Tailwind classes for a score badge based on thresholds:
 *   ≥ 80 → green, ≥ 60 → amber, < 60 → red, no data → gray
 */
function scoreBadgeClasses(pct: number | null): string {
  if (pct === null)
    return "bg-gray-100 text-gray-500";
  if (pct >= 80)
    return "bg-ilh-green-50 text-ilh-green-700";
  if (pct >= 60)
    return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader for a single property card                        */
/* ------------------------------------------------------------------ */

function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
      {/* Name */}
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-4" />

      {/* Location */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-4 rounded bg-gray-200" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </div>

      {/* Beds */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 rounded bg-gray-200" />
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
      </div>

      {/* Score badge */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
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
          <h1 className="text-2xl font-bold text-ilh-navy-700">Properties</h1>
          <p className="mt-1 text-sm text-gray-500">
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
          <h1 className="text-2xl font-bold text-ilh-navy-700">Properties</h1>
          <p className="mt-1 text-sm text-gray-500">
            All ILH student housing locations
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 px-6 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700">
            No properties yet
          </h2>
          <p className="mt-1 text-sm text-gray-500 max-w-sm">
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
        <h1 className="text-2xl font-bold text-ilh-navy-700">Properties</h1>
        <p className="mt-1 text-sm text-gray-500">
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
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* Property Name */}
              <h3 className="text-lg font-bold text-ilh-navy-700 mb-3">
                {property.name}
              </h3>

              {/* Location */}
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 truncate">
                  {property.location}
                </span>
              </div>

              {/* Bed count */}
              <div className="flex items-center gap-2 mb-5">
                <BedDouble className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">
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
    </div>
  );
}
