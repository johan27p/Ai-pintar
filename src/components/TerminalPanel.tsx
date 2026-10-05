import React, { useState, useRef, useEffect } from 'react';
import { TerminalEntry } from '../types';
import { Terminal as TerminalIcon, Play, Trash2, ArrowUpRight } from 'lucide-react';

interface TerminalPanelProps {
  entries: TerminalEntry[];
  projectName: string;
  onExecuteCommand: (command: string) => void;
  onClearTerminal: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  entries,
  projectName,
  onExecuteCommand,
  onClearTerminal,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const commandHistory = useRef<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    commandHistory.current.push(cmd);
    setHistoryIndex(-1);
    onExecuteCommand(cmd);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const history = commandHistory.current;
      if (history.length === 0) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const history = commandHistory.current;
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 font-mono text-xs overflow-hidden select-text">
      {/* Terminal Toolbar */}
      <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-300">Terminal</span>
          <span className="text-slate-500">·</span>
          <span className="text-[11px] text-slate-500">bash 5.2</span>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onExecuteCommand('npm test')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
          >
            npm test
          </button>
          <button
            onClick={() => onExecuteCommand('git status')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
          >
            git status
          </button>
          <button
            onClick={() => onExecuteCommand('git diff')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
          >
            git diff
          </button>
          <button
            onClick={onClearTerminal}
            title="Clear terminal"
            className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors cursor-pointer ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-slate-300 bg-slate-950">
        {entries.map((entry) => {
          if (entry.type === 'command') {
            return (
              <div key={entry.id} className="flex items-start gap-2 text-blue-300">
                <span className="text-emerald-400 select-none">
                  openhands@workspace:~/{projectName}$
                </span>
                <span className="font-medium text-white">{entry.text}</span>
              </div>
            );
          }

          if (entry.type === 'stderr') {
            return (
              <pre
                key={entry.id}
                className="text-rose-400 whitespace-pre-wrap leading-relaxed bg-rose-950/20 p-2 rounded border border-rose-900/40"
              >
                {entry.text}
              </pre>
            );
          }

          if (entry.type === 'system') {
            return (
              <div key={entry.id} className="text-slate-500 italic text-[11px]">
                {entry.text}
              </div>
            );
          }

          return (
            <pre key={entry.id} className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {entry.text}
            </pre>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Command Input Prompt */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-2 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2"
      >
        <span className="text-emerald-400 select-none shrink-0">
          openhands@workspace:~/{projectName}$
        </span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type bash command (e.g. npm test, ls -la, git status)..."
          className="flex-1 bg-transparent text-white focus:outline-none placeholder-slate-600"
          autoFocus
        />
      </form>
    </div>
  );
};
