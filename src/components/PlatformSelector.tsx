import React from 'react';
import { ChevronDown, Globe, Share2, BookOpen, MessageSquare, Layout, MessageCircle, FileText, AlignLeft, Layers, Columns, Terminal, TrendingUp } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const PLATFORMS: Platform[] = [
  { id: 'zhihu', name: '知乎 (Zhihu)', desc: '高权威技术长文 / QA', icon: <Share2 />, color: 'text-blue-500' },
  { id: 'wechat', name: '微信公众号', desc: '垂直生态圈深度文章', icon: <MessageCircle />, color: 'text-emerald-500' },
  { id: 'xiaohongshu', name: '小红书 (XHS)', desc: '极简技术笔记 / 评测', icon: <Layout />, color: 'text-red-500' },
  { id: 'weibo', name: '微博 (Weibo)', desc: '短平快技术动态 / 话题', icon: <MessageSquare />, color: 'text-orange-500' },
  { id: 'baijiahao', name: '百家号', desc: '百度生态收录 / 搜索流量', icon: <Globe />, color: 'text-blue-600' },
  { id: 'toutiao', name: '今日头条', desc: '算法推荐 / 资讯分发', icon: <TrendingUp />, color: 'text-red-600' },
  { id: 'blog', name: '技术博客', desc: '独立站 / 详细技术分析', icon: <BookOpen />, color: 'text-indigo-500' },
];

const FORMATS: Platform[] = [
  { id: 'long_form', name: '📝 深度长文 (Deep Dive)', desc: '>2000字，权威分析与逻辑推导', icon: <AlignLeft />, color: 'text-slate-600' },
  { id: 'tldr', name: '📋 TL;DR 极简摘要', desc: '<300字，核心结论一句话说清', icon: <FileText />, color: 'text-amber-500' },
  { id: 'short_social', name: '⚡ 短帖引流 (Social Post)', desc: '<500字，高冲击力一扫即懂', icon: <MessageSquare />, color: 'text-blue-500' },
  { id: 'comparison', name: '📊 横评/对比 (Matrix)', desc: '结构化优劣对比或规格表格', icon: <Columns />, color: 'text-indigo-600' },
  { id: 'listicle', name: '📌 干货清单 (Listicle)', desc: '条目式干货，便于收藏转发', icon: <Layers />, color: 'text-emerald-600' },
  { id: 'api_docs', name: '🔧 开发者指南 (Tutorial)', desc: '代码优先的 API / 架构指南', icon: <Terminal />, color: 'text-emerald-500' },
  { id: 'news', name: '📰 快报/PR 通稿', desc: '精炼的企业技术新闻通报', icon: <Globe />, color: 'text-blue-400' },
];

interface Props {
  selectedPlatform: string;
  onPlatformChange: (id: string) => void;
  selectedFormat: string;
  onFormatChange: (id: string) => void;
}

const PlatformSelector: React.FC<Props> = ({ selectedPlatform, onPlatformChange, selectedFormat, onFormatChange }) => {
  const pData = PLATFORMS.find(p => p.id === selectedPlatform) || PLATFORMS[0];
  const fData = FORMATS.find(f => f.id === selectedFormat) || FORMATS[0];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="relative group flex-1">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Distribution Target (环境阵地)</div>
        <div className="relative">
          <select
            value={selectedPlatform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-10 py-4 text-sm font-black text-blue-900 appearance-none cursor-pointer hover:border-blue-500 hover:bg-white transition-all outline-none"
          >
            {PLATFORMS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${pData.color}`}>
            {React.cloneElement(pData.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
          </div>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-hover:text-blue-500 transition-colors" />
        </div>
        <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">{pData.desc}</p>
      </div>

      <div className="relative group flex-1">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Content Format (表达载体)</div>
        <div className="relative">
          <select
            value={selectedFormat}
            onChange={(e) => onFormatChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-10 py-4 text-sm font-black text-blue-900 appearance-none cursor-pointer hover:border-blue-500 hover:bg-white transition-all outline-none"
          >
            {FORMATS.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${fData.color}`}>
            {React.cloneElement(fData.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
          </div>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-hover:text-blue-500 transition-colors" />
        </div>
        <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">{fData.desc}</p>
      </div>
    </div>
  );
};

export default PlatformSelector;
