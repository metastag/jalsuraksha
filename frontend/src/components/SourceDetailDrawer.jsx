import React from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Wrench,
  FileText,
  FlaskConical,
  HeartPulse,
  MapPin,
  Clock,
  PlusCircle,
  Info,
} from 'lucide-react';

const PARAM_SPECS = [
  { key: 'ph', label: 'pH Level', unit: '', limitText: '6.5 – 8.5', check: (v) => v < 6.5 || v > 8.5 },
  { key: 'tds', label: 'TDS', unit: 'mg/L', limitText: '≤ 500 (Max 2000)', check: (v) => v > 500 },
  { key: 'turbidity', label: 'Turbidity', unit: 'NTU', limitText: '≤ 1.0 (Max 5.0)', check: (v) => v > 1.0 },
  { key: 'coliform', label: 'Coliform / E. coli', unit: '', limitText: 'Absent (0/100mL)', check: (v) => v === true || v === 'present' },
  { key: 'fluoride', label: 'Fluoride (F⁻)', unit: 'mg/L', limitText: '≤ 1.0 (Max 1.5)', check: (v) => v > 1.0 },
  { key: 'arsenic', label: 'Arsenic (As)', unit: 'mg/L', limitText: '≤ 0.01', check: (v) => v > 0.01 },
  { key: 'nitrate', label: 'Nitrate (NO₃⁻)', unit: 'mg/L', limitText: '≤ 45', check: (v) => v > 45 },
  { key: 'iron', label: 'Iron (Fe)', unit: 'mg/L', limitText: '≤ 0.3', check: (v) => v > 0.3 },
];

export default function SourceDetailDrawer({
  sourceDetail,
  onClose,
  onReportForSource,
}) {
  if (!sourceDetail || !sourceDetail.source) return null;

  const { source, reports = [], alerts = [] } = sourceDetail;
  const params = source.latest_parameters || {};

  const riskBadge = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  }[source.risk_level] || 'bg-slate-100 text-slate-800';

  const statusBadge = {
    reported: { label: 'Reported (Awaiting Inspection)', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    verified: { label: 'Verified by Tester / Authority', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    under_treatment: { label: 'Under PHED Treatment', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    resolved: { label: 'Treated & Resolved (Safe)', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }[source.status] || { label: source.status, cls: 'bg-slate-100 text-slate-700' };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
              {source.code}
            </span>
            <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {source.source_type}
            </span>
          </div>
          <h2 className="text-lg font-bold mt-1">{source.name}</h2>
          <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            {source.locality} ({Number(source.latitude).toFixed(4)}°N, {Number(source.longitude).toFixed(4)}°E)
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Risk Score & Status Banner */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500">Risk Score</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900">{source.risk_score}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <span className={`inline-block mt-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${riskBadge}`}>
              {source.risk_level} Risk
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500">Data Confidence</span>
            <div className="mt-1 font-bold text-sm capitalize text-slate-800">
              {source.confidence_level} Confidence
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Based on {reports.length} report(s)
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500">PHED Status</span>
            <div className="mt-1">
              <span className={`inline-block text-[11px] font-semibold px-2 py-1 rounded-lg border ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Indicative Risk Legal Disclaimer (Section 7.4 of Milestone-1) */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Public Safety Notice:</strong> Risk scores are indicative and crowd-assisted based on BIS IS 10500 thresholds and citizen symptom reports. If marked <strong>High Risk</strong>, avoid direct consumption until PHED laboratory verification and treatment are completed.
          </div>
        </div>

        {/* Authority Action Remark if present */}
        {source.authority_notes && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950">
            <div className="font-bold flex items-center gap-1.5 text-blue-800 mb-1">
              <Wrench className="w-4 h-4" />
              Official PHED / Water Authority Update:
            </div>
            <p>{source.authority_notes}</p>
          </div>
        )}

        {/* BIS IS 10500 Parameter Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-sky-600" />
              Latest BIS IS 10500:2012 Test Readings
            </h3>
            {source.last_tested_at && (
              <span className="text-[11px] text-slate-500">
                Updated: {new Date(source.last_tested_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {Object.keys(params).length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
              No structured chemical/bacterial test reading submitted yet for this source.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {PARAM_SPECS.map((spec) => {
                const rawVal = params[spec.key];
                if (rawVal === undefined || rawVal === null || rawVal === '') return null;
                const isViolation = spec.check(rawVal);
                const displayVal =
                  spec.key === 'coliform'
                    ? rawVal === true || rawVal === 'present'
                      ? 'PRESENT (Unsafe)'
                      : 'Absent (Safe)'
                    : `${rawVal} ${spec.unit}`;

                return (
                  <div
                    key={spec.key}
                    className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                      isViolation
                        ? 'bg-red-50/70 border-red-200 text-red-900'
                        : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{spec.label}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isViolation ? 'bg-red-200 text-red-900' : 'bg-emerald-200 text-emerald-900'
                        }`}
                      >
                        {isViolation ? 'EXCEEDS BIS' : 'OK'}
                      </span>
                    </div>
                    <div className="text-sm font-bold mt-1">{displayVal}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">BIS Limit: {spec.limitText}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chronological Report History (FR9) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600" />
              Community & Tester Report History ({reports.length})
            </h3>
            <button
              onClick={() => onReportForSource(source)}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Report for Source
            </button>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => {
              const symList = rep.symptom_data?.symptoms || [];
              const visList = Array.isArray(rep.visual_issues) ? rep.visual_issues : [];

              return (
                <div
                  key={rep.id}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{rep.reporter_name}</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {rep.report_type.replace('_', ' ')}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        rep.verification_status === 'verified'
                          ? 'bg-blue-100 text-blue-800'
                          : rep.verification_status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rep.verification_status}
                    </span>
                  </div>

                  {rep.notes && <p className="text-slate-700 leading-relaxed">{rep.notes}</p>}

                  {symList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5" />
                        Symptoms ({rep.symptom_data?.affected_count || 1} affected):
                      </span>
                      {symList.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 capitalize"
                        >
                          {s.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {visList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {visList.map((v) => (
                        <span
                          key={v}
                          className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 capitalize"
                        >
                          {v.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {rep.photo_url && (
                    <div className="pt-1">
                      <img
                        src={rep.photo_url}
                        alt="Submitted water evidence"
                        className="h-32 rounded-lg object-cover border border-slate-200"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Report Risk Impact: {rep.calculated_report_risk}/100</span>
                    <span>{new Date(rep.created_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
