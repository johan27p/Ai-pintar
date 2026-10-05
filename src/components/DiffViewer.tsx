import React, { useState } from 'react';
import { WorkspaceFile, DiffLine } from '../types';
import { GitCommit, GitPullRequest, RotateCcw, Check, FileDiff, Sparkles } from 'lucide-react';

interface DiffViewerProps {
  files: WorkspaceFile[];
  originalFiles: Record<string, string>;
  onRevertFile: (path: string) => void;
  onCommitChanges: (message: string) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  files,
  originalFiles,
  onRevertFile,
  onCommitChanges,
}) => {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('fix: resolve test calculation and edge-case errors');
  const [committedSuccess, setCommittedSuccess] = useState(false);

  // Find all modified or added files
  const changedFiles = files.filter((f) => {
    const orig = originalFiles[f.path];
    return orig === undefined || orig !== f.content;
  });

  const activeDiffPath = selectedPath || (changedFiles[0]?.path ?? '');
  const currentModifiedFile = files.find((f) => f.path === activeDiffPath);
  const originalContent = originalFiles[activeDiffPath] ?? '';
  const currentContent = currentModifiedFile?.content ?? '';

  // Generate unified diff lines
  const generateDiffLines = (orig: string, curr: string): DiffLine[] => {
    const origLines = orig ? orig.split('\n') : [];
    const currLines = curr ? curr.split('\n') : [];
    const result: DiffLine[] = [];

    let oldLine = 1;
    let newLine = 1;
    const maxLen = Math.max(origLines.length, currLines.length);

    for (let i = 0; i < maxLen; i++) {
      const o = origLines[i];
      const c = currLines[i];

      if (o === c && o !== undefined) {
        result.push({
          type: 'normal',
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
          content: o,
        });
      } else {
        if (o !== undefined) {
          result.push({
            type: 'delete',
            oldLineNumber: oldLine++,
            content: o,
          });
        }
        if (c !== undefined) {
          result.push({
            type: 'add',
            newLineNumber: newLine++,
            content: c,
          });
        }
      }
    }
    return result;
  };

  const diffLines = generateDiffLines(originalContent, currentContent);
  const additions = diffLines.filter((l) => l.type === 'add').length;
  const deletions = diffLines.filter((l) => l.type === 'delete').length;

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    onCommitChanges(commitMessage);
    setCommittedSuccess(true);
    setTimeout(() => setCommittedSuccess(false), 3000);
  };

  if (changedFiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <FileDiff className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 mb-1">Working Tree Clean</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          No modified files detected in the active workspace. Have OpenHands edit files or modify code in the editor to see live diffs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Diff Header */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <FileDiff className="w-4 h-4 text-blue-400" />
            <span>Git Working Tree Diffs</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-400">+{additions}</span>
            <span className="text-rose-400">-{deletions}</span>
          </div>
        </div>

        {/* Commit Input and Action */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="w-72 px-3 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            onClick={handleCommit}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors cursor-pointer"
          >
            {committedSuccess ? <Check className="w-3.5 h-3.5" /> : <GitCommit className="w-3.5 h-3.5" />}
            <span>{committedSuccess ? 'Committed!' : 'Commit Changes'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Changed Files Sidebar */}
        <div className="w-64 border-r border-slate-800 bg-slate-900/60 p-2 overflow-y-auto shrink-0">
          <div className="text-[11px] font-mono text-slate-500 uppercase px-2 py-1 mb-1">
            Changed Files ({changedFiles.length})
          </div>
          <div className="space-y-1">
            {changedFiles.map((file) => {
              const isSelected = file.path === activeDiffPath;
              const isAdded = originalFiles[file.path] === undefined;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full flex items-center justify-between p-2 rounded text-left text-xs font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <span className="truncate">{file.path}</span>
                  <span className={`text-[10px] ml-2 font-bold ${isAdded ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isAdded ? 'A' : 'M'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Diff Content View */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 font-mono text-xs">
          {/* File Header */}
          <div className="px-4 py-2 border-b border-slate-900 bg-slate-950 flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-200">{activeDiffPath}</span>
            <button
              onClick={() => onRevertFile(activeDiffPath)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Discard Changes</span>
            </button>
          </div>

          {/* Unified Diff Lines */}
          <div className="flex-1 overflow-y-auto p-2 select-text">
            {diffLines.map((line, idx) => {
              let bg = 'hover:bg-slate-900/50';
              let text = 'text-slate-300';
              let prefix = ' ';

              if (line.type === 'add') {
                bg = 'bg-emerald-950/40 text-emerald-200';
                text = 'text-emerald-300';
                prefix = '+';
              } else if (line.type === 'delete') {
                bg = 'bg-rose-950/40 text-rose-300';
                text = 'text-rose-400';
                prefix = '-';
              }

              return (
                <div key={idx} className={`flex items-start py-0.5 px-2 rounded-xs ${bg}`}>
                  <span className="w-9 text-right pr-2 text-slate-600 select-none tabular-nums">
                    {line.oldLineNumber ?? ''}
                  </span>
                  <span className="w-9 text-right pr-2 text-slate-600 select-none tabular-nums">
                    {line.newLineNumber ?? ''}
                  </span>
                  <span className="w-4 select-none text-slate-500 font-bold">{prefix}</span>
                  <span className={`flex-1 whitespace-pre-wrap break-all ${text}`}>
                    {line.content || ' '}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
