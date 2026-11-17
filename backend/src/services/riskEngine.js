/**
 * BIS IS 10500:2012 Drinking Water Specification Risk Scoring Engine
 * Group G315 - Community Water Contamination Reporting and Risk-Mapping Portal
 */

const BIS_STANDARDS = {
  ph: { label: 'pH Level', unit: '', acceptableMin: 6.5, acceptableMax: 8.5 },
  tds: { label: 'Total Dissolved Solids (TDS)', unit: 'mg/L', acceptableMax: 500, permissibleMax: 2000 },
  turbidity: { label: 'Turbidity', unit: 'NTU', acceptableMax: 1, permissibleMax: 5 },
  coliform: { label: 'Total Coliform / E. coli', unit: 'Presence', acceptable: false },
  fluoride: { label: 'Fluoride (F⁻)', unit: 'mg/L', acceptableMax: 1.0, permissibleMax: 1.5 },
  arsenic: { label: 'Arsenic (As)', unit: 'mg/L', acceptableMax: 0.01, permissibleMax: 0.05 },
  nitrate: { label: 'Nitrate (NO₃⁻)', unit: 'mg/L', acceptableMax: 45, permissibleMax: 45 },
  iron: { label: 'Iron (Fe)', unit: 'mg/L', acceptableMax: 0.3, permissibleMax: 1.0 },
};

const SYMPTOM_WEIGHTS = {
  cholera: 40,
  typhoid: 32,
  jaundice: 30,
  diarrhea: 22,
  fluorosis: 28,
  skin_lesions: 20,
  vomiting: 18,
  stomach_cramps: 14,
};

const VISUAL_ISSUE_WEIGHTS = {
  sewage_smell: 28,
  foul_odor: 20,
  yellow_brown_color: 18,
  turbid_muddy: 16,
  metallic_chemical_taste: 22,
  dead_animals_nearby: 35,
  pipe_leakage_drain: 26,
};

/**
 * Evaluates an individual report's risk score (0-100) and parameter violations against BIS IS 10500.
 */
function evaluateSingleReport(report) {
  let score = 0;
  const violations = [];
  const params = report.test_parameters || {};
  const symptoms = report.symptom_data || {};
  const visualIssues = Array.isArray(report.visual_issues) ? report.visual_issues : [];

  // 1. Evaluate BIS IS 10500 chemical & biological parameters
  if (params.coliform === true || params.coliform === 'present' || params.bacteria === true) {
    score += 65;
    violations.push('Biological: Coliform / E. coli detected (BIS requires 0 / 100mL)');
  }

  if (params.arsenic !== undefined && params.arsenic !== null && params.arsenic !== '') {
    const asVal = Number(params.arsenic);
    if (asVal > 0.05) {
      score += 60;
      violations.push(`Arsenic critically high: ${asVal} mg/L (BIS limit: 0.01 mg/L)`);
    } else if (asVal > 0.01) {
      score += 42;
      violations.push(`Arsenic exceeds acceptable limit: ${asVal} mg/L (BIS limit: 0.01 mg/L)`);
    }
  }

  if (params.fluoride !== undefined && params.fluoride !== null && params.fluoride !== '') {
    const flVal = Number(params.fluoride);
    if (flVal > 1.5) {
      score += 45;
      violations.push(`Fluoride exceeds permissible limit: ${flVal} mg/L (BIS max: 1.5 mg/L)`);
    } else if (flVal > 1.0) {
      score += 22;
      violations.push(`Fluoride above acceptable limit: ${flVal} mg/L (BIS acceptable: 1.0 mg/L)`);
    }
  }

  if (params.nitrate !== undefined && params.nitrate !== null && params.nitrate !== '') {
    const no3Val = Number(params.nitrate);
    if (no3Val > 45) {
      score += 38;
      violations.push(`Nitrate exceeds BIS limit: ${no3Val} mg/L (BIS max: 45 mg/L)`);
    }
  }

  if (params.tds !== undefined && params.tds !== null && params.tds !== '') {
    const tdsVal = Number(params.tds);
    if (tdsVal > 2000) {
      score += 32;
      violations.push(`TDS exceeds permissible limit: ${tdsVal} mg/L (BIS max: 2000 mg/L)`);
    } else if (tdsVal > 500) {
      score += 14;
      violations.push(`TDS above acceptable limit: ${tdsVal} mg/L (BIS acceptable: 500 mg/L)`);
    }
  }

  if (params.turbidity !== undefined && params.turbidity !== null && params.turbidity !== '') {
    const turbVal = Number(params.turbidity);
    if (turbVal > 5) {
      score += 28;
      violations.push(`Turbidity exceeds permissible limit: ${turbVal} NTU (BIS max: 5 NTU)`);
    } else if (turbVal > 1) {
      score += 12;
      violations.push(`Turbidity above acceptable limit: ${turbVal} NTU (BIS acceptable: 1 NTU)`);
    }
  }

  if (params.ph !== undefined && params.ph !== null && params.ph !== '') {
    const phVal = Number(params.ph);
    if (phVal < 5.5 || phVal > 9.5) {
      score += 35;
      violations.push(`Severe pH imbalance: ${phVal} (BIS range: 6.5 - 8.5)`);
    } else if (phVal < 6.5 || phVal > 8.5) {
      score += 18;
      violations.push(`pH outside BIS acceptable range: ${phVal} (6.5 - 8.5)`);
    }
  }

  if (params.iron !== undefined && params.iron !== null && params.iron !== '') {
    const feVal = Number(params.iron);
    if (feVal > 1.0) {
      score += 24;
      violations.push(`High Iron contamination: ${feVal} mg/L (BIS acceptable: 0.3 mg/L)`);
    } else if (feVal > 0.3) {
      score += 10;
      violations.push(`Iron above acceptable limit: ${feVal} mg/L (BIS acceptable: 0.3 mg/L)`);
    }
  }

  // 2. Evaluate Health Symptom Clusters
  if (Array.isArray(symptoms.symptoms) && symptoms.symptoms.length > 0) {
    let symptomScore = 0;
    for (const sym of symptoms.symptoms) {
      symptomScore += SYMPTOM_WEIGHTS[sym] || 15;
    }
    const affectedCount = Number(symptoms.affected_count) || 1;
    if (affectedCount >= 10) {
      symptomScore *= 1.45;
      violations.push(`Community cluster: ${affectedCount} individuals reporting waterborne symptoms`);
    } else if (affectedCount >= 3) {
      symptomScore *= 1.25;
      violations.push(`Multiple cases (${affectedCount} people) reporting symptoms`);
    }
    if (symptoms.severity === 'severe') {
      symptomScore *= 1.25;
    }
    score += Math.min(75, symptomScore);
  }

  // 3. Evaluate Citizen Visual / Organoleptic Observations
  if (visualIssues.length > 0) {
    let visualScore = 0;
    for (const issue of visualIssues) {
      visualScore += VISUAL_ISSUE_WEIGHTS[issue] || 12;
    }
    score += Math.min(55, visualScore);
  }

  const finalScore = Math.min(100, Math.round(score * 10) / 10);
  return {
    score: finalScore,
    violations,
  };
}

