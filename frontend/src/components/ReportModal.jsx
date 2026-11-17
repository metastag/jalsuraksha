import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  FlaskConical,
  HeartPulse,
  Upload,
  AlertCircle,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

const SYMPTOM_OPTIONS = [
  { id: 'diarrhea', label: 'Acute Diarrhea / Gastroenteritis' },
  { id: 'vomiting', label: 'Vomiting & Nausea' },
  { id: 'typhoid', label: 'Typhoid Fever' },
  { id: 'jaundice', label: 'Jaundice / Viral Hepatitis' },
  { id: 'cholera', label: 'Suspected Cholera' },
  { id: 'fluorosis', label: 'Dental / Skeletal Fluorosis' },
  { id: 'skin_lesions', label: 'Skin Rashes / Lesions' },
  { id: 'stomach_cramps', label: 'Abdominal Cramps' },
];

const VISUAL_OPTIONS = [
  { id: 'sewage_smell', label: 'Sewage / Faecal Odor' },
  { id: 'yellow_brown_color', label: 'Yellowish / Reddish-Brown Color' },
  { id: 'turbid_muddy', label: 'Cloudy / Muddy Turbidity' },
  { id: 'metallic_chemical_taste', label: 'Salty / Metallic / Chemical Taste' },
  { id: 'pipe_leakage_drain', label: 'Drain Overflow Near Base Platform' },
  { id: 'foul_odor', label: 'Foul Rotten Odor' },
];

