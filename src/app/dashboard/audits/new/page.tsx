"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Camera,
  Trash2,
  Loader2,
  ClipboardCheck,
  Building2,
  AlertTriangle,
  User,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuditStore } from "@/store/audit-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type {
  Property,
  AuditCategory,
  AuditQuestion,
  CategoryWithQuestions,
} from "@/types/database";

/* ============================================================
   ILH Fallback Framework (Official EHS & PGHP 16-Parameter Framework)
   ============================================================ */
const ILH_FALLBACK_FRAMEWORK: CategoryWithQuestions[] = [
  {
    id: "c0000000-0000-0000-0000-000000000001",
    template_id: "a0000000-0000-0000-0000-000000000001",
    name: "PGHP & Core Operations",
    weight_percentage: 25,
    sort_order: 1,
    created_at: "",
    questions: [
      { id: "e0000000-0000-0000-0000-000000000001", category_id: "c0000000-0000-0000-0000-000000000001", question_text: "Staff Grooming & Uniform Compliance: Are all on-duty staff wearing clean, standard-issue uniforms with appropriate PPE (gloves, hairnets, safety shoes) as per site SOP?", max_points: 5, sort_order: 1, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000002", category_id: "c0000000-0000-0000-0000-000000000001", question_text: "Food Product Quality vs. Published Menu: Does the daily meal service match the published weekly menu in terms of items, portion size, and presentation quality?", max_points: 5, sort_order: 2, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000003", category_id: "c0000000-0000-0000-0000-000000000001", question_text: "Process Adherence (SOP Compliance): Are cleaning, turn-down, and sanitization SOPs being followed with documented checklists signed off by shift supervisors?", max_points: 5, sort_order: 3, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000004", category_id: "c0000000-0000-0000-0000-000000000001", question_text: "Vendor SLA Adherence: Are all third-party vendor deliverables (laundry, pest control, waste disposal) being tracked against contracted SLAs with documented proof?", max_points: 5, sort_order: 4, created_at: "" }
    ]
  },
  {
    id: "c0000000-0000-0000-0000-000000000002",
    template_id: "a0000000-0000-0000-0000-000000000001",
    name: "EHS Documentation & Legal Compliance",
    weight_percentage: 25,
    sort_order: 2,
    created_at: "",
    questions: [
      { id: "e0000000-0000-0000-0000-000000000005", category_id: "c0000000-0000-0000-0000-000000000002", question_text: "Workmen Compensation & Labour Registration: Are all workers registered under BOCWA Section 44? Is the Workmen Compensation insurance policy current and accessible?", max_points: 5, sort_order: 1, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000006", category_id: "c0000000-0000-0000-0000-000000000002", question_text: "Safety Manual, HIRA & Risk Registers: Is the site Safety Manual available and up-to-date? Are Hazard Identification and Risk Assessment (HIRA) registers maintained with quarterly reviews?", max_points: 5, sort_order: 2, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000007", category_id: "c0000000-0000-0000-0000-000000000002", question_text: "PTW (Permit to Work) Systems: Are Permit to Work systems in place for high-risk activities (hot work, confined space, electrical work)? Are closure checklists completed post-work?", max_points: 5, sort_order: 3, created_at: "" }
    ]
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    template_id: "a0000000-0000-0000-0000-000000000001",
    name: "Mechanical, Electrical & Lift Safety",
    weight_percentage: 20,
    sort_order: 3,
    created_at: "",
    questions: [
      { id: "e0000000-0000-0000-0000-000000000008", category_id: "c0000000-0000-0000-0000-000000000003", question_text: "Lift/Hoist Installation Certificates & Door Interlocking: Are all lift installation certificates current? Is the door interlocking mechanism functioning correctly with zero bypass capability?", max_points: 5, sort_order: 1, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000009", category_id: "c0000000-0000-0000-0000-000000000003", question_text: "Electrical Earthing & Equipment Calibration: Is the electrical earthing system tested and certified within the last 12 months? Are all critical instruments calibrated per schedule?", max_points: 5, sort_order: 2, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000010", category_id: "c0000000-0000-0000-0000-000000000003", question_text: "HVAC and Plumbing Utility Health: Are all HVAC units operational with filters cleaned on schedule? Are there zero active leaks, blockages, or pressure issues in plumbing systems?", max_points: 5, sort_order: 3, created_at: "" }
    ]
  },
  {
    id: "c0000000-0000-0000-0000-000000000004",
    template_id: "a0000000-0000-0000-0000-000000000001",
    name: "Chemical, Waste & Material Management",
    weight_percentage: 15,
    sort_order: 4,
    created_at: "",
    questions: [
      { id: "e0000000-0000-0000-0000-000000000011", category_id: "c0000000-0000-0000-0000-000000000004", question_text: "MSDS Availability: Are Material Safety Data Sheets (MSDS) available, current, and displayed at all chemical storage locations for every chemical used on site?", max_points: 5, sort_order: 1, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000012", category_id: "c0000000-0000-0000-0000-000000000004", question_text: "Safe Storage & Disposal Protocols: Are all chemicals stored in approved, labeled containers with secondary containment? Is liquid/chemical waste disposed per local environmental norms?", max_points: 5, sort_order: 2, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000013", category_id: "c0000000-0000-0000-0000-000000000004", question_text: "Material Handling Equipment (MHE) Fitness: Are all MHE units (forklifts, trolleys, hoists) within valid fitness certification? Are operators holding valid competency certificates?", max_points: 5, sort_order: 3, created_at: "" }
    ]
  },
  {
    id: "c0000000-0000-0000-0000-000000000005",
    template_id: "a0000000-0000-0000-0000-000000000001",
    name: "Emergency Preparedness & Subcontractor Safety",
    weight_percentage: 15,
    sort_order: 5,
    created_at: "",
    questions: [
      { id: "e0000000-0000-0000-0000-000000000014", category_id: "c0000000-0000-0000-0000-000000000005", question_text: "Mock Drill Records (Fire & Evacuation): Have fire and evacuation mock drills been conducted in the last quarter? Are drill records, participant lists, and improvement notes documented?", max_points: 5, sort_order: 1, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000015", category_id: "c0000000-0000-0000-0000-000000000005", question_text: "First Aid Box Availability & Staff Training: Are first aid boxes fully stocked at all designated locations? Have at least 2 trained first-aiders been identified per shift?", max_points: 5, sort_order: 2, created_at: "" },
      { id: "e0000000-0000-0000-0000-000000000016", category_id: "c0000000-0000-0000-0000-000000000005", question_text: "Subcontractor Pre-Engagement Reviews & Medical Records: Are all subcontractor workers medically examined before site entry? Are pre-engagement safety inductions documented?", max_points: 5, sort_order: 3, created_at: "" }
    ]
  }
];

/* ============================================================
   New Audit Page — Multi-step Audit Engine
   ============================================================ */
export default function NewAuditPage() {
  const router = useRouter();

  /* Zustand store */
  const {
    propertyId,
    currentStep,
    responses,
    setProperty,
    setTemplate,
    setCurrentStep,
    setTotalSteps,
    setResponse,
    reset,
  } = useAuditStore();

  /* Local state */
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<CategoryWithQuestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [templateId, setLocalTemplateId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<{ full_name: string; email: string; role: string } | null>(null);
  const [lastAuditScore, setLastAuditScore] = useState<number | null>(null);
  const [lastAuditDate, setLastAuditDate] = useState<string | null>(null);
  const [guidelinesChecked, setGuidelinesChecked] = useState<Record<string, boolean>>({
    charged: false,
    camera: false,
    clothing: false,
    prevIssues: false,
  });

  /* Ref for scroll-to-top on step change */
  const topRef = useRef<HTMLDivElement>(null);

  /* Total steps = 1 (property selection) + N categories + 1 (review) */
  const totalSteps = categories.length + 2;

  /* ── Fetch data on mount ── */
  const fetchData = useCallback(async () => {
    const supabase = createClient();

    try {
      /* Fetch properties */
      const { data: propsData } = await supabase
        .from("properties")
        .select("*")
        .order("name");

      setProperties(propsData || []);

      /* Fetch current user profile */
      let userRole = "auditor";
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .maybeSingle();

          userRole = profile?.role || "auditor";
          setCurrentUser({
            full_name: profile?.full_name || user.user_metadata?.full_name || "Rahul Sharma",
            email: user.email || "auditor@ivyleaguehouse.com",
            role: userRole,
          });
        } catch {
          setCurrentUser({
            full_name: user.user_metadata?.full_name || "Rahul Sharma",
            email: user.email || "auditor@ivyleaguehouse.com",
            role: "auditor",
          });
        }
      }

      /* Fetch default template */
      let templateData = null;
      try {
        const { data } = await supabase
          .from("audit_templates")
          .select("*")
          .limit(1)
          .maybeSingle();
        templateData = data;
      } catch (err) {
        console.warn("Could not fetch template, attempting auto-seed or fallback:", err);
      }

      let loadedCategories: CategoryWithQuestions[] = [];

      if (templateData) {
        /* Fetch categories for this template */
        const { data: catsData } = await supabase
          .from("audit_categories")
          .select("*")
          .eq("template_id", templateData.id)
          .order("sort_order");

        if (catsData && catsData.length > 0) {
          /* Fetch questions for all categories */
          const catIds = catsData.map((c) => c.id);
          const { data: questionsData } = await supabase
            .from("audit_questions")
            .select("*")
            .in("category_id", catIds)
            .order("sort_order");

          /* Group questions by category */
          loadedCategories = catsData.map((cat) => ({
            ...cat,
            questions: (questionsData || []).filter(
              (q) => q.category_id === cat.id
            ),
          }));
        }
      }

      // If categories are empty, attempt client-side auto-seeding or resilient fallback
      if (loadedCategories.length === 0) {
        console.log("Database template/categories empty. Resiliency engine activated.");
        
        // If the logged-in user is an admin, let's try to seed the real Supabase database!
        if (userRole === "admin") {
          try {
            toast.info("Empty database detected. Seeding the official ILH 26-Question framework...");
            
            // 1. Insert Template
            const defaultTemplateId = "a0000000-0000-0000-0000-000000000001";
            const { error: tErr } = await supabase
              .from("audit_templates")
              .upsert({
                id: defaultTemplateId,
                title: "Standard Property Audit",
                description: "Comprehensive quality audit covering all aspects of ILH property operations including housekeeping, food, maintenance, safety, and community standards.",
                max_score: 100
              });

            if (!tErr) {
              // 2. Insert Categories
              const categoriesToInsert = ILH_FALLBACK_FRAMEWORK.map(({ id, template_id, name, weight_percentage, sort_order }) => ({
                id,
                template_id: defaultTemplateId,
                name,
                weight_percentage,
                sort_order
              }));

              const { error: cErr } = await supabase
                .from("audit_categories")
                .upsert(categoriesToInsert);

              if (!cErr) {
                // 3. Insert Questions
                const questionsToInsert: any[] = [];
                ILH_FALLBACK_FRAMEWORK.forEach((cat) => {
                  cat.questions.forEach((q) => {
                    questionsToInsert.push({
                      id: q.id,
                      category_id: cat.id,
                      question_text: q.question_text,
                      max_points: q.max_points,
                      sort_order: q.sort_order
                    });
                  });
                });

                const { error: qErr } = await supabase
                  .from("audit_questions")
                  .upsert(questionsToInsert);

                if (!qErr) {
                  toast.success("Database seeded successfully!");
                  // Load seeded categories
                  loadedCategories = ILH_FALLBACK_FRAMEWORK;
                  setTemplate(defaultTemplateId);
                  setLocalTemplateId(defaultTemplateId);
                } else {
                  console.error("Auto-seeding questions error:", qErr);
                }
              } else {
                console.error("Auto-seeding categories error:", cErr);
              }
            } else {
              console.error("Auto-seeding template error:", tErr);
            }
          } catch (seedErr) {
            console.error("Auto-seeding exception:", seedErr);
          }
        }

        // If seeding wasn't performed or failed (e.g., RLS, not admin, or network offline), fall back to client static definitions!
        if (loadedCategories.length === 0) {
          toast.warning("Running in Resilient Fallback Mode. Quality checks are fully operational.");
          loadedCategories = ILH_FALLBACK_FRAMEWORK;
          const fallbackTemplateId = "a0000000-0000-0000-0000-000000000001";
          setTemplate(fallbackTemplateId);
          setLocalTemplateId(fallbackTemplateId);
        }
      } else {
        if (templateData) {
          setTemplate(templateData.id);
          setLocalTemplateId(templateData.id);
        }
      }

      setCategories(loadedCategories);
      setTotalSteps(loadedCategories.length + 2);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load audit data");
    } finally {
      setLoading(false);
    }
  }, [setTemplate, setTotalSteps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!propertyId) {
      setLastAuditScore(null);
      setLastAuditDate(null);
      return;
    }

    const fetchPropertyHistory = async () => {
      const supabase = createClient();
      try {
        const { data } = await supabase
          .from("audits")
          .select("total_score, conducted_at")
          .eq("property_id", propertyId)
          .eq("status", "completed")
          .order("conducted_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setLastAuditScore(Number(data.total_score));
          setLastAuditDate(data.conducted_at);
        } else {
          setLastAuditScore(null);
          setLastAuditDate(null);
        }
      } catch (err) {
        console.error("History fetch error:", err);
      }
    };

    fetchPropertyHistory();
  }, [propertyId]);

  /* ── Step navigation ── */
  const goNext = () => {
    const next = Math.min(currentStep + 1, totalSteps - 1);
    setCurrentStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const goBack = () => {
    const prev = Math.max(currentStep - 1, 0);
    setCurrentStep(prev);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ── Image upload handler ── */
  const handleImageUpload = async (
    questionId: string,
    file: File
  ) => {
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `audits/${fileName}`;

    const { error } = await supabase.storage
      .from("audit-images")
      .upload(filePath, file);

    if (error) {
      toast.error("Image upload failed");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("audit-images").getPublicUrl(filePath);

    setResponse(questionId, { imageUrl: publicUrl });
    toast.success("Image uploaded");
  };

  /* ── Remove uploaded image ── */
  const handleRemoveImage = (questionId: string) => {
    setResponse(questionId, { imageUrl: null, imageFile: null });
  };

  /* ── Calculate scores for review ── */
  const getCategoryScore = (cat: CategoryWithQuestions) => {
    let scored = 0;
    let maxPossible = 0;

    cat.questions.forEach((q) => {
      const resp = responses[q.id];
      scored += resp?.score || 0;
      maxPossible += q.max_points;
    });

    const percentage = maxPossible > 0 ? (scored / maxPossible) * 100 : 0;
    return { scored, maxPossible, percentage };
  };

  const getOverallScore = () => {
    let totalWeightedScore = 0;

    categories.forEach((cat) => {
      const { percentage } = getCategoryScore(cat);
      totalWeightedScore += percentage * (cat.weight_percentage / 100);
    });

    return totalWeightedScore;
  };

  /* ── Submit audit ── */
  const handleSubmit = async () => {
    if (!propertyId || !templateId) return;

    setSubmitting(true);
    const supabase = createClient();

    try {
      /* Get current user */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be signed in");
        return;
      }

      const totalScore = getOverallScore();

      /* Insert audit record */
      const { data: auditData, error: auditError } = await supabase
        .from("audits")
        .insert({
          property_id: propertyId,
          template_id: templateId,
          auditor_id: user.id,
          status: "completed",
          total_score: totalScore,
          conducted_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (auditError || !auditData) {
        throw auditError || new Error("Failed to create audit");
      }

      /* Insert all responses */
      const responsesToInsert = Object.values(responses)
        .filter((r) => r.questionId)
        .map((r) => ({
          audit_id: auditData.id,
          question_id: r.questionId,
          score_awarded: r.score,
          notes: r.notes || null,
          image_url: r.imageUrl || null,
        }));

      if (responsesToInsert.length > 0) {
        const { error: respError } = await supabase
          .from("audit_responses")
          .insert(responsesToInsert);

        if (respError) throw respError;

        /* Automatically create corrective actions for scores <= 2 */
        const failedResponses = Object.values(responses)
          .filter((r) => r.questionId && r.score <= 2);

        if (failedResponses.length > 0) {
          const qIds = failedResponses.map((fr) => fr.questionId);
          const { data: qTexts } = await supabase
            .from("audit_questions")
            .select("id, question_text")
            .in("id", qIds);

          const qTextMap = new Map((qTexts || []).map((q) => [q.id, q.question_text]));

          const actionsToInsert = failedResponses.map((fr) => ({
            audit_id: auditData.id,
            property_id: propertyId,
            question_id: fr.questionId,
            issue_description: `Audit failure on: "${qTextMap.get(fr.questionId) || "Checkpoint"}". Score awarded: ${fr.score}/5. ${
              fr.notes ? `Auditor comment: "${fr.notes}"` : "No auditor comment provided."
            }`,
            status: "open",
          }));

          const { error: capError } = await supabase
            .from("corrective_actions")
            .insert(actionsToInsert);

          if (capError) {
            console.error("Failed to automatically generate corrective actions:", capError);
          } else {
            toast.info(`Logged ${failedResponses.length} compliance action items`);
          }
        }
      }

      /* Clear store and redirect */
      reset();
      toast.success("Audit submitted successfully!");
      router.push("/dashboard/audits");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit audit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Score color helper ── */
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-ilh-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-ilh-green-50 border-ilh-green-200";
    if (score >= 60) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ilh-navy-400" />
      </div>
    );
  }

  /* ── Current category (for steps 1..N) ── */
  const categoryIndex = currentStep - 1;
  const currentCategory =
    categoryIndex >= 0 && categoryIndex < categories.length
      ? categories[categoryIndex]
      : null;

  const progressPercent = ((currentStep) / (totalSteps - 1)) * 100;

  /* Stepper Helpers */
  const getCategoryAnsweredCount = (cat: CategoryWithQuestions) => {
    let count = 0;
    cat.questions.forEach((q) => {
      if (responses[q.id] !== undefined) {
        count++;
      }
    });
    return count;
  };

  const isCategoryCompleted = (cat: CategoryWithQuestions) => {
    const answered = getCategoryAnsweredCount(cat);
    return cat.questions.length > 0 && answered === cat.questions.length;
  };

  const handleCancelAudit = () => {
    if (typeof window !== "undefined") {
      const confirmCancel = window.confirm(
        "Are you sure you want to cancel this audit? All current draft scores, notes, and photo attachments will be permanently deleted."
      );
      if (confirmCancel) {
        reset();
        toast.info("Audit draft discarded");
        router.push("/dashboard");
      }
    }
  };

  return (
    <div ref={topRef} className="max-w-6xl mx-auto space-y-6">
      
      {/* ── Page Header & Autosave status ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-ilh-navy-500" />
            <h1 className="text-3xl font-bold text-ilh-navy-700">New Audit</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Conduct a property compliance and quality audit on site.
          </p>
        </div>

        {propertyId && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-1.5 text-xs text-ilh-green-600 font-bold bg-ilh-green-50 border border-ilh-green-200 px-3 py-1 rounded-full shadow-sm animate-pulse-glow">
              <span className="h-1.5 w-1.5 rounded-full bg-ilh-green-500" />
              Draft Autosaved
            </div>
            <Button
              variant="ghost"
              onClick={handleCancelAudit}
              className="text-xs text-red-500 hover:bg-red-50 hover:text-red-600 h-8 rounded-full font-semibold"
            >
              Cancel Audit
            </Button>
          </div>
        )}
      </div>

      {/* ── Main Stepper Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Side Stepper Navigation (Desktop only, sticky) */}
        <aside className="hidden lg:block lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 space-y-3 sticky top-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">
            Audit Checklist
          </h3>
          
          <nav className="flex flex-col gap-1.5">
            {/* Step 0: Property Selection */}
            <button
              onClick={() => setCurrentStep(0)}
              className={`flex items-center justify-between w-full text-left rounded-xl px-3.5 py-3 text-xs font-bold transition-all ${
                currentStep === 0
                  ? "bg-ilh-navy-500 text-white shadow-md shadow-ilh-navy-500/10"
                  : "text-ilh-navy-400 hover:bg-slate-50 hover:text-ilh-navy-700"
              }`}
            >
              <span>1. Property Details</span>
              {propertyId && (
                <CheckCircle2 className={`h-4 w-4 ${currentStep === 0 ? "text-white" : "text-ilh-green-500"}`} />
              )}
            </button>

            {/* Steps 1..N: Categories */}
            {categories.map((cat, idx) => {
              const stepIdx = idx + 1;
              const completed = isCategoryCompleted(cat);
              const answeredCount = getCategoryAnsweredCount(cat);
              const totalQCount = cat.questions.length;
              const disabled = !propertyId;

              return (
                <button
                  key={cat.id}
                  disabled={disabled}
                  onClick={() => setCurrentStep(stepIdx)}
                  className={`flex items-center justify-between w-full text-left rounded-xl px-3.5 py-3 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    currentStep === stepIdx
                      ? "bg-ilh-navy-500 text-white shadow-md shadow-ilh-navy-500/10"
                      : "text-ilh-navy-400 hover:bg-slate-50 hover:text-ilh-navy-700"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span>{idx + 2}. {cat.name}</span>
                    <span className={`text-[9px] ${currentStep === stepIdx ? "text-white/70" : "text-slate-400"}`}>
                      {answeredCount}/{totalQCount} checkpoints
                    </span>
                  </div>
                  {completed ? (
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${currentStep === stepIdx ? "text-white" : "text-ilh-green-500"}`} />
                  ) : (
                    <span className={`text-[10px] shrink-0 font-bold ${currentStep === stepIdx ? "text-white/60" : "text-slate-300"}`}>
                      {Math.round((answeredCount / totalQCount) * 100)}%
                    </span>
                  )}
                </button>
              );
            })}

            {/* Step N+1: Review */}
            <button
              disabled={!propertyId}
              onClick={() => setCurrentStep(totalSteps - 1)}
              className={`flex items-center justify-between w-full text-left rounded-xl px-3.5 py-3 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                currentStep === totalSteps - 1
                  ? "bg-ilh-navy-500 text-white shadow-md shadow-ilh-navy-500/10"
                  : "text-ilh-navy-400 hover:bg-slate-50 hover:text-ilh-navy-700"
              }`}
            >
              <span>{totalSteps}. Review & Submit</span>
              <CheckCircle2 className="h-4 w-4 text-slate-300 invisible" />
            </button>
          </nav>
        </aside>

        {/* Right Side Step Content */}
        <main className="col-span-1 lg:col-span-3 space-y-6">
          
          {/* Mobile indicator (stepper shown only on small viewports) */}
          {currentStep > 0 && (
            <div className="block lg:hidden bg-white rounded-xl border border-slate-100 p-4 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>
                  Step {currentStep} of {totalSteps - 1} · {currentCategory ? currentCategory.name : "Review"}
                </span>
                <span>{Math.round(progressPercent)}% Done</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* ============================================================
               STEP 0 — Property Selection
               ============================================================ */}
          {currentStep === 0 && (
            <div className="animate-fade-in space-y-6">
              {/* Card 1: Property Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ilh-navy-500 text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-ilh-navy-700">
                      Select Property
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Choose the property you want to inspect
                    </p>
                  </div>
                </div>

                <Select
                  value={propertyId || ""}
                  onValueChange={(val) => { if (val) setProperty(val); }}
                >
                  <SelectTrigger className="w-full h-12 text-base rounded-xl">
                    <SelectValue placeholder="Select a property...">
                      {propertyId ? properties.find(p => p.id === propertyId)?.name || "Select a property..." : "Select a property..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Card 2: Onboarding & Historical Insights (Only when property selected) */}
              {propertyId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-slide-up opacity-0" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
                  {/* Left Side: Audit Parameters */}
                  <div className="space-y-4 pr-0 md:pr-6 md:border-r border-slate-100">
                    <h3 className="text-sm font-bold text-ilh-navy-700 border-b pb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-ilh-navy-500" />
                      Auditor Profile & Parameters
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Conducted By:</span>
                        <span className="text-ilh-navy-700 font-bold">{currentUser?.full_name || "Rahul Sharma"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Auditor Email:</span>
                        <span className="text-ilh-navy-700 font-bold">{currentUser?.email || "auditor@ivyleaguehouse.com"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Audit Template:</span>
                        <span className="text-ilh-navy-700 font-bold">Standard Property Audit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Inspection Date:</span>
                        <span className="text-ilh-navy-700 font-bold flex items-center gap-1.5 font-mono text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date().toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Historical Quality Insights */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-ilh-navy-700 border-b pb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-ilh-navy-500" />
                      Historical Location Insights
                    </h3>
                    <div className="flex flex-col items-center justify-center py-2">
                      {lastAuditScore !== null ? (
                        <div className="text-center space-y-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Last Audit Compliance Score
                          </p>
                          <div className="inline-flex items-center gap-2">
                            <span className={`text-4xl font-black ${
                              lastAuditScore >= 80 ? "text-ilh-green-600" : lastAuditScore >= 60 ? "text-amber-500" : "text-red-500"
                            }`}>
                              {lastAuditScore.toFixed(1)}%
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              lastAuditScore >= 80 
                                ? "bg-ilh-green-50 text-ilh-green-700 border-ilh-green-200" 
                                : lastAuditScore >= 60 
                                  ? "bg-amber-50 text-amber-700 border-amber-200" 
                                  : "bg-red-50 text-red-700 border-red-200"
                            }`}>
                              {lastAuditScore >= 80 ? "Excellent" : lastAuditScore >= 60 ? "Warning" : "Critical"}
                            </span>
                          </div>
                          {lastAuditDate && (
                            <p className="text-[10px] text-slate-400 font-semibold font-mono">
                              Conducted on {new Date(lastAuditDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 space-y-1">
                          <p className="text-sm font-bold text-slate-500">No Previous Audits Found</p>
                          <p className="text-xs text-slate-400">This property will start fresh with its initial baseline check today.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3: Pre-Audit SOP Verification Checklist (Only when property selected) */}
              {propertyId && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-slide-up opacity-0" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                  <h3 className="text-sm font-bold text-ilh-navy-700 border-b pb-3 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-ilh-navy-500" />
                    Pre-Audit SOP Verification Checklist
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 font-semibold">
                    You must verify and acknowledge all standard operating guidelines before starting:
                  </p>
                  <div className="space-y-3.5">
                    {/* Item 1: Device Charged */}
                    <label className="flex items-start gap-3 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={guidelinesChecked.charged}
                        onChange={(e) => setGuidelinesChecked(prev => ({ ...prev, charged: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ilh-green-500 focus:ring-ilh-green-200 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ilh-navy-700 group-hover:text-ilh-navy-500 transition-colors">
                          Inspection Device Power Status
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          My tablet/phone battery is above 50% or connected to power for continuous data logging on site.
                        </span>
                      </div>
                    </label>

                    {/* Item 2: Camera Permissions */}
                    <label className="flex items-start gap-3 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={guidelinesChecked.camera}
                        onChange={(e) => setGuidelinesChecked(prev => ({ ...prev, camera: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ilh-green-500 focus:ring-ilh-green-200 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ilh-navy-700 group-hover:text-ilh-navy-500 transition-colors">
                          Media Uploads & Camera Ready
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Camera permissions are enabled to capture high-res photo evidence for compliance checkpoint failures (score ≤ 2).
                        </span>
                      </div>
                    </label>

                    {/* Item 3: Safety Gear */}
                    <label className="flex items-start gap-3 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={guidelinesChecked.clothing}
                        onChange={(e) => setGuidelinesChecked(prev => ({ ...prev, clothing: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ilh-green-500 focus:ring-ilh-green-200 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ilh-navy-700 group-hover:text-ilh-navy-500 transition-colors">
                          Operational Safety Gear
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          I am wearing the standard operational vest and safety clothing required for walking property utility sectors.
                        </span>
                      </div>
                    </label>

                    {/* Item 4: Review CAP Issues */}
                    <label className="flex items-start gap-3 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={guidelinesChecked.prevIssues}
                        onChange={(e) => setGuidelinesChecked(prev => ({ ...prev, prevIssues: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ilh-green-500 focus:ring-ilh-green-200 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ilh-navy-700 group-hover:text-ilh-navy-500 transition-colors">
                          Familiarity with Location CAP Board
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          I have reviewed outstanding corrective action tasks for this location to verify remediation updates during this walk.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Start Checklist Button */}
              <Button
                size="lg"
                disabled={
                  !propertyId ||
                  !guidelinesChecked.charged ||
                  !guidelinesChecked.camera ||
                  !guidelinesChecked.clothing ||
                  !guidelinesChecked.prevIssues
                }
                onClick={goNext}
                className="w-full h-12 bg-ilh-green-500 hover:bg-ilh-green-600 text-white text-base font-bold rounded-xl shadow-lg shadow-ilh-green-500/10 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Checklist
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}

          {/* ============================================================
               STEPS 1..N — Category Questions
               ============================================================ */}
          {currentCategory && (
            <div key={currentCategory.id} className="animate-fade-in space-y-5">
              {/* Category header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-ilh-navy-700">
                  {currentCategory.name}
                </h2>
                <p className="text-sm text-gray-400 mt-1.5">
                  Weight: {currentCategory.weight_percentage}% of total score ·{" "}
                  {currentCategory.questions.length} questions
                </p>
              </div>

              {/* Questions */}
              {currentCategory.questions.map((question, qIdx) => {
                const resp = responses[question.id] || {
                  score: 0,
                  notes: "",
                  imageUrl: null,
                };

                return (
                  <div
                    key={question.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up opacity-0"
                    style={{
                      animationDelay: `${qIdx * 80}ms`,
                      animationFillMode: "forwards",
                    }}
                  >
                    {/* Question text */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ilh-navy-50 text-[10px] font-bold text-ilh-navy-700 mt-0.5">
                        Q{qIdx + 1}
                      </span>
                      <p className="text-sm font-bold text-ilh-navy-700">
                        {question.question_text}
                      </p>
                    </div>

                    {/* Score buttons */}
                    <div className="mb-4 ml-9">
                      <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Compliance Points (0 &ndash; {question.max_points})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(
                          { length: question.max_points + 1 },
                          (_, i) => i
                        ).map((score) => {
                          const isSelected = responses[question.id]?.score === score;
                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() =>
                                setResponse(question.id, { score })
                              }
                              className={`
                                w-11 h-11 rounded-full border-2 flex items-center justify-center
                                text-sm font-black transition-all duration-200 cursor-pointer
                                ${
                                  isSelected
                                    ? score >= 4
                                      ? "bg-ilh-green-500 border-ilh-green-500 text-white scale-110 shadow-lg shadow-ilh-green-500/25"
                                      : score >= 3
                                        ? "bg-amber-400 border-amber-400 text-white scale-110 shadow-lg shadow-amber-400/25"
                                        : "bg-red-500 border-red-500 text-white scale-110 shadow-lg shadow-red-500/25"
                                    : "border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600 bg-slate-50"
                                }
                              `}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-4 ml-9">
                      <Textarea
                        placeholder="Add comments, observations, or remediation tasks (optional)..."
                        value={resp.notes || ""}
                        onChange={(e) =>
                          setResponse(question.id, { notes: e.target.value })
                        }
                        className="resize-none text-sm rounded-xl border-slate-150 focus:border-ilh-navy-300 focus:ring-ilh-navy-100"
                        rows={2}
                      />
                    </div>

                    {/* Image upload */}
                    <div className="ml-9">
                      {resp.imageUrl ? (
                        <div className="relative inline-block">
                          <img
                            src={resp.imageUrl}
                            alt="Audit evidence"
                            className="h-20 w-20 rounded-xl object-cover border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(question.id)}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-500 cursor-pointer hover:border-ilh-navy-300 hover:text-ilh-navy-500 transition-colors">
                          <Camera className="h-4 w-4 text-slate-400" />
                          <span>Attach photo evidence</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(question.id, file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Navigation Controls */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="flex-1 h-12 rounded-xl border-slate-200 hover:bg-slate-50 font-bold"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  className="flex-1 h-12 bg-ilh-green-500 hover:bg-ilh-green-600 text-white rounded-xl font-bold shadow-md shadow-ilh-green-500/10"
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================
               FINAL STEP — Review & Submit
               ============================================================ */}
          {currentStep === totalSteps - 1 && totalSteps > 2 && (
            <div className="animate-fade-in space-y-6">
              {/* Overall score */}
              {(() => {
                const overall = getOverallScore();
                return (
                  <div
                    className={`bg-white rounded-2xl shadow-sm border p-8 text-center ${getScoreBg(overall)}`}
                  >
                    <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                      Overall Compliance Score
                    </p>
                    <p
                      className={`text-6xl font-black ${getScoreColor(overall)}`}
                    >
                      {overall.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">
                      Weighted Target: 100%
                    </p>
                  </div>
                );
              })()}

              {/* Category breakdown */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-ilh-navy-700 mb-4 border-b pb-2">
                  Category Score Breakdown
                </h3>
                <div className="space-y-4">
                  {categories.map((cat) => {
                    const { scored, maxPossible, percentage } =
                      getCategoryScore(cat);
                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-ilh-navy-600">
                          <span>{cat.name}</span>
                          <span className="font-mono text-slate-500">
                            {scored}/{maxPossible} ({percentage.toFixed(0)}%)
                            <span className="text-[10px] text-slate-400 ml-1">
                              &times; {cat.weight_percentage}% wt
                            </span>
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Warning Checklist (if any questions are unanswered) */}
              {(() => {
                const unansweredCount = categories.reduce(
                  (sum, cat) => sum + (cat.questions.length - getCategoryAnsweredCount(cat)),
                  0
                );
                
                if (unansweredCount > 0) {
                  return (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs font-semibold text-amber-800">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-bold">Unanswered Checkpoints Remaining ({unansweredCount})</p>
                        <p className="text-amber-600 mt-0.5 font-medium">
                          You have left some questions unanswered. Unanswered items receive a default score of 0, which will negatively affect the property's health rating. You can use the left stepper sidebar to jump back and fill them.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 h-12 bg-ilh-green-500 hover:bg-ilh-green-600 text-white rounded-xl text-base font-bold shadow-md shadow-ilh-green-500/10"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting Audit...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Submit Final Audit
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

