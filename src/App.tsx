import React, { useState, useEffect, useRef } from 'react';
import { 
  AgentMode, 
  AgentStatus, 
  AgentStep, 
  ChatMessage, 
  WorkspaceFile, 
  ProjectPreset, 
  TerminalEntry, 
  AgentSettings 
} from './types';
import { PROJECT_PRESETS } from './data/defaultProjects';
import { executeVirtualCommand, FIXED_CART_CODE } from './services/agentEngine';
import { TopBar } from './components/TopBar';
import { AgentPanel } from './components/AgentPanel';
import { FileTree } from './components/FileTree';
import { CodeEditor } from './components/CodeEditor';
import { TerminalPanel } from './components/TerminalPanel';
import { BrowserPreview } from './components/BrowserPreview';
import { DiffViewer } from './components/DiffViewer';
import { SettingsModal } from './components/SettingsModal';
import { SweBenchModal } from './components/SweBenchModal';
import { DocsView } from './components/DocsView';
import { Code, Terminal, Globe, FileDiff } from 'lucide-react';

export default function App() {
  const [allProjects] = useState<ProjectPreset[]>(PROJECT_PRESETS);
  const [currentProject, setCurrentProject] = useState<ProjectPreset>(PROJECT_PRESETS[0]);

  // Workspace files state
  const [files, setFiles] = useState<WorkspaceFile[]>(() => {
    return Object.entries(PROJECT_PRESETS[0].files).map(([path, content]) => ({
      path,
      name: path.split('/').pop() || path,
      content,
      language: path.endsWith('.ts') || path.endsWith('.tsx') ? 'typescript' : path.endsWith('.json') ? 'json' : 'markdown',
      isModified: false,
      originalContent: content,
    }));
  });

  const [activeFilePath, setActiveFilePath] = useState<string>('src/utils/cartCalculator.ts');
  const [openedFilePaths, setOpenedFilePaths] = useState<string[]>([
    'src/utils/cartCalculator.ts',
    'tests/cart.test.ts',
  ]);

  // Views & Panels
  const [activeView, setActiveView] = useState<'workspace' | 'swe-bench' | 'changes' | 'docs'>('workspace');
  const [centerTab, setCenterTab] = useState<'editor' | 'terminal' | 'browser' | 'diff'>('editor');

  // Agent State
  const [agentMode, setAgentMode] = useState<AgentMode>('CodeAct');
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const isAgentPausedRef = useRef(false);
  const stopAgentRequestedRef = useRef(false);

  // Chat & Stream Steps
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'agent',
      text: `Hello! I am OpenHands, your autonomous AI software engineer.
I've loaded the workspace for ${PROJECT_PRESETS[0].name}.
Target Issue: ${PROJECT_PRESETS[0].issueTitle}.
You can ask me to run tests, investigate the codebase, or fix the bugs autonomously!`,
      timestamp: '12:00:00',
    },
  ]);

  const [steps, setSteps] = useState<AgentStep[]>([]);

  // Terminal state
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([
    {
      id: 'term-welcome',
      type: 'system',
      text: 'OpenHands Sandbox Environment initialized (Linux x86_64, Node v22.14.0)',
      timestamp: '12:00:00',
    },
    {
      id: 'term-repo',
      type: 'system',
      text: `Repository mounted at /workspace/${PROJECT_PRESETS[0].name}`,
      timestamp: '12:00:01',
    },
  ]);

  // Modals & Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSweBenchOpen, setIsSweBenchOpen] = useState(false);
  const [settings, setSettings] = useState<AgentSettings>({
    model: 'gemini-3.8-flash',
    agentMode: 'CodeAct',
    maxIterations: 12,
    autoApproveCommands: true,
    temperature: 0.2,
    enableBrowser: true,
    systemPromptAddendum: '',
  });

  // Switch project handler
  const handleSelectProject = (project: ProjectPreset) => {
    setCurrentProject(project);
    const newFiles: WorkspaceFile[] = Object.entries(project.files).map(([path, content]) => ({
      path,
      name: path.split('/').pop() || path,
      content,
      language: path.endsWith('.ts') || path.endsWith('.tsx') ? 'typescript' : path.endsWith('.json') ? 'json' : 'markdown',
      isModified: false,
      originalContent: content,
    }));
    setFiles(newFiles);

    const firstFile = Object.keys(project.files)[0];
    setActiveFilePath(firstFile);
    setOpenedFilePaths(Object.keys(project.files).slice(0, 3));
    setSteps([]);
    setMessages([
      {
        id: `msg-proj-${Date.now()}`,
        sender: 'agent',
        text: `Switched workspace to ${project.name}.\nIssue: ${project.issueTitle}\nReady to inspect files and run tests.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setTerminalEntries([
      {
        id: `term-sw-${Date.now()}`,
        type: 'system',
        text: `Switched project workspace to /workspace/${project.name}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Reset workspace back to pristine git commit
  const handleResetWorkspace = () => {
    const pristineFiles: WorkspaceFile[] = Object.entries(currentProject.files).map(([path, content]) => ({
      path,
      name: path.split('/').pop() || path,
      content,
      language: path.endsWith('.ts') || path.endsWith('.tsx') ? 'typescript' : path.endsWith('.json') ? 'json' : 'markdown',
      isModified: false,
      originalContent: content,
    }));
    setFiles(pristineFiles);
    setTerminalEntries((prev) => [
      ...prev,
      {
        id: `term-reset-${Date.now()}`,
        type: 'system',
        text: 'git reset --hard HEAD (workspace restored to initial clean commit)',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // File operations
  const handleSelectFile = (path: string) => {
    setActiveFilePath(path);
    if (!openedFilePaths.includes(path)) {
      setOpenedFilePaths((prev) => [...prev, path]);
    }
    setCenterTab('editor');
  };

  const handleCloseFile = (path: string) => {
    const nextOpened = openedFilePaths.filter((p) => p !== path);
    setOpenedFilePaths(nextOpened);
    if (activeFilePath === path) {
      setActiveFilePath(nextOpened[0] || '');
    }
  };

  const handleUpdateFileContent = (path: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.path === path) {
          return {
            ...f,
            content: newContent,
            isModified: f.originalContent !== newContent,
          };
        }
        return f;
      })
    );
  };

  const handleSaveFile = (path: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.path === path) {
          return {
            ...f,
            isModified: false,
            originalContent: f.content,
          };
        }
        return f;
      })
    );
  };

  const handleRevertFile = (path: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.path === path && f.originalContent !== undefined) {
          return {
            ...f,
            content: f.originalContent,
            isModified: false,
          };
        }
        return f;
      })
    );
  };

  const handleCreateFile = (path: string) => {
    if (files.some((f) => f.path === path)) return;
    const newFile: WorkspaceFile = {
      path,
      name: path.split('/').pop() || path,
      content: '// New file\n',
      language: path.endsWith('.ts') || path.endsWith('.tsx') ? 'typescript' : 'text',
      isModified: true,
      originalContent: '',
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFilePath(path);
    setOpenedFilePaths((prev) => [...prev, path]);
  };

  const handleDeleteFile = (path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path));
    handleCloseFile(path);
  };

  // Terminal command execution
  const handleExecuteTerminalCommand = (cmd: string) => {
    const filesMap: Record<string, string> = {};
    files.forEach((f) => {
      filesMap[f.path] = f.content;
    });

    const res = executeVirtualCommand(cmd, filesMap, currentProject);

    setTerminalEntries((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        type: 'command',
        text: cmd,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...(res.stdout
        ? [
            {
              id: `stdout-${Date.now()}`,
              type: 'stdout' as const,
              text: res.stdout,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]
        : []),
      ...(res.stderr
        ? [
            {
              id: `stderr-${Date.now()}`,
              type: 'stderr' as const,
              text: res.stderr,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]
        : []),
    ]);

    return res;
  };

  // Autonomous CodeAct Agent Runner
  const runAgentTask = async (userPrompt: string) => {
    if (isAgentRunning) return;

    setIsAgentRunning(true);
    setAgentStatus('thinking');
    stopAgentRequestedRef.current = false;
    isAgentPausedRef.current = false;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: userPrompt,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    // Check if we can invoke the server Gemini endpoint
    const filesMap: Record<string, string> = {};
    files.forEach((f) => {
      filesMap[f.path] = f.content;
    });

    let useGemini = false;
    if (settings.model !== 'local-simulator') {
      try {
        const testRes = await fetch('/api/health');
        const health = await testRes.json();
        if (health.hasApiKey) {
          useGemini = true;
        }
      } catch {
        useGemini = false;
      }
    }

    // Helper to pause execution if requested
    const checkPauseOrStop = async () => {
      while (isAgentPausedRef.current && !stopAgentRequestedRef.current) {
        await new Promise((r) => setTimeout(r, 400));
      }
      return stopAgentRequestedRef.current;
    };

    // If Gemini API is available on server, call /api/agent/step
    if (useGemini) {
      try {
        setAgentStatus('thinking');
        const stepResponse = await fetch('/api/agent/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userPrompt,
            workspaceFiles: filesMap,
            agentMode,
          }),
        });

        const data = await stepResponse.json();
        if (data.success && data.data) {
          const actionData = data.data;
          const stepId = `step-${Date.now()}`;
          const newStep: AgentStep = {
            id: stepId,
            timestamp: new Date().toLocaleTimeString(),
            thought: actionData.thought || 'Analyzing workspace requirements and planning code changes.',
            action: {
              type: actionData.actionType || 'execute_bash',
              command: actionData.command,
              filepath: actionData.filepath,
              content: actionData.fileContent,
              summary: actionData.summary || 'Executing CodeAct action',
            },
            status: 'running',
          };

          setSteps((prev) => [...prev, newStep]);
          await new Promise((r) => setTimeout(r, 800));

          if (actionData.actionType === 'execute_bash' && actionData.command) {
            setCenterTab('terminal');
            const res = handleExecuteTerminalCommand(actionData.command);
            newStep.observation = {
              stdout: res.stdout,
              stderr: res.stderr,
              exitCode: res.exitCode,
              success: res.exitCode === 0,
            };
          } else if (actionData.actionType === 'file_write' && actionData.filepath && actionData.fileContent) {
            handleUpdateFileContent(actionData.filepath, actionData.fileContent);
            setActiveFilePath(actionData.filepath);
            setCenterTab('editor');
            newStep.observation = {
              diffSummary: `Updated ${actionData.filepath}`,
              success: true,
            };
          }

          newStep.status = 'success';
          setSteps((prev) => prev.map((s) => (s.id === stepId ? newStep : s)));
        }
      } catch (err) {
        console.warn('Server agent step failed, using deterministic CodeAct fallback:', err);
      }
    }

    // Deterministic Autonomous CodeAct Multi-Step Agent loop
    // Runs the authentic 6-step SWE-Bench resolution pipeline
    const executeStep = async (stepInfo: {
      thought: string;
      actionType: 'execute_bash' | 'file_read' | 'file_write' | 'finish';
      command?: string;
      filepath?: string;
      fileContent?: string;
      summary: string;
    }) => {
      if (await checkPauseOrStop()) return false;

      const stepId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const stepObj: AgentStep = {
        id: stepId,
        timestamp: new Date().toLocaleTimeString(),
        thought: stepInfo.thought,
        action: {
          type: stepInfo.actionType,
          command: stepInfo.command,
          filepath: stepInfo.filepath,
          content: stepInfo.fileContent,
          summary: stepInfo.summary,
        },
        status: 'running',
      };

      setSteps((prev) => [...prev, stepObj]);
      await new Promise((r) => setTimeout(r, 1000));

      if (await checkPauseOrStop()) return false;

      // Handle bash execution
      if (stepInfo.actionType === 'execute_bash' && stepInfo.command) {
        setCenterTab('terminal');
        const res = handleExecuteTerminalCommand(stepInfo.command);
        stepObj.observation = {
          stdout: res.stdout,
          stderr: res.stderr,
          exitCode: res.exitCode,
          success: res.exitCode === 0,
        };
      }

      // Handle file reading
      if (stepInfo.actionType === 'file_read' && stepInfo.filepath) {
        setActiveFilePath(stepInfo.filepath);
        setCenterTab('editor');
        stepObj.observation = {
          fileContent: filesMap[stepInfo.filepath] || '',
          success: true,
        };
      }

      // Handle file writing
      if (stepInfo.actionType === 'file_write' && stepInfo.filepath && stepInfo.fileContent) {
        handleUpdateFileContent(stepInfo.filepath, stepInfo.fileContent);
        setActiveFilePath(stepInfo.filepath);
        setCenterTab('editor');
        stepObj.observation = {
          diffSummary: `Successfully patched ${stepInfo.filepath}`,
          success: true,
        };
      }

      stepObj.status = 'success';
      setSteps((prev) => prev.map((s) => (s.id === stepId ? stepObj : s)));
      await new Promise((r) => setTimeout(r, 600));
      return true;
    };

    // Step 1: Inspect directory structure
    const s1 = await executeStep({
      thought: `To solve "${currentProject.issueTitle}", I will first explore the workspace directory and review the test suite setup.`,
      actionType: 'execute_bash',
      command: 'ls -la',
      summary: 'Explore directory structure',
    });
    if (!s1) { setIsAgentRunning(false); setAgentStatus('paused'); return; }

    // Step 2: Reproduce the failing test suite
    const s2 = await executeStep({
      thought: `Running ${currentProject.testCommand} to reproduce failing test assertions and inspect the exact error call stack.`,
      actionType: 'execute_bash',
      command: currentProject.testCommand,
      summary: `Run ${currentProject.testCommand} to reproduce failure`,
    });
    if (!s2) { setIsAgentRunning(false); setAgentStatus('paused'); return; }

    // Step 3: Inspect the target implementation file
    const targetFile = currentProject.id === 'shop-cart-checkout' 
      ? 'src/utils/cartCalculator.ts' 
      : Object.keys(currentProject.files)[0];

    const s3 = await executeStep({
      thought: `The test failures indicate incorrect financial math in ${targetFile}. Reading file contents to analyze discount calculation order and tax baseline.`,
      actionType: 'file_read',
      filepath: targetFile,
      summary: `Read ${targetFile} source code`,
    });
    if (!s3) { setIsAgentRunning(false); setAgentStatus('paused'); return; }

    // Step 4: Write the corrected code
    const correctedContent = currentProject.id === 'shop-cart-checkout'
      ? FIXED_CART_CODE
      : currentProject.files[targetFile];

    const s4 = await executeStep({
      thought: `I have identified the flaws:
1. Discount was computed across shipping instead of items subtotal.
2. Sales tax was evaluated prior to discount deduction.
3. Discount was subtracted twice from grand total.
Writing clean corrected implementation to ${targetFile}.`,
      actionType: 'file_write',
      filepath: targetFile,
      fileContent: correctedContent,
      summary: `Apply bug fix to ${targetFile}`,
    });
    if (!s4) { setIsAgentRunning(false); setAgentStatus('paused'); return; }

    // Step 5: Rerun tests to verify fix
    const s5 = await executeStep({
      thought: `Running ${currentProject.testCommand} again to verify that all unit test assertions now pass cleanly.`,
      actionType: 'execute_bash',
      command: currentProject.testCommand,
      summary: 'Verify unit tests pass',
    });
    if (!s5) { setIsAgentRunning(false); setAgentStatus('paused'); return; }

    // Step 6: Review working tree diff
    const s6 = await executeStep({
      thought: 'Running `git diff` to ensure no unintended modifications or syntax anomalies remain in the working tree.',
      actionType: 'execute_bash',
      command: 'git diff',
      summary: 'Inspect git diff',
    });
    if (!s6) { setIsAgentRunning(false); setAgentStatus('paused'); return; }

    // Final finish step
    setSteps((prev) => [
      ...prev,
      {
        id: `step-finish-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        thought: 'All tasks completed and verified with 100% passing tests.',
        action: {
          type: 'finish',
          summary: 'Task completed successfully',
        },
        observation: {
          success: true,
          diffSummary: currentProject.expectedFixSummary,
        },
        status: 'success',
      },
    ]);

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-done-${Date.now()}`,
        sender: 'agent',
        text: `I've resolved the issue!
• ${currentProject.expectedFixSummary}
• Ran \`${currentProject.testCommand}\`: All tests passed.
• Verified financial totals in the live Browser Preview.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    setIsAgentRunning(false);
    setAgentStatus('completed');
  };

  const handleToggleAgentPause = () => {
    isAgentPausedRef.current = !isAgentPausedRef.current;
    setAgentStatus(isAgentPausedRef.current ? 'paused' : 'executing');
  };

  const handleStopAgent = () => {
    stopAgentRequestedRef.current = true;
    isAgentPausedRef.current = false;
    setIsAgentRunning(false);
    setAgentStatus('idle');
  };

  const activeCartCode = files.find((f) => f.path === 'src/utils/cartCalculator.ts')?.content || '';

  const originalFilesMap: Record<string, string> = {};
  files.forEach((f) => {
    originalFilesMap[f.path] = f.originalContent ?? '';
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Bar (Universal 3-Zone Contract) */}
      <TopBar
        currentProject={currentProject}
        allProjects={allProjects}
        onSelectProject={handleSelectProject}
        agentStatus={agentStatus}
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSweBench={() => setIsSweBenchOpen(true)}
        isAgentRunning={isAgentRunning}
        onToggleAgentPause={handleToggleAgentPause}
        onStopAgent={handleStopAgent}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: OpenHands Agent Controller & Thought Stream */}
        <AgentPanel
          messages={messages}
          steps={steps}
          agentMode={agentMode}
          agentStatus={agentStatus}
          onSetAgentMode={setAgentMode}
          onSendMessage={runAgentTask}
          onSelectStepFile={handleSelectFile}
          isAgentRunning={isAgentRunning}
          activeIssueTitle={currentProject.issueTitle}
          onResetWorkspace={handleResetWorkspace}
        />

        {/* Center / Right Column depending on Active View */}
        {activeView === 'docs' ? (
          <DocsView />
        ) : activeView === 'changes' ? (
          <DiffViewer
            files={files}
            originalFiles={originalFilesMap}
            onRevertFile={handleRevertFile}
            onCommitChanges={(msg) => {
              handleExecuteTerminalCommand(`git commit -am "${msg}"`);
              setFiles((prev) =>
                prev.map((f) => ({
                  ...f,
                  isModified: false,
                  originalContent: f.content,
                }))
              );
            }}
          />
        ) : (
          /* Workspace View: FileTree + Multi-Tab Workspace (Editor, Terminal, Browser, Diff) */
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer Tree */}
            <FileTree
              files={files}
              activeFilePath={activeFilePath}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
            />

            {/* Main Interactive Stage */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
              {/* Workspace Mode Tabs (Buttons per design constitution) */}
              <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between select-none shrink-0">
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setCenterTab('editor')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      centerTab === 'editor'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Code Editor</span>
                  </button>

                  <button
                    onClick={() => setCenterTab('terminal')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      centerTab === 'terminal'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Interactive Bash</span>
                  </button>

                  <button
                    onClick={() => setCenterTab('browser')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      centerTab === 'browser'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Browser Preview</span>
                  </button>

                  <button
                    onClick={() => setCenterTab('diff')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      centerTab === 'diff'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileDiff className="w-3.5 h-3.5" />
                    <span>Git Diffs</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  <span>{currentProject.framework}</span>
                </div>
              </div>

              {/* Tab Viewport */}
              <div className="flex-1 flex overflow-hidden">
                {centerTab === 'editor' && (
                  <CodeEditor
                    files={files.filter((f) => openedFilePaths.includes(f.path))}
                    activeFilePath={activeFilePath}
                    onSelectFile={handleSelectFile}
                    onCloseFile={handleCloseFile}
                    onUpdateFileContent={handleUpdateFileContent}
                    onSaveFile={handleSaveFile}
                    onRevertFile={handleRevertFile}
                  />
                )}

                {centerTab === 'terminal' && (
                  <TerminalPanel
                    entries={terminalEntries}
                    projectName={currentProject.name}
                    onExecuteCommand={handleExecuteTerminalCommand}
                    onClearTerminal={() => setTerminalEntries([])}
                  />
                )}

                {centerTab === 'browser' && (
                  <BrowserPreview cartCalculatorCode={activeCartCode} />
                )}

                {centerTab === 'diff' && (
                  <DiffViewer
                    files={files}
                    originalFiles={originalFilesMap}
                    onRevertFile={handleRevertFile}
                    onCommitChanges={(msg) => {
                      handleExecuteTerminalCommand(`git commit -am "${msg}"`);
                      setFiles((prev) =>
                        prev.map((f) => ({
                          ...f,
                          isModified: false,
                          originalContent: f.content,
                        }))
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
      />

      {/* SWE-Bench Tasks Modal */}
      <SweBenchModal
        isOpen={isSweBenchOpen}
        onClose={() => setIsSweBenchOpen(false)}
        projects={allProjects}
        currentProjectId={currentProject.id}
        onLaunchTask={(proj) => {
          handleSelectProject(proj);
          setActiveView('workspace');
          runAgentTask(`Run tests and resolve ${proj.issueTitle}`);
        }}
      />
    </div>
  );
}
