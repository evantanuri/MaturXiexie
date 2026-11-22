import {
  EnvironmentalConditions,
  getEnvironmentalConditions,
} from "../../external/openMeteo.acl";
import { ReportCategory } from "../reporting/reporting.schema";
import { listReports, SidewalkReport } from "../reporting/reporting.service";

export type WalkabilityLabel =
  | "Sangat Layak"
  | "Layak"
  | "Cukup"
  | "Kurang Layak"
  | "Tidak Layak";

export interface WalkabilityResponse {
  lat: number;
  lng: number;
  radius_m: number;
  score: number;
  label: WalkabilityLabel;
  verified_report_count: number;
  disability_barrier_count: number;
  environment: EnvironmentalConditions;
}

export interface AreaInsightResponse {
  lat: number;
  lng: number;
  radius_m: number;
  total_verified_reports: number;
  disability_barrier_ratio: number;
  dominant_issues: Array<{ category: ReportCategory; count: number }>;
  walkability_score: number;
  environment: EnvironmentalConditions;
}

function classifyScore(score: number): WalkabilityLabel {
  if (score >= 80) return "Sangat Layak";
  if (score >= 60) return "Layak";
  if (score >= 40) return "Cukup";
  if (score >= 20) return "Kurang Layak";
  return "Tidak Layak";
}

function computeWalkabilityScore(
  verifiedReports: SidewalkReport[],
  environment: EnvironmentalConditions
): number {
  let score = 100;

  for (const report of verifiedReports) {
    if (report.category === "good_condition") {
      score += 2;
      continue;
    }
    const basePenalty = report.severity * 4;
    // Disability barriers carry a 1.5x penalty per StepSafe domain rules.
    const penalty = report.is_disability_barrier ? basePenalty * 1.5 : basePenalty;
    score -= penalty;
  }

  if (environment.rain_mm !== null) {
    if (environment.rain_mm > 5) score -= 15;
    else if (environment.rain_mm > 0) score -= 8;
  }

  if (environment.european_aqi !== null) {
    if (environment.european_aqi >= 80) score -= 15;
    else if (environment.european_aqi >= 50) score -= 8;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function calculateWalkability(params: {
  lat: number;
  lng: number;
  radius: number;
}): Promise<WalkabilityResponse> {
  const [verifiedReports, environment] = await Promise.all([
    listReports({
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
      status: "verified",
    }),
    getEnvironmentalConditions(params.lat, params.lng),
  ]);

  const disabilityBarrierCount = verifiedReports.filter((r) => r.is_disability_barrier).length;
  const score = computeWalkabilityScore(verifiedReports, environment);

  return {
    lat: params.lat,
    lng: params.lng,
    radius_m: params.radius,
    score,
    label: classifyScore(score),
    verified_report_count: verifiedReports.length,
    disability_barrier_count: disabilityBarrierCount,
    environment,
  };
}

export async function summarizeAreaInsight(params: {
  lat: number;
  lng: number;
  radius: number;
}): Promise<AreaInsightResponse> {
  const [verifiedReports, environment] = await Promise.all([
    listReports({
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
      status: "verified",
    }),
    getEnvironmentalConditions(params.lat, params.lng),
  ]);

  const total = verifiedReports.length;
  const disabilityCount = verifiedReports.filter((r) => r.is_disability_barrier).length;
  const ratio = total === 0 ? 0 : Number((disabilityCount / total).toFixed(2));

  const categoryCounts = new Map<ReportCategory, number>();
  for (const report of verifiedReports) {
    categoryCounts.set(report.category, (categoryCounts.get(report.category) ?? 0) + 1);
  }

  const dominantIssues = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const score = computeWalkabilityScore(verifiedReports, environment);

  return {
    lat: params.lat,
    lng: params.lng,
    radius_m: params.radius,
    total_verified_reports: total,
    disability_barrier_ratio: ratio,
    dominant_issues: dominantIssues,
    walkability_score: score,
    environment,
  };
}
