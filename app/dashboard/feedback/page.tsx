"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { notifyError, notifySuccess } from "@/lib/toast";
import { Loader2, Sparkles, ThumbsUp } from "lucide-react";

const FEATURE_SUGGESTIONS = [
  "Domain-wise success insights",
  "Automatic provider failover",
  "Request replay for failures",
  "Faster support response",
  "Proxy quality score",
  "Webhook alerts upgrades",
  "Team activity logs",
  "Higher sticky session controls",
];

const PAIN_POINT_SUGGESTIONS = [
  "Too many failed requests",
  "Speed/latency is unstable",
  "Dashboard is confusing",
  "Billing/credits are hard to understand",
  "Logs are not enough for debugging",
  "Setup docs are not clear",
  "Need more country/geo options",
  "Need better API examples",
];

function ScorePills({
  values,
  selected,
  onSelect,
}: {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Button
          key={value}
          type="button"
          variant={selected === value ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(value)}
          className="min-w-10"
        >
          {value}
        </Button>
      ))}
    </div>
  );
}

function ToggleChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isOn = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              isOn
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function FeedbackPage() {
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);
  const [remainingThisMonth, setRemainingThisMonth] = useState<number>(3);
  const [maxPerMonth, setMaxPerMonth] = useState<number>(3);
  const [resetsAt, setResetsAt] = useState<string | null>(null);
  const [overallExperience, setOverallExperience] = useState(8);
  const [proxyQuality, setProxyQuality] = useState(4);
  const [speedStability, setSpeedStability] = useState(4);
  const [dashboardEase, setDashboardEase] = useState(4);
  const [recommendationScore, setRecommendationScore] = useState(8);
  const [recommendedFeatures, setRecommendedFeatures] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [requestedFeature, setRequestedFeature] = useState("");
  const [improvementIdeas, setImprovementIdeas] = useState("");
  const [biggestWin, setBiggestWin] = useState("");
  const [loading, setLoading] = useState(false);

  const moodLabel = useMemo(() => {
    if (overallExperience >= 9) return "Excellent";
    if (overallExperience >= 7) return "Good";
    if (overallExperience >= 5) return "Average";
    return "Needs major improvement";
  }, [overallExperience]);

  useEffect(() => {
    fetch("/api/feedback")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw { status: res.status, data };
        return data;
      })
      .then((data) => {
        setHasPaidAccess(true);
        setRemainingThisMonth(data?.remainingThisMonth ?? 0);
        setMaxPerMonth(data?.maxPerMonth ?? 3);
        setResetsAt(data?.resetsAt || null);
      })
      .catch((err) => {
        if (err?.status === 403) {
          setHasPaidAccess(false);
          setRemainingThisMonth(0);
          setMaxPerMonth(3);
        } else {
          setHasPaidAccess(true);
          notifyError("Feedback status unavailable", "Could not load monthly feedback limits.");
        }
      })
      .finally(() => setAccessChecked(true));
  }, []);

  const toggleFeature = (value: string) => {
    setRecommendedFeatures((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const togglePainPoint = (value: string) => {
    setPainPoints((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (remainingThisMonth <= 0) {
      notifyError(
        "Monthly limit reached",
        "You have used all feedback slots for this month."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallExperience,
          proxyQuality,
          speedStability,
          dashboardEase,
          recommendationScore,
          recommendedFeatures,
          painPoints,
          requestedFeature,
          improvementIdeas,
          biggestWin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (typeof data?.remainingThisMonth === "number") {
          setRemainingThisMonth(data.remainingThisMonth);
        }
        if (typeof data?.maxPerMonth === "number") {
          setMaxPerMonth(data.maxPerMonth);
        }
        if (data?.resetsAt) {
          setResetsAt(data.resetsAt);
        }
        throw new Error(data?.error || "Failed to submit feedback");
      }
      setRemainingThisMonth(data?.remainingThisMonth ?? remainingThisMonth - 1);
      setMaxPerMonth(data?.maxPerMonth ?? maxPerMonth);
      setResetsAt(data?.resetsAt || resetsAt);
      notifySuccess(
        "Feedback submitted",
        "Thanks. Your feedback has been saved and queued for review."
      );
    } catch (e: any) {
      notifyError("Could not submit feedback", e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!accessChecked) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Paid User Feedback</h1>
        <p className="text-muted-foreground">Checking plan access...</p>
      </div>
    );
  }

  if (!hasPaidAccess) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Paid User Feedback</h1>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              This section is available for paid users only.
            </p>
            <Link href="/dashboard/billing" className="mt-3 inline-block">
              <Button size="sm">Upgrade to Access</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paid User Feedback</h1>
        <p className="text-muted-foreground">
          Help us improve the product roadmap. 2-3 minutes only.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={remainingThisMonth > 0 ? "default" : "destructive"}>
            {remainingThisMonth} / {maxPerMonth} feedback left this month
          </Badge>
          {resetsAt && (
            <span className="text-xs text-muted-foreground">
              Resets on {new Date(resetsAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            Product Pulse
          </CardTitle>
          <CardDescription>Tap scores quickly so it does not feel like a boring form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium">Overall experience (1-10)</p>
            <ScorePills values={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} selected={overallExperience} onSelect={setOverallExperience} />
            <Badge variant="secondary">{moodLabel}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Proxy quality (1-5)</p>
              <ScorePills values={[1, 2, 3, 4, 5]} selected={proxyQuality} onSelect={setProxyQuality} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Speed & stability (1-5)</p>
              <ScorePills values={[1, 2, 3, 4, 5]} selected={speedStability} onSelect={setSpeedStability} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Dashboard ease (1-5)</p>
              <ScorePills values={[1, 2, 3, 4, 5]} selected={dashboardEase} onSelect={setDashboardEase} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">How likely are you to recommend us? (0-10)</p>
            <ScorePills values={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} selected={recommendationScore} onSelect={setRecommendationScore} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What should we build next?</CardTitle>
          <CardDescription>
            Pick suggested ideas for inspiration, then add your own feature request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleChips
            options={FEATURE_SUGGESTIONS}
            selected={recommendedFeatures}
            onToggle={toggleFeature}
          />
          <Textarea
            placeholder="Directly tell us: Aapko sabse pehle kaunsa naya feature chahiye?"
            value={requestedFeature}
            onChange={(e) => setRequestedFeature(e.target.value)}
            className="min-h-24"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What felt weak or frustrating?</CardTitle>
          <CardDescription>
            Select pain points, then tell us exactly how we should improve.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleChips
            options={PAIN_POINT_SUGGESTIONS}
            selected={painPoints}
            onToggle={togglePainPoint}
          />
          <Textarea
            placeholder="Kis jagah product weak laga? Hume step-by-step improvement batayein."
            value={improvementIdeas}
            onChange={(e) => setImprovementIdeas(e.target.value)}
            className="min-h-28"
          />
          <Textarea
            placeholder="One positive: kya cheez sabse useful lagi?"
            value={biggestWin}
            onChange={(e) => setBiggestWin(e.target.value)}
            className="min-h-20"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Your feedback is reviewed before roadmap prioritization.
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading || remainingThisMonth <= 0}
            className="min-w-44"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
            Submit Feedback
          </Button>
        </CardContent>
      </Card>

      {remainingThisMonth <= 0 && (
        <Card className="border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">
            Monthly feedback limit reached. You can submit up to {maxPerMonth} feedback entries each month.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
