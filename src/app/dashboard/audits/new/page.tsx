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

  return (
    <div ref={topRef} className="max-w-3xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7 text-ilh-navy-500" />
          <h1 className="text-3xl font-bold text-ilh-navy-700">New Audit</h1>
        </div>
        {currentStep > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                Step {currentStep} of {totalSteps - 1}
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
      </div>

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
                <p className="text-sm text-gray-400">
                  Choose the property you want to audit
                </p>
              </div>
            </div>

            <Select
              value={propertyId || ""}
              onValueChange={(val) => { if (val) setProperty(val); }}
            >
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select a property..." />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-gray-400">
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
            className="w-full h-12 bg-ilh-green-500 hover:bg-ilh-green-600 text-white text-base font-semibold rounded-xl"
          >
            Start Audit
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}

      {/* ============================================================
           STEPS 1..N — Category Questions
           ============================================================ */}
      {currentCategory && (
        <div key={currentCategory.id} className="animate-fade-in space-y-4">
          {/* Category header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-ilh-navy-700">
              {currentCategory.name}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
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
                  animationDelay: `${qIdx * 100}ms`,
                  animationFillMode: "forwards",
                }}
              >
                {/* Question text */}
                <p className="text-sm font-semibold text-ilh-navy-700 mb-4">
                  <span className="text-ilh-green-500 mr-2">
                    Q{qIdx + 1}.
                  </span>
                  {question.question_text}
                </p>

                {/* Score buttons */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">
                    Score (0 – {question.max_points})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      { length: question.max_points + 1 },
                      (_, i) => i
                    ).map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() =>
                          setResponse(question.id, { score })
                        }
                        className={`
                          w-10 h-10 rounded-full border-2 flex items-center justify-center
                          text-sm font-bold transition-all duration-200
                          ${
                            resp.score === score
                              ? "bg-ilh-green-500 border-ilh-green-500 text-white scale-110 shadow-md"
                              : "border-gray-200 text-gray-500 hover:border-ilh-green-300 hover:text-ilh-green-500"
                          }
                        `}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <Textarea
                    placeholder="Add notes (optional)"
                    value={resp.notes || ""}
                    onChange={(e) =>
                      setResponse(question.id, { notes: e.target.value })
                    }
                    className="resize-none text-sm"
                    rows={2}
                  />
                </div>

                {/* Image upload */}
                <div>
                  {resp.imageUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={resp.imageUrl}
                        alt="Audit evidence"
                        className="h-24 w-24 rounded-xl object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(question.id)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 cursor-pointer hover:border-ilh-green-300 hover:text-ilh-green-500 transition-colors">
                      <Camera className="h-4 w-4" />
                      <span>Add photo</span>
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

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={goBack}
              className="flex-1 h-12 rounded-xl"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Previous
            </Button>
            <Button
              onClick={goNext}
              className="flex-1 h-12 bg-ilh-green-500 hover:bg-ilh-green-600 text-white rounded-xl"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
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
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Overall Weighted Score
                </p>
                <p
                  className={`text-6xl font-bold ${getScoreColor(overall)}`}
                >
                  {overall.toFixed(1)}
                </p>
                <p className="text-sm text-gray-400 mt-1">out of 100</p>
              </div>
            );
          })()}

          {/* Category breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-ilh-navy-700 mb-4">
              Score Breakdown
            </h3>
            <div className="space-y-4">
              {categories.map((cat) => {
                const { scored, maxPossible, percentage } =
                  getCategoryScore(cat);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ilh-navy-600">
                        {cat.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {scored}/{maxPossible} ({percentage.toFixed(1)}%)
                        <span className="text-xs text-gray-400 ml-1">
                          × {cat.weight_percentage}%
                        </span>
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={goBack}
              className="flex-1 h-12 rounded-xl"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 h-12 bg-ilh-green-500 hover:bg-ilh-green-600 text-white rounded-xl text-base font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Submit Audit
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