/**
 * Aggregates all non-rejected reports for a water source to compute its live risk_score,
 * risk_level ('low', 'medium', 'high'), confidence_level ('low', 'medium', 'high'),
 * and latest BIS IS 10500 parameters.
 */
function calculateSourceAggregateRisk(reports, currentSourceStatus = 'reported') {
  const activeReports = (reports || []).filter(
    (r) => r.verification_status !== 'rejected'
  );

  if (activeReports.length === 0) {
    return {
      risk_score: 10,
      risk_level: 'low',
      confidence_level: 'low',
      latest_parameters: {},
      violations: [],
    };
  }

  // If the authority has explicitly marked the source 'resolved' and no newer pending/verified reports exist after resolution
  const unresolvedReports = activeReports.filter(
    (r) => r.verification_status !== 'resolved'
  );

  // Extract latest structured test parameters for source display
  let latestParams = {};
  const testReports = activeReports.filter(
    (r) => r.test_parameters && Object.keys(r.test_parameters).length > 0
  );
  if (testReports.length > 0) {
    latestParams = testReports[0].test_parameters;
  }

  if (currentSourceStatus === 'resolved' && unresolvedReports.length === 0) {
    return {
      risk_score: 12,
      risk_level: 'low',
      confidence_level: 'high',
      latest_parameters: latestParams,
      violations: [],
    };
  }

  const targetReports = unresolvedReports.length > 0 ? unresolvedReports : activeReports;

  let maxWeightedScore = 0;
  let weightedSum = 0;
  let totalWeight = 0;
  let allViolations = [];
  let hasVerifiedReport = false;
  let hasStructuredTest = false;

  for (const rep of targetReports) {
    const evalResult = evaluateSingleReport(rep);
    let weight = 1.0;

    if (rep.verification_status === 'verified') {
      weight *= 1.35;
      hasVerifiedReport = true;
    }
    if (rep.report_type === 'test_reading' || rep.reporter_role === 'tester' || rep.reporter_role === 'authority') {
      weight *= 1.25;
      hasStructuredTest = true;
    }

    const effectiveScore = Math.min(100, evalResult.score);
    if (effectiveScore > maxWeightedScore) {
      maxWeightedScore = effectiveScore;
    }
    weightedSum += effectiveScore * weight;
    totalWeight += weight;
    allViolations.push(...evalResult.violations);
  }

  const avgScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  // Combine peak contamination severity (70%) + weighted multi-report corroboration (30%) + report volume bonus
  const corroborationBonus = Math.min(12, (targetReports.length - 1) * 4);
  let aggregateScore = Math.min(100, Math.round((maxWeightedScore * 0.72 + avgScore * 0.28 + corroborationBonus) * 10) / 10);

  // Determine risk level
  let riskLevel = 'low';
  if (aggregateScore >= 65) {
    riskLevel = 'high';
  } else if (aggregateScore >= 35) {
    riskLevel = 'medium';
  }

  // Determine confidence level based on verification state, structured test kit data, and report count
  let confidenceLevel = 'low';
  if (hasVerifiedReport || (hasStructuredTest && targetReports.length >= 2) || targetReports.length >= 3) {
    confidenceLevel = 'high';
  } else if (hasStructuredTest || targetReports.length >= 2) {
    confidenceLevel = 'medium';
  }

  return {
    risk_score: aggregateScore,
    risk_level: riskLevel,
    confidence_level: confidenceLevel,
    latest_parameters: latestParams,
    violations: [...new Set(allViolations)],
  };
}

module.exports = {
  BIS_STANDARDS,
  evaluateSingleReport,
  calculateSourceAggregateRisk,
};
