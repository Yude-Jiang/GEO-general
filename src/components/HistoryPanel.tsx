import React, { useState } from 'react';
import {
  Clock, X, Eye, Trash2, RotateCcw, FileText, BookOpen, PenTool,
  Search, AlertTriangle,
} from 'lucide-react';
import { useHistoryStore } from '../store/historyStore';
import { useWorkflowStore } from '../store/workflowStore';
import type { HistoryEntry } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

type DetailTab = 'overview' | 'diagnosis' | 'strategy' | 'content';

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, t }) => {
  const { entries, deleteEntry } = useHistoryStore();
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const h = t.history;
  const th = t.diagnosis; // reuse diagnosis translations for display

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStepBadge = (entry: HistoryEntry) => {
    if (entry.finalContent) {
      return { label: h.contentComplete, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    if (entry.selectedPlaybooks.length > 0) {
      return { label: h.strategyComplete, cls: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    return { label: h.diagnosisOnly, cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  };

  const getStepIcon = (entry: HistoryEntry) => {
    if (entry.finalContent) return <PenTool className="w-3.5 h-3.5" />;
    if (entry.selectedPlaybooks.length > 0) return <BookOpen className="w-3.5 h-3.5" />;
    return <Search className="w-3.5 h-3.5" />;
  };

  const handleLoad = (entry: HistoryEntry) => {
    const store = useWorkflowStore.getState();
    store.setSeedKeywords(entry.seedKeywords);
    store.setTargetEcosystem(entry.ecosystem as any);
    store.setUiLang(entry.uiLang as any);
    if (entry.diagnosisResult) {
      store.setDiagnosisResult(entry.diagnosisResult);
      store.setDiagnosisConfirmed(true);
    }
    if (entry.selectedMonitoringQuestions.length > 0) {
      store.setSelectedMonitoringQuestions(entry.selectedMonitoringQuestions);
    }
    if (entry.selectedPlaybooks.length > 0) {
      store.setSelectedPlaybooks(entry.selectedPlaybooks);
      store.setStrategyConfirmed(true);
    }
    if (entry.finalContent) {
      store.setFinalContent(entry.finalContent);
    }
    onClose();
    alert(h.loadSuccess);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteEntry(id);
      setConfirmDelete(null);
      if (selectedEntry?.id === id) setSelectedEntry(null);
    } else {
      setConfirmDelete(id);
    }
  };

  // ── Detail View ────────────────────────────────────────────────────────────

  if (selectedEntry) {
    const entry = selectedEntry;
    const tabs: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
      { key: 'overview', label: h.overview, icon: <FileText className="w-3.5 h-3.5" /> },
      { key: 'diagnosis', label: h.diagnosisTab, icon: <Search className="w-3.5 h-3.5" /> },
      { key: 'strategy', label: h.strategyTab, icon: <BookOpen className="w-3.5 h-3.5" /> },
      { key: 'content', label: h.contentTab, icon: <PenTool className="w-3.5 h-3.5" /> },
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedEntry(null); }}>
        <div className="bg-white w-full max-w-5xl mx-4 rounded-3xl shadow-2xl border border-slate-100 flex flex-col animate-fade-in"
          style={{ maxHeight: '90vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-slate-900 p-2 rounded-xl flex-shrink-0">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 truncate">
                  {entry.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  {formatDate(entry.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLoad(entry)}
                className="flex items-center gap-1.5 text-xs font-black text-blue-600 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {h.loadBtn}
              </button>
              <button
                onClick={() => { setSelectedEntry(null); }}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-6 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDetailTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${
                  detailTab === tab.key
                    ? 'text-slate-900 border-slate-900'
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {detailTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{h.atStep}</p>
                    <p className="text-lg font-black text-slate-900 mt-1">
                      {entry.step === 3 ? '3' : entry.step === 2 ? '2' : '1'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.ecosystemLabel}</p>
                    <p className="text-sm font-black text-slate-900 mt-1">{entry.ecosystem}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.strategy.inherited}</p>
                    <p className="text-lg font-black text-slate-900 mt-1">{entry.selectedMonitoringQuestions.length}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.production.inherited}</p>
                    <p className="text-lg font-black text-slate-900 mt-1">{entry.selectedPlaybooks.length}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.diagnosis.seedLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.seedKeywords.map((kw, i) => (
                      <span key={i} className="text-[11px] font-bold bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'diagnosis' && (
              <div className="space-y-4">
                {entry.diagnosisResult ? (
                  <>
                    {/* Executive Summary */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                      <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-3">{th.strategyInsight}</h4>
                      <div className="space-y-3">
                        {entry.diagnosisResult.strategyReport?.executiveSummary && (
                          <>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{th.execSummary.marketPulse}</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {entry.diagnosisResult.strategyReport.executiveSummary.marketPulse}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{th.execSummary.coreRoadblocks}</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {entry.diagnosisResult.strategyReport.executiveSummary.coreRoadblocks}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{th.execSummary.keyInsight}</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {entry.diagnosisResult.strategyReport.executiveSummary.keyInsight}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Intent Clusters */}
                    {entry.diagnosisResult.intentClusters?.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{th.intentCluster.title}</h4>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {entry.diagnosisResult.intentClusters.map((cluster, i) => (
                            <div key={i} className="p-5">
                              <p className="text-sm font-black text-blue-900 mb-2">{cluster.intentName}</p>
                              <p className="text-xs text-slate-500 mb-3">{cluster.coreProposition}</p>
                              {cluster.monitoringQuestions?.length > 0 && (
                                <div className="space-y-2">
                                  {cluster.monitoringQuestions.slice(0, 3).map((mq, j) => (
                                    <div key={j} className="bg-slate-50 rounded-xl p-3 text-xs">
                                      <p className="font-bold text-slate-700">{mq.userPrompt}</p>
                                      <p className="text-emerald-600 font-mono mt-1 text-[11px]">{mq.expectedAnchor}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Competitor Analysis */}
                    {entry.diagnosisResult.competitorAnalysis?.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{th.competitorIntel.title}</h4>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {entry.diagnosisResult.competitorAnalysis.map((comp, i) => (
                            <div key={i} className="p-5 flex items-start gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-black text-slate-900">{comp.competitorName}</p>
                                <p className="text-xs text-slate-500 mt-1">{comp.aiPerception}</p>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                                comp.threatLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                                comp.threatLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {comp.threatLevel}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">{h.noDiagnosis}</p>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'strategy' && (
              <div className="space-y-3">
                {entry.selectedPlaybooks.length > 0 ? (
                  entry.selectedPlaybooks.map((pb, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">{i + 1}.</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          pb.tacticsType.includes('Authority') ? 'bg-blue-50 border-blue-100 text-blue-700' :
                          pb.tacticsType.includes('Scenario') ? 'bg-amber-50 border-amber-100 text-amber-700' :
                          'bg-indigo-50 border-indigo-100 text-indigo-700'
                        }`}>
                          {pb.tacticsType}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mb-1">{pb.sourceLogic}</p>
                      <p className="text-xs text-slate-500 mb-3">{pb.geoAction}</p>
                      <p className="text-[11px] text-slate-600 font-mono bg-slate-50 rounded-xl p-3 leading-relaxed">
                        {pb.targetSnippet}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">{h.noStrategy}</p>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'content' && (
              <div>
                {entry.finalContent ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="prose prose-sm max-w-none prose-slate prose-headings:text-slate-900 prose-headings:font-black prose-p:leading-relaxed prose-code:font-mono prose-code:text-[11px] whitespace-pre-wrap break-words">
                      {entry.finalContent}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <PenTool className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">{h.noContent}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-bold">
              {h.saved} {formatDate(entry.updatedAt)}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDelete(entry.id)}
                className="flex items-center gap-1.5 text-xs font-black text-red-500 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> {confirmDelete === entry.id ? h.deleteConfirm : h.deleteBtn}
              </button>
              <button
                onClick={() => { setSelectedEntry(null); }}
                className="text-xs font-black text-slate-400 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {h.closeBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-2xl mx-4 rounded-3xl shadow-2xl border border-slate-100 flex flex-col animate-fade-in"
        style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{h.title}</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {entries.length}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Empty State */}
        {entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-base font-black text-slate-900 mb-2">{h.empty}</p>
            <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">{h.emptyHint}</p>
          </div>
        ) : (
          /* Entry List */
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {entries.map((entry) => {
              const badge = getStepBadge(entry);
              return (
                <div key={entry.id}
                  className="group bg-white border border-slate-100 rounded-2xl p-4 hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getStepIcon(entry)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{entry.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{formatDate(entry.createdAt)}</span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {entry.ecosystem}
                        </span>
                      </div>
                      {entry.seedKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.seedKeywords.slice(0, 4).map((kw, i) => (
                            <span key={i} className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                              {kw}
                            </span>
                          ))}
                          {entry.seedKeywords.length > 4 && (
                            <span className="text-[10px] text-slate-400">+{entry.seedKeywords.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title={h.viewBtn}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleLoad(entry)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title={h.loadBtn}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title={h.deleteBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {confirmDelete === entry.id && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="flex-1">{h.deleteConfirm}</span>
                      <button onClick={() => handleDelete(entry.id)} className="font-black text-red-700 hover:text-red-800">
                        {h.deleteBtn}
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="font-bold text-slate-400 hover:text-slate-600">
                        {h.closeBtn}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {entries.length > 0 && (
          <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-bold">{entries.length} {h.saved}</span>
            <button onClick={onClose} className="text-xs font-black text-slate-400 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
              {h.closeBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
