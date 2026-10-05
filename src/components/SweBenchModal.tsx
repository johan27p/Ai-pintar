import React from 'react';
import { ProjectPreset } from '../types';
import { X, Play, CheckCircle2, Award, Terminal, FileCode2 } from 'lucide-react';

interface SweBenchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectPreset[];
  currentProjectId: string;
  onLaunchTask: (project: ProjectPreset) => void;
}

export const SweBenchModal: React.FC<SweBenchModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onLaunchTask,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">SWE-Bench Benchmark Tasks</h2>
              <p className="text-[11px] text-slate-400">
                Real software engineering problems evaluated by autonomous agents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {projects.map((project) => {
            const isCurrent = project.id === currentProjectId;
            return (
              <div
                key={project.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-slate-950/80 border-blue-500/50 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
                      <span>{project.benchmarkScore || 'SWE-Bench Lite'}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{project.framework}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1.5">
                      {project.issueTitle}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      onLaunchTask(project);
                      onClose();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-200'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCurrent ? 'Start Task' : 'Switch & Start'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {project.issueDescription}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>{project.testCommand}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileCode2 className="w-3 h-3 text-blue-400" />
                    <span>{Object.keys(project.files).length} files</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-500 flex items-center justify-between">
          <span>Click any task to load its full repository into OpenHands workspace.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
