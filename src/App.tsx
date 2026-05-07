import React from 'react';
import { useWorkflowStore } from './store/workflowStore';
import type { Ecosystem } from './store/workflowStore';
import type { UILang } from './i18n/translations';
import { translations } from './i18n/translations';
import { Globe, BookOpen, PenTool, Languages, Zap, Search, Layers, Clock } from 'lucide-react';
import StepDiagnosis from './components/StepDiagnosis';
import StepStrategy from './components/StepStrategy';
import StepProduction from './components/StepProduction';
import StandaloneMode from './components/StandaloneMode';
import ChatAssistant from './components/ChatAssistant';
import HistoryPanel from './components/HistoryPanel';

const App: React.FC = () => {
  const { currentStep, targetEcosystem, setTargetEcosystem, setStep, diagnosisConfirmed, strategyConfirmed, uiLang, setUiLang, standaloneMode, setStandaloneMode } = useWorkflowStore();
  const t = translations[uiLang];
  const [showHistory, setShowHistory] = React.useState(false);

  const ecosystems: { id: Ecosystem; label: string }[] = [
    { id: 'global', label: t.ecosystems.global },
    { id: 'cn',     label: t.ecosystems.cn },
  ];

  const uiLangs: { id: UILang; label: string }[] = [
    { id: 'zh', label: '中文' },
    { id: 'en', label: 'EN' },
  ];

  const canGoToStep = (step: number) => {
    if (step === 1) return true;
    if (step === 2) return diagnosisConfirmed;
    if (step === 3) return strategyConfirmed;
    return false;
  };

  const handleStepClick = (step: 1 | 2 | 3) => {
    if (canGoToStep(step)) setStep(step);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-slate-900 text-white shadow-xl z-20 sticky top-0">
        <div className="max-w-[98%] mx-auto px-4 h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-blue-500 p-1.5 rounded-sm shadow-inner">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-black tracking-tight leading-tight uppercase">{t.appTitle}</h1>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em]">{t.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border transition-all bg-slate-800 text-gray-300 border-gray-400/30 hover:text-white hover:border-white/30"
            >
              <Clock className="w-3.5 h-3.5" />
              {t.history?.title || 'History'}
            </button>

            {/* Standalone Mode Toggle */}
            <button
              onClick={() => setStandaloneMode(!standaloneMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border transition-all ${
                standaloneMode
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-slate-800 text-gray-300 border-gray-400/30 hover:text-white hover:border-white/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {standaloneMode ? t.standalone.backToWizard : t.standalone.modeLabel}
            </button>

            {/* UI Language Switcher */}
            <div className="flex items-center bg-slate-800 rounded p-0.5 border border-gray-400/20">
              <Languages className="w-3.5 h-3.5 text-gray-400 mx-1.5" />
              {uiLangs.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setUiLang(l.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    uiLang === l.id
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Ecosystem Switcher */}
            <div className="flex items-center bg-indigo-800 rounded p-0.5 border border-gray-400/30">
              <div className="px-2 text-[10px] font-black text-gray-300 uppercase flex items-center gap-1 border-r border-gray-400/30 mr-0.5 pr-2">
                <Globe className="w-3 h-3" /> {t.ecosystemLabel}
              </div>
              {ecosystems.map((eco) => (
                <button
                  key={eco.id}
                  onClick={() => setTargetEcosystem(eco.id as Ecosystem)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    targetEcosystem === eco.id
                      ? 'bg-blue-500 text-white shadow-md scale-105'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {eco.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Wizard Progress Bar — hidden in standalone mode */}
      {!standaloneMode && (
        <div className="bg-white border-b border-gray-100 py-5 shadow-sm z-10 relative">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-[16.6%] right-[16.6%] h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
              <div
                className="absolute top-1/2 left-[16.6%] h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out"
                style={{ width: `${(currentStep - 1) * 33.3}%` }}
              />
              {[
                { num: 1 as const, label: t.steps.diagnosis, icon: Search },
                { num: 2 as const, label: t.steps.strategy, icon: BookOpen },
                { num: 3 as const, label: t.steps.production, icon: PenTool },
              ].map((step) => {
                const isActive = currentStep === step.num;
                const isPast = currentStep > step.num;
                const canClick = canGoToStep(step.num);
                return (
                  <div key={step.num} className="relative z-10 flex flex-col items-center gap-1.5 bg-white px-3">
                    <button
                      onClick={() => handleStepClick(step.num)}
                      disabled={!canClick && !isActive}
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                        isActive ? 'bg-blue-900 text-white shadow-lg ring-4 ring-blue-500/20 scale-110'
                        : isPast  ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <step.icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                    </button>
                    <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${
                      isActive ? 'text-blue-800' : isPast ? 'text-green-600' : 'text-gray-300'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[95%] mx-auto px-4 py-8">
        {standaloneMode
          ? <StandaloneMode t={t} />
          : <>
              {currentStep === 1 && <StepDiagnosis t={t} />}
              {currentStep === 2 && <StepStrategy t={t} />}
              {currentStep === 3 && <StepProduction t={t} />}
            </>
        }
      </main>

      <footer className="border-t border-gray-200 py-6 text-center bg-white">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em]">{t.footer}</p>
        <p className="text-[10px] text-gray-300 mt-1 tracking-wide">GEO Strategic Hub</p>
      </footer>
      
      <ChatAssistant />
      <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} t={t} />
    </div>
  );
};

export default App;
