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

      /* Fetch default template */
      const { data: templateData } = await supabase
        .from("audit_templates")
        .select("*")
        .limit(1)
        .single();

      if (templateData) {
        setTemplate(templateData.id);
        setLocalTemplateId(templateData.id);

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
          const categoriesWithQuestions: CategoryWithQuestions[] = catsData.map(
            (cat) => ({
              ...cat,
              questions: (questionsData || []).filter(
                (q) => q.category_id === cat.id
              ),
            })
          );

          setCategories(categoriesWithQuestions);
          setTotalSteps(categoriesWithQuestions.length + 2);
        }
      }
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
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
                    <SelectValue placeholder="Select a property..." />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">{p.name}</span>
                          <span className="text-xs text-slate-400 mt-0.5">
                            {p.location} · {p.total_beds} beds
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="lg"
                disabled={!propertyId}
                onClick={goNext}
                className="w-full h-12 bg-ilh-green-500 hover:bg-ilh-green-600 text-white text-base font-bold rounded-xl shadow-lg shadow-ilh-green-500/10 transition-transform active:scale-95"
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

