import React, { useState } from 'react';
import { Upload, Link as LinkIcon, FileText, X, Loader2, Globe, ShieldCheck } from 'lucide-react';
import { fetchUrlContent } from '../services/geminiService';
import { extractFileContent } from '../utils/fileParser';

interface RagSource {
  type: 'file' | 'url';
  name: string;
  content: string;
  wordCount: number;
}

interface Props {
  onSourcesChange: (sources: RagSource[]) => void;
  systemSources?: RagSource[];
  isLoading?: boolean;
  initialSources?: RagSource[];
}

const RagSourcePanel: React.FC<Props> = ({ onSourcesChange, systemSources, initialSources }) => {
  const [sources, setSources] = useState<RagSource[]>(initialSources ?? []);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const text = await extractFileContent(file);
        const newSource: RagSource = {
          type: 'file',
          name: file.name,
          content: text,
          wordCount: text.split(/\s+/).filter(Boolean).length,
        };
        const updated = [...sources, newSource];
        setSources(updated);
        onSourcesChange(updated);
      } catch (err) {
        setError(`Failed to parse ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    setIsUrlLoading(true);
    setError(null);
    try {
      const data = await fetchUrlContent(urlInput);
      const newSource: RagSource = {
        type: 'url',
        name: data.title,
        content: data.content,
        wordCount: data.wordCount
      };
      const updated = [...sources, newSource];
      setSources(updated);
      onSourcesChange(updated);
      setUrlInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch URL content.');
    } finally {
      setIsUrlLoading(false);
    }
  };

  const removeSource = (idx: number) => {
    const updated = sources.filter((_, i) => i !== idx);
    setSources(updated);
    onSourcesChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
        <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" /> Reference Material (RAG)
        </h3>
        <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
          {sources.length} Sources
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* URL Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Enter technical reference URL (Deep reading enabled)..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
            />
          </div>
          <button
            onClick={handleAddUrl}
            disabled={isUrlLoading || !urlInput.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-950 disabled:opacity-30 transition-all shadow-md group"
          >
            {isUrlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4 group-hover:rotate-45 transition-transform" />}
          </button>
        </div>

        {error && <p className="text-[10px] text-red-500 font-bold px-1 animate-fade-in">⚠️ {error}</p>}

        {/* File Upload */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl py-6 hover:bg-slate-50 hover:border-blue-500/30 cursor-pointer transition-all group">
          <Upload className="w-6 h-6 text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
          <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-900">Upload Spec Sheets / Tech Docs</span>
          <input type="file" className="hidden" multiple accept=".txt,.md,.pdf" onChange={handleFileUpload} />
        </label>

        {/* Source List */}
        {(sources.length > 0 || (systemSources && systemSources.length > 0)) && (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {/* System Sources */}
            {systemSources?.map((s, idx) => (
              <div key={`system-${idx}`} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 group animate-pulse-subtle">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-900 truncate">{s.name}</p>
                  <p className="text-[10px] text-emerald-600 uppercase font-black tracking-tighter">System Verified • Evidence Found</p>
                </div>
              </div>
            ))}

            {/* User Sources */}
            {sources.map((s, idx) => (
              <div key={`user-${idx}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group animate-slide-up">
                <div className={`p-2 rounded-lg ${s.type === 'url' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                  {s.type === 'url' ? <Globe className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-900 truncate">{s.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black">{s.type} • {s.wordCount} Words</p>
                </div>
                <button 
                  onClick={() => removeSource(idx)} 
                  className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RagSourcePanel;
