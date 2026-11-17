import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { apiFetch } from './api/client';
import Navbar from './components/Navbar';
import RiskMap from './components/RiskMap';
import SourceDetailDrawer from './components/SourceDetailDrawer';
import ReportModal from './components/ReportModal';
import AuthorityDashboard from './components/AuthorityDashboard';
import StandardsView from './components/StandardsView';

function PortalContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialView = urlParams.get('view') || 'map';
  const initialSource = urlParams.get('source') ? Number(urlParams.get('source')) : null;
  const initialModal = urlParams.get('modal');

  const [activeTab, setActiveTab] = useState(initialView); // 'map' | 'dashboard' | 'standards'
  const [sources, setSources] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    risk_level: 'all',
    source_type: 'all',
    status: 'all',
  });

  const [selectedSourceId, setSelectedSourceId] = useState(initialSource);
  const [sourceDetail, setSourceDetail] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(Boolean(initialModal));
  const [reportPreselectedSource, setReportPreselectedSource] = useState(null);
  const [reportPreselectedCoords, setReportPreselectedCoords] = useState(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [toastBanner, setToastBanner] = useState(null);

  const fetchSources = useCallback(async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const [srcRes, statsRes] = await Promise.all([
        apiFetch(`/sources?${query}`),
        apiFetch('/authority/stats'),
      ]);
      setSources(srcRes.sources || []);
      setUnreadAlertsCount(statsRes?.alerts?.unread_alerts || 0);
    } catch (err) {
      console.error('Error loading sources:', err);
    }
  }, [filters]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    if (!selectedSourceId) {
      setSourceDetail(null);
      return;
    }
    apiFetch(`/sources/${selectedSourceId}`)
      .then((data) => setSourceDetail(data))
      .catch((err) => console.error('Error loading source detail:', err));
  }, [selectedSourceId]);

  const handleOpenReportModal = (sourceObj = null, coords = null) => {
    setReportPreselectedSource(sourceObj);
    setReportPreselectedCoords(coords);
    setReportModalOpen(true);
  };

  const handleReportSuccess = async (result) => {
    await fetchSources();
    if (result?.source?.id) {
      setSelectedSourceId(result.source.id);
      const updatedDetail = await apiFetch(`/sources/${result.source.id}`);
      setSourceDetail(updatedDetail);
    }
    setToastBanner({
      title: `Report Submitted — Calculated Source Risk: ${result.source.risk_score}/100 (${result.source.risk_level.toUpperCase()})`,
      alertTriggered: Boolean(result.alert_triggered),
    });
    setTimeout(() => setToastBanner(null), 8000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={(src) => handleOpenReportModal(src, null)}
        unreadAlertsCount={unreadAlertsCount}
      />

      {toastBanner && (
        <div className="bg-emerald-700 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md">
          <div>
            <span>{toastBanner.title}</span>
            {toastBanner.alertTriggered && (
              <span className="ml-3 px-2 py-0.5 rounded bg-red-600 text-white font-bold uppercase text-[10px]">
                Automated PHED Alert Triggered
              </span>
            )}
          </div>
          <button onClick={() => setToastBanner(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1 relative">
        {activeTab === 'map' && (
          <RiskMap
            sources={sources}
            filters={filters}
            setFilters={setFilters}
            onSelectSource={(id) => setSelectedSourceId(id)}
            selectedSourceId={selectedSourceId}
            onOpenReportAtCoords={(coords) => handleOpenReportModal(null, coords)}
          />
        )}

        {activeTab === 'dashboard' && (
          <AuthorityDashboard
            sources={sources}
            onRefreshData={fetchSources}
            onSelectSourceOnMap={(id) => {
              setSelectedSourceId(id);
              setActiveTab('map');
            }}
          />
        )}

        {activeTab === 'standards' && <StandardsView />}

        {selectedSourceId && sourceDetail && activeTab === 'map' && (
          <SourceDetailDrawer
            sourceDetail={sourceDetail}
            onClose={() => setSelectedSourceId(null)}
            onReportForSource={(src) => handleOpenReportModal(src, null)}
          />
        )}
      </main>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        sources={sources}
        preselectedSource={reportPreselectedSource}
        preselectedCoords={reportPreselectedCoords}
        onSuccess={handleReportSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PortalContent />
    </AuthProvider>
  );
}
