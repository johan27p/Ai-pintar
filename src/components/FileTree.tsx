import React, { useState } from 'react';
import { WorkspaceFile } from '../types';
import { 
  Folder, 
  FolderOpen, 
  FileCode2, 
  FileText, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Layers
} from 'lucide-react';

interface FileTreeProps {
  files: WorkspaceFile[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: Record<string, TreeNode>;
  file?: WorkspaceFile;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    'src/utils': true,
    'src/components': true,
    tests: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Build tree from file paths
  const rootNode: Record<string, TreeNode> = {};

  files.forEach((file) => {
    const parts = file.path.split('/');
    let currentLevel = rootNode;
    let accumulatedPath = '';

    parts.forEach((part, index) => {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
      const isLast = index === parts.length - 1;

      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          path: accumulatedPath,
          isFolder: !isLast,
          children: !isLast ? {} : undefined,
          file: isLast ? file : undefined,
        };
      }

      if (!isLast && currentLevel[part].children) {
        currentLevel = currentLevel[part].children!;
      }
    });
  });

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName('');
    setIsCreating(false);
  };

  const renderTree = (nodes: Record<string, TreeNode>, depth = 0) => {
    return Object.values(nodes).map((node) => {
      if (node.isFolder) {
        const isExpanded = expandedFolders[node.path] ?? true;
        return (
          <div key={node.path} className="select-none">
            <button
              onClick={() => toggleFolder(node.path)}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              className="w-full flex items-center gap-1.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 text-xs rounded transition-colors text-left cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}
              <span className="font-mono text-slate-300 truncate">{node.name}</span>
            </button>
            {isExpanded && node.children && (
              <div>{renderTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      const isActive = node.path === activeFilePath;
      const isModified = node.file?.isModified;

      return (
        <div
          key={node.path}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
          className={`group flex items-center justify-between py-1 pr-2 text-xs rounded transition-colors cursor-pointer select-none ${
            isActive
              ? 'bg-blue-600/20 text-white font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
          onClick={() => onSelectFile(node.path)}
        >
          <div className="flex items-center gap-1.5 truncate">
            <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
            <span className="font-mono truncate">{node.name}</span>
          </div>

          <div className="flex items-center gap-1">
            {isModified && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Modified" />
            )}
            {files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(node.path);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
                title="Delete file"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="w-56 border-r border-slate-800 bg-slate-950 flex flex-col h-full shrink-0 select-none">
      {/* Workspace Header */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Explorer</span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          title="New file"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* New file input form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-slate-800 bg-slate-900/60">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="src/file.ts..."
            className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            autoFocus
            onBlur={() => { if (!newFileName) setIsCreating(false); }}
          />
        </form>
      )}

      {/* Tree list */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {renderTree(rootNode)}
      </div>
    </div>
  );
};
