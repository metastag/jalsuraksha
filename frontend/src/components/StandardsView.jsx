import React from 'react';
import { Award, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function StandardsView() {
  const rows = [
    { param: 'pH Value', acceptable: '6.5 – 8.5', permissible: 'No relaxation', healthImpact: 'Corrosion of pipes (<6.5), bitter taste & mucous membrane irritation (>8.5)', weight: 'Up to +35 pts' },
    { param: 'Total Dissolved Solids (TDS)', acceptable: '≤ 500 mg/L', permissible: '≤ 2000 mg/L', healthImpact: 'Gastrointestinal irritation, saline taste, scaling in containers', weight: '+14 to +32 pts' },
    { param: 'Turbidity', acceptable: '≤ 1 NTU', permissible: '≤ 5 NTU', healthImpact: 'Shields pathogenic microorganisms from disinfection and indicates runoff seepage', weight: '+12 to +28 pts' },
    { param: 'Total Coliform / E. coli', acceptable: '0 / 100 mL (Absent)', permissible: '0 / 100 mL (Absent)', healthImpact: 'Immediate risk of acute diarrheal disease, cholera, typhoid, and hepatitis A/E', weight: '+65 pts (Critical)' },
    { param: 'Fluoride (F⁻)', acceptable: '≤ 1.0 mg/L', permissible: '≤ 1.5 mg/L', healthImpact: 'Dental mottling (>1.0 mg/L) and crippling skeletal fluorosis (>1.5 mg/L)', weight: '+22 to +45 pts' },
    { param: 'Arsenic (As)', acceptable: '≤ 0.01 mg/L', permissible: '≤ 0.05 mg/L', healthImpact: 'Skin lesions, keratosis, peripheral neuropathy, and elevated cancer risk', weight: '+42 to +60 pts' },
    { param: 'Nitrate (NO₃⁻)', acceptable: '≤ 45 mg/L', permissible: 'No relaxation', healthImpact: 'Methemoglobinemia (blue-baby syndrome) in infants; agricultural/sewage leaching indicator', weight: '+38 pts' },
    { param: 'Iron (Fe)', acceptable: '≤ 0.3 mg/L', permissible: '≤ 1.0 mg/L', healthImpact: 'Reddish-brown discoloration, metallic taste, promotes iron-bacteria growth', weight: '+10 to +24 pts' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
          <Award className="w-4 h-4" />
          Bureau of Indian Standards (BIS IS 10500:2012)
        </div>
        <h1 className="text-2xl font-extrabold mt-1">
          Water Quality Risk Scoring & Threshold Specification
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
          JalSuraksha (Group G315) computes a composite Risk Score (0–100) and Confidence Level (Low, Medium, High) for each community water source by combining structured field test kit parameters (calibrated to BIS IS 10500:2012), recent citizen symptom clusters, and PHED verification states.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[11px]">
              <th className="p-4">Parameter</th>
              <th className="p-4">BIS Acceptable Limit</th>
              <th className="p-4">BIS Permissible Limit</th>
              <th className="p-4">Health & Contamination Significance</th>
              <th className="p-4">Risk Engine Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.param} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900">{r.param}</td>
                <td className="p-4 text-emerald-700 font-semibold">{r.acceptable}</td>
                <td className="p-4 text-amber-800 font-semibold">{r.permissible}</td>
                <td className="p-4 text-slate-600">{r.healthImpact}</td>
                <td className="p-4 font-mono font-bold text-slate-800">{r.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