export default function ReportModal({
  isOpen,
  onClose,
  sources,
  preselectedSource,
  preselectedCoords,
  onSuccess,
}) {
  const { user } = useAuth();

  const [sourceMode, setSourceMode] = useState('existing'); // 'existing' | 'new'
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [newSource, setNewSource] = useState({
    name: '',
    source_type: 'handpump',
    locality: 'Greater Noida',
    description: '',
    latitude: 28.4508,
    longitude: 77.5844,
  });
  const [nearbyDuplicates, setNearbyDuplicates] = useState([]);

  const [reportType, setReportType] = useState('symptom_report'); // 'symptom_report' | 'test_reading' | 'visual_complaint'
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');

  // Tester structured parameters (FR3)
  const [testParams, setTestParams] = useState({
    ph: '7.4',
    tds: '680',
    turbidity: '2.5',
    coliform: false,
    fluoride: '1.1',
    arsenic: '0.005',
    nitrate: '32',
    iron: '0.25',
  });

  // Citizen symptom & visual parameters (FR4)
  const [selectedSymptoms, setSelectedSymptoms] = useState(['diarrhea']);
  const [affectedCount, setAffectedCount] = useState(3);
  const [severity, setSeverity] = useState('moderate');
  const [selectedVisuals, setSelectedVisuals] = useState(['turbid_muddy']);
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setPhotoFile(null);
    const urlModal = new URLSearchParams(window.location.search).get('modal');
    if (urlModal === 'report_tester' || user?.role === 'tester' || user?.role === 'authority') {
      setReportType('test_reading');
    } else {
      setReportType('symptom_report');
    }

    if (preselectedSource) {
      setSourceMode('existing');
      setSelectedSourceId(String(preselectedSource.id));
    } else if (preselectedCoords) {
      setSourceMode('new');
      setNewSource((prev) => ({
        ...prev,
        latitude: preselectedCoords.latitude,
        longitude: preselectedCoords.longitude,
      }));
    } else if (sources.length > 0) {
      setSourceMode('existing');
      setSelectedSourceId(String(sources[0].id));
    }
  }, [isOpen, preselectedSource, preselectedCoords, sources, user]);

  // Spatial duplicate detection when registering a new source (Section 9 mitigation)
  useEffect(() => {
    if (!isOpen || sourceMode !== 'new') {
      setNearbyDuplicates([]);
      return;
    }
    const lat = parseFloat(newSource.latitude);
    const lng = parseFloat(newSource.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    apiFetch(`/sources/nearby?lat=${lat}&lng=${lng}&radius=250`)
      .then((data) => setNearbyDuplicates(data.nearby || []))
      .catch(() => setNearbyDuplicates([]));
  }, [isOpen, sourceMode, newSource.latitude, newSource.longitude]);

  if (!isOpen) return null;

  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleUseDeviceGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewSource((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
        }));
      },
      () => {
        // Fallback to Bennett University / Techzone-II coordinates
        setNewSource((prev) => ({ ...prev, latitude: 28.4506, longitude: 77.5842 }));
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!photoFile) {
        throw new Error('Please upload an image of the water source or test reading before submitting.');
      }

      const formData = new FormData();
      if (sourceMode === 'existing') {
        formData.append('source_id', selectedSourceId);
      } else {
        if (!newSource.name.trim()) {
          throw new Error('Please enter a name/landmark for the new water source.');
        }
        formData.append('new_source', JSON.stringify(newSource));
      }

      formData.append('report_type', reportType);
      formData.append('reporter_name', user ? user.name : reporterName || 'Anonymous Citizen');
      formData.append('reporter_phone', user ? user.phone || '' : reporterPhone);
      formData.append('notes', notes);

      if (reportType === 'test_reading') {
        formData.append(
          'test_parameters',
          JSON.stringify({
            ph: parseFloat(testParams.ph),
            tds: parseFloat(testParams.tds),
            turbidity: parseFloat(testParams.turbidity),
            coliform: Boolean(testParams.coliform),
            fluoride: parseFloat(testParams.fluoride),
            arsenic: parseFloat(testParams.arsenic),
            nitrate: parseFloat(testParams.nitrate),
            iron: parseFloat(testParams.iron),
          })
        );
      } else {
        formData.append(
          'symptom_data',
          JSON.stringify({
            symptoms: selectedSymptoms,
            affected_count: parseInt(affectedCount, 10) || 1,
            severity,
          })
        );
      }

      formData.append('visual_issues', JSON.stringify(selectedVisuals));
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const result = await apiFetch('/reports', {
        method: 'POST',
        body: formData,
      });

      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Submit Water Contamination / Field Test Report</h2>
            <p className="text-xs text-slate-400">
              Automatically scored against BIS IS 10500:2012 & routed to Gautam Buddha Nagar PHED
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Select Water Source or Register New Source (FR2) */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                1. Water Source Location (FR2)
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSourceMode('existing')}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${
                    sourceMode === 'existing'
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-300'
                  }`}
                >
                  Existing Monitored Source
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('new')}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${
                    sourceMode === 'new'
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-300'
                  }`}
                >
                  + Register New Source Pin
                </button>
              </div>
            </div>

            {sourceMode === 'existing' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Water Source</label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name} — {s.locality} (Current Risk: {s.risk_score}/100)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Source Name / Landmark *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dabra Primary School Handpump"
                      value={newSource.name}
                      onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Source Type *</label>
                    <select
                      value={newSource.source_type}
                      onChange={(e) => setNewSource({ ...newSource, source_type: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="handpump">Handpump (Mark-II / Bore)</option>
                      <option value="well">Open Well</option>
                      <option value="tank">Community Tank / Standpost</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Locality / Village</label>
                    <input
                      type="text"
                      value={newSource.locality}
                      onChange={(e) => setNewSource({ ...newSource, locality: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={newSource.latitude}
                      onChange={(e) => setNewSource({ ...newSource, latitude: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step="0.00001"
                        value={newSource.longitude}
                        onChange={(e) => setNewSource({ ...newSource, longitude: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={handleUseDeviceGps}
                        title="Use Device GPS"
                        className="px-2.5 py-1.5 rounded-lg bg-sky-100 text-sky-800 hover:bg-sky-200 font-semibold shrink-0"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {nearbyDuplicates.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                    <div className="font-bold">Nearby Existing Source Detected (within 250m):</div>
                    {nearbyDuplicates.map((d) => (
                      <div key={d.id} className="flex items-center justify-between mt-1">
                        <span>
                          [{d.code}] {d.name} ({d.distance_meters}m away)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSourceMode('existing');
                            setSelectedSourceId(String(d.id));
                          }}
                          className="text-sky-700 font-bold underline"
                        >
                          Use This Source Instead
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Choose Report Mode (Citizen Symptoms vs Tester BIS Field Kit) */}
          <div className="space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              2. Report Category (FR3 & FR4)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReportType('symptom_report')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  reportType === 'symptom_report'
                    ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-200'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <HeartPulse className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Citizen Symptom & Visual Report (FR4)</div>
                  <div className="text-[11px] opacity-80">
                    Report waterborne illness clusters, foul smell, or muddy/colored water
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportType('test_reading')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  reportType === 'test_reading'
                    ? 'bg-sky-50 border-sky-400 text-sky-950 ring-2 ring-sky-200'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <FlaskConical className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Tester BIS IS 10500 Field Kit Data (FR3)</div>
                  <div className="text-[11px] opacity-80">
                    Submit structured pH, TDS, Turbidity, Coliform, Fluoride, Arsenic, Nitrate
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Step 3: Dynamic Inputs based on Report Mode */}
          {reportType === 'test_reading' ? (
            <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-3">
              <div className="font-bold text-sky-950">
                BIS IS 10500:2012 Field Kit Readings
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">pH (6.5–8.5)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={testParams.ph}
                    onChange={(e) => setTestParams({ ...testParams, ph: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">TDS mg/L (≤500)</label>
                  <input
                    type="number"
                    step="10"
                    value={testParams.tds}
                    onChange={(e) => setTestParams({ ...testParams, tds: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Turbidity NTU (≤1)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={testParams.turbidity}
                    onChange={(e) => setTestParams({ ...testParams, turbidity: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Fluoride mg/L (≤1.0)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={testParams.fluoride}
                    onChange={(e) => setTestParams({ ...testParams, fluoride: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Arsenic mg/L (≤0.01)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={testParams.arsenic}
                    onChange={(e) => setTestParams({ ...testParams, arsenic: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Nitrate mg/L (≤45)</label>
                  <input
                    type="number"
                    step="1"
                    value={testParams.nitrate}
                    onChange={(e) => setTestParams({ ...testParams, nitrate: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Iron mg/L (≤0.3)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={testParams.iron}
                    onChange={(e) => setTestParams({ ...testParams, iron: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Coliform / E. coli</label>
                  <select
                    value={testParams.coliform ? 'present' : 'absent'}
                    onChange={(e) => setTestParams({ ...testParams, coliform: e.target.value === 'present' })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                  >
                    <option value="absent">Absent (Safe)</option>
                    <option value="present">PRESENT (Contaminated)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-3">
              <div className="font-bold text-rose-950">Observed Health Symptoms Linked to Water Source</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SYMPTOM_OPTIONS.map((sym) => (
                  <label
                    key={sym.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                      selectedSymptoms.includes(sym.id)
                        ? 'bg-rose-100 border-rose-400 text-rose-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSymptoms.includes(sym.id)}
                      onChange={() => toggleItem(selectedSymptoms, setSelectedSymptoms, sym.id)}
                    />
                    <span>{sym.label}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700">Estimated People Affected</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={affectedCount}
                    onChange={(e) => setAffectedCount(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Symptom Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate (Clinic visit needed)</option>
                    <option value="severe">Severe (Cluster / Hospitalization)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Visual Issues & Notes */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Visible / Organoleptic Water Issues</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VISUAL_OPTIONS.map((vis) => (
                <label
                  key={vis.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                    selectedVisuals.includes(vis.id)
                      ? 'bg-amber-50 border-amber-400 text-amber-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedVisuals.includes(vis.id)}
                    onChange={() => toggleItem(selectedVisuals, setSelectedVisuals, vis.id)}
                  />
                  <span>{vis.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Observation Notes / Field Remarks</label>
              <textarea
                rows={3}
                placeholder="Describe water appearance, smell, test kit observation, or household illness details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">
                Attach Field Test / Water Photo (FR3) <span className="text-red-600">* Required</span>
              </label>
              <input
                type="file"
                required
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-sky-50 file:text-sky-700 file:font-semibold hover:file:bg-sky-100 border border-slate-300 rounded-lg p-1"
              />
              {!photoFile && (
                <p className="text-[11px] text-amber-700 font-medium">
                  * Photo evidence is mandatory to submit a report.
                </p>
              )}
              {!user && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Your Name (Optional)"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Phone (Optional)"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md disabled:opacity-50"
            >
              {submitting ? 'Calculating Risk & Submitting...' : 'Submit Report & Calculate Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
