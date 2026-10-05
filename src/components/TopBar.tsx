import React from 'react';
import { AgentStatus, ProjectPreset } from '../types';
import { Settings, Play, Pause, Square, Sparkles, FolderGit2 } from 'lucide-react';

interface TopBarProps {
  currentProject: ProjectPreset;
  allProjects: ProjectPreset[];
  onSelectProject: (preset: ProjectPreset) => void;
  agentStatus: AgentStatus;
  activeView: 'workspace' | 'swe-bench' | 'changes' | 'docs';
  onChangeView: (view: 'workspace' | 'swe-bench' | 'changes' | 'docs') => void;
  onOpenSettings: () => void;
  onOpenSweBench: () => void;
  isAgentRunning: boolean;
  onToggleAgentPause: () => void;
  onStopAgent: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentProject,
  allProjects,
  onSelectProject,
  agentStatus,
  activeView,
  onChangeView,
  onOpenSettings,
  onOpenSweBench,
  isAgentRunning,
  onToggleAgentPause,
  onStopAgent,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950 px-5 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Zone 1: Brand title, single line text element */}
      <div className="flex items-center gap-3">
        <a 
          href="/" 
          onClick={(e) => { e.preventDefault(); onChangeView('workspace'); }}
          className="text-base font-bold tracking-tight text-white flex items-center gap-2 hover:text-blue-400 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-mono text-sm font-semibold">
            OH
          </div>
          <span>OpenHands</span>
        </a>
      </div>

      {/* Zone 2: 4 nav links, 1-2 word labels, single-line text links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
        <button
          onClick={() => onChangeView('workspace')}
          className={`transition-colors cursor-pointer py-1 ${
            activeView === 'workspace'
              ? 'text-white border-b-2 border-blue-500 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Workspace
        </button>

        <button
          onClick={() => { onChangeView('swe-bench'); onOpenSweBench(); }}
          className={`transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            activeView === 'swe-bench'
              ? 'text-white border-b-2 border-blue-500 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <span>SWE-Bench Tasks</span>
        </button>

        <button
          onClick={() => onChangeView('changes')}
          className={`transition-colors cursor-pointer py-1 ${
            activeView === 'changes'
              ? 'text-white border-b-2 border-blue-500 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Changes & Diffs
        </button>

        <button
          onClick={() => onChangeView('docs')}
          className={`transition-colors cursor-pointer py-1 ${
            activeView === 'docs'
              ? 'text-white border-b-2 border-blue-500 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Agent Docs
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {/* Project Selector */}
        <div className="relative flex items-center">
          <FolderGit2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <select
            value={currentProject.id}
            onChange={(e) => {
              const selected = allProjects.find((p) => p.id === e.target.value);
              if (selected) onSelectProject(selected);
            }}
            className="pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors max-w-[210px] truncate"
          >
            {allProjects.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Controls when running */}
        {isAgentRunning && (
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-md">
            <button
              onClick={onToggleAgentPause}
              title={agentStatus === 'paused' ? 'Resume agent' : 'Pause agent'}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
            >
              {agentStatus === 'paused' ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            <button
              onClick={onStopAgent}
              title="Stop agent execution"
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-red-400 rounded transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="OpenHands Settings"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-md border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
