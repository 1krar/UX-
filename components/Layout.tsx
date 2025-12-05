import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, Map, GitGraph, Palette } from 'lucide-react';

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-700">
          <LayoutDashboard className="h-8 w-8 text-indigo-400" />
          <span className="hidden lg:block font-bold text-xl tracking-tight">UX Insight</span>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          <NavItem 
            active={currentView === AppView.JOURNEY_MAP} 
            onClick={() => onNavigate(AppView.JOURNEY_MAP)}
            icon={<Map className="h-5 w-5" />}
            label="用户旅程图"
          />
          <NavItem 
            active={currentView === AppView.INFO_ARCH} 
            onClick={() => onNavigate(AppView.INFO_ARCH)}
            icon={<GitGraph className="h-5 w-5" />}
            label="信息架构 IA"
          />
          <NavItem 
            active={currentView === AppView.DESIGN_SYSTEM} 
            onClick={() => onNavigate(AppView.DESIGN_SYSTEM)}
            icon={<Palette className="h-5 w-5" />}
            label="设计规范"
          />
        </nav>

        <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center lg:text-left">
          <span className="hidden lg:inline">Powered by Gemini 2.5</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-lg transition-colors
        ${active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      title={label}
    >
      {icon}
      <span className="hidden lg:block font-medium text-sm">{label}</span>
    </button>
  );
};
