import React from 'react';
import { AgentSettings } from '../types';
import { X, Settings, Cpu, Shield, Sliders, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AgentSettings;
  onUpdateSettings: (newSettings: Partial<AgentSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">OpenHands Agent Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Model selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Foundation Model</span>
            </label>
            <select
              value={settings.model}
              onChange={(e) => onUpdateSettings({ model: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended - Fast & Accurate)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Advanced Code Reasoning)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-Low Latency)</option>
              <option value="local-simulator">Local Autonomous Simulator (Offline SWE-Bench)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Used by server-side OpenHands engine for CodeAct step reasoning and terminal commands.
            </p>
          </div>

          {/* Max Iterations */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Max Step Iterations</span>
              </label>
              <span className="font-mono text-blue-400">{settings.maxIterations} steps</span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              value={settings.maxIterations}
              onChange={(e) => onUpdateSettings({ maxIterations: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Security & Autonomy */}
          <div className="pt-3 border-t border-slate-800/80">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-200">Autonomous Command Execution</p>
                  <p className="text-[11px] text-slate-500">
                    Allow OpenHands to run non-destructive bash commands without manual confirmation.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoApproveCommands}
                onChange={(e) => onUpdateSettings({ autoApproveCommands: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-300 font-medium">Temperature</span>
              <span className="font-mono text-blue-400">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ temperature: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
