import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Bell,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  FileCheck,
  XCircle,
  MailCheck,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AuthorityDashboard({
  sources,
  onRefreshData,
  onSelectSourceOnMap,
}) {
  const { user, quickDemoSwitch } = useAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const initialSubTab = new URLSearchParams(window.location.search).get('subtab') || 'alerts';
  const [subTab, setSubTab] = useState(initialSubTab); // 'alerts' | 'sources' | 'reports'
  const [statusFilter, setStatusFilter] = useState('all');
  const [remarkInputs, setRemarkInputs] = useState({});
  const [actionMessage, setActionMessage] = useState('');

  const canAct = user && (user.role === 'authority' || user.role === 'admin');

  const loadDashboard = async () => {
    try {
      const [st, al, rp] = await Promise.all([
        apiFetch('/authority/stats'),
        apiFetch('/authority/alerts'),
        apiFetch('/reports'),
      ]);
      setStats(st);
      setAlerts(al.alerts || []);
      setReports(rp.reports || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [sources]);

  const handleAlertStatus = async (alertId, status) => {
    try {
      await apiFetch(`/authority/alerts/${alertId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setActionMessage(`Alert #${alertId} marked as ${status}.`);
      await loadDashboard();
      onRefreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSourceStatus = async (sourceId, status) => {
    try {
      const authority_notes = remarkInputs[`src_${sourceId}`] || undefined;
      await apiFetch(`/authority/sources/${sourceId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, authority_notes }),
      });
      setActionMessage(`Water Source #${sourceId} updated to "${status.replace('_', ' ')}".`);
      await loadDashboard();
      onRefreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyReport = async (reportId, verification_status) => {
    try {
      const authority_remark = remarkInputs[`rep_${reportId}`] || undefined;
      await apiFetch(`/authority/reports/${reportId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ verification_status, authority_remark }),
      });
      setActionMessage(`Report #${reportId} marked as ${verification_status}.`);
      await loadDashboard();
      onRefreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredSources = sources.filter(
    (s) => statusFilter === 'all' || s.status === statusFilter
  );

  return (
    <div className="max-w-[1500px] mx-auto p-5 space-y-6">
      {/* Top Role Banner if user is not logged in as Authority/Admin */}
      {!canAct && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong>Read-Only Public Transparency Mode:</strong> You are currently viewing the PHED Dashboard as{' '}
              <span className="font-bold uppercase">{user ? user.role : 'Anonymous Citizen'}</span>. Switch to the{' '}
              <strong>PHED Officer</strong> role to verify reports, acknowledge alerts, and update source treatment status.
            </div>
          </div>
          <button
            onClick={() => quickDemoSwitch('authority')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow"
          >
            Switch to PHED Authority Role (1-Click)
          </button>
        </div>
      )}

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-emerald-700 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Summary Cards (FR6) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold uppercase text-slate-500">Monitored Sources</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.sources.total_sources}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Gautam Buddha Nagar</div>
          </div>

          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 shadow-sm">
            <div className="text-[11px] font-bold uppercase text-red-700">High-Risk Unsafe</div>
            <div className="text-2xl font-extrabold text-red-900 mt-1">{stats.sources.high_risk_sources}</div>
            <div className="text-[11px] text-red-700 mt-0.5">Immediate Action Needed</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm">
            <div className="text-[11px] font-bold uppercase text-amber-800">Unread PHED Alerts</div>
            <div className="text-2xl font-extrabold text-amber-900 mt-1">{stats.alerts.unread_alerts}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">{stats.alerts.active_critical_alerts} Critical Severity</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-sm">
            <div className="text-[11px] font-bold uppercase text-blue-800">Pending Reports</div>
            <div className="text-2xl font-extrabold text-blue-900 mt-1">{stats.reports.pending_reports}</div>
            <div className="text-[11px] text-blue-700 mt-0.5">Awaiting Verification</div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 shadow-sm">
            <div className="text-[11px] font-bold uppercase text-purple-800">Under Treatment</div>
            <div className="text-2xl font-extrabold text-purple-900 mt-1">{stats.sources.under_treatment_sources}</div>
            <div className="text-[11px] text-purple-700 mt-0.5">Field Crew Dispatched</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
            <div className="text-[11px] font-bold uppercase text-emerald-800">Safe / Resolved</div>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1">{stats.sources.safe_sources}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">BIS IS 10500 Compliant</div>
          </div>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('alerts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'alerts'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            1. Automated Alert Center ({alerts.length})
          </button>
          <button
            onClick={() => setSubTab('sources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'sources'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            2. Source Treatment Status Workflow ({sources.length})
          </button>
          <button
            onClick={() => setSubTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'reports'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            3. Report Verification & Moderation Queue ({reports.length})
          </button>
        </div>

        <button
          onClick={loadDashboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* Tab 1: Automated Alert Center (FR5) */}
      {subTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.map((al) => (
            <div
              key={al.id}
              className={`p-4 rounded-2xl border shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                al.status === 'resolved'
                  ? 'bg-slate-50 border-slate-200 opacity-75'
                  : al.severity === 'critical'
                  ? 'bg-red-50/60 border-red-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      al.severity === 'critical'
                        ? 'bg-red-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {al.severity} ALERT
                  </span>
                  <span className="font-mono font-bold text-slate-700">[{al.source_code}]</span>
                  <span className="font-bold text-slate-900 text-sm">{al.title}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 flex items-center gap-1">
                    <MailCheck className="w-3 h-3 text-emerald-600" />
                    {al.notification_channel}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{al.message}</p>
                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                  <span>Jurisdiction: {al.assigned_jurisdiction}</span>
                  <span>•</span>
                  <span>Triggered: {new Date(al.created_at).toLocaleString()}</span>
                  <span>•</span>
                  <span className="uppercase font-bold">Alert Status: {al.status}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
                <button
                  onClick={() => onSelectSourceOnMap(al.source_id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Locate on Map
                </button>
                {canAct && al.status === 'unread' && (
                  <button
                    onClick={() => handleAlertStatus(al.id, 'acknowledged')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
                  >
                    Acknowledge Alert
                  </button>
                )}
                {canAct && al.status !== 'resolved' && (
                  <button
                    onClick={() => handleAlertStatus(al.id, 'resolved')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Mark Alert Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Source Treatment Status Workflow (FR6) */}
      {subTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Filter by Treatment Status:</span>
            {['all', 'reported', 'verified', 'under_treatment', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize ${
                  statusFilter === st
                    ? 'bg-sky-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5">Risk Score & Confidence</th>
                  <th className="p-3.5">Current Status</th>
                  <th className="p-3.5">PHED Treatment Notes</th>
                  <th className="p-3.5">Update Workflow Status (FR6)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5">
                      <div className="font-mono text-[10px] font-bold text-slate-500">{src.code} • {src.source_type.toUpperCase()}</div>
                      <div className="font-bold text-slate-900 text-sm">{src.name}</div>
                      <div className="text-slate-500">{src.locality}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block font-extrabold px-2.5 py-0.5 rounded-full uppercase text-[11px] ${
                          src.risk_level === 'high'
                            ? 'bg-red-100 text-red-800'
                            : src.risk_level === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {src.risk_score}/100 ({src.risk_level})
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1 capitalize">
                        {src.confidence_level} confidence • {src.report_count || 0} reports
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg font-bold capitalize bg-slate-100 text-slate-800 border border-slate-200">
                        {src.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <input
                        type="text"
                        disabled={!canAct}
                        placeholder={src.authority_notes || 'Add treatment/chlorination remark...'}
                        value={remarkInputs[`src_${src.id}`] ?? ''}
                        onChange={(e) =>
                          setRemarkInputs({ ...remarkInputs, [`src_${src.id}`]: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                      {src.authority_notes && (
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          Current: {src.authority_notes}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          disabled={!canAct}
                          onClick={() => handleSourceStatus(src.id, 'verified')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-40"
                        >
                          Verify
                        </button>
                        <button
                          disabled={!canAct}
                          onClick={() => handleSourceStatus(src.id, 'under_treatment')}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold disabled:opacity-40"
                        >
                          Dispatch Treatment
                        </button>
                        <button
                          disabled={!canAct}
                          onClick={() => handleSourceStatus(src.id, 'resolved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-40"
                        >
                          Mark Resolved (Safe)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Citizen & Tester Report Verification Queue */}
      {subTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <th className="p-3.5">Report & Source</th>
                <th className="p-3.5">Reporter & Type</th>
                <th className="p-3.5">Findings / Notes</th>
                <th className="p-3.5">Impact Score</th>
                <th className="p-3.5">Verification Status</th>
                <th className="p-3.5">Moderate / Verify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="p-3.5">
                    <div className="font-mono text-[10px] font-bold text-slate-500">
                      Report #{r.id} • {r.source_code}
                    </div>
                    <div className="font-bold text-slate-900">{r.source_name}</div>
                    <div className="text-slate-500">{r.locality}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{r.reporter_name}</div>
                    <span className="inline-block mt-0.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {r.report_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-md">
                    <p className="text-slate-700">{r.notes}</p>
                  </td>
                  <td className="p-3.5 font-extrabold text-slate-900">
                    {r.calculated_report_risk}/100
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        r.verification_status === 'verified'
                          ? 'bg-blue-100 text-blue-800'
                          : r.verification_status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.verification_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.verification_status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex gap-1.5">
                      <button
                        disabled={!canAct}
                        onClick={() => handleVerifyReport(r.id, 'verified')}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-40"
                      >
                        Verify
                      </button>
                      <button
                        disabled={!canAct}
                        onClick={() => handleVerifyReport(r.id, 'rejected')}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold disabled:opacity-40"
                      >
                        Reject Spam
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
