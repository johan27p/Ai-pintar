export type AgentMode = 'CodeAct' | 'Planner' | 'Browsing' | 'Security';

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting' | 'paused' | 'completed' | 'error';

export type ActionType = 
  | 'execute_bash' 
  | 'file_read' 
  | 'file_write' 
  | 'git_action' 
  | 'browser_action' 
  | 'plan_task' 
  | 'finish';

export interface AgentAction {
  type: ActionType;
  command?: string;
  filepath?: string;
  content?: string;
  summary: string;
}

export interface AgentObservation {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  fileContent?: string;
  screenshotUrl?: string;
  diffSummary?: string;
  success: boolean;
}

export interface AgentStep {
  id: string;
  timestamp: string;
  thought: string;
  action: AgentAction;
  observation?: AgentObservation;
  status: 'running' | 'success' | 'failed';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  stepId?: string;
}

export interface WorkspaceFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isModified?: boolean;
  originalContent?: string;
}

export interface ProjectPreset {
  id: string;
  name: string;
  description: string;
  framework: string;
  issueTitle: string;
  issueDescription: string;
  benchmarkScore?: string;
  files: Record<string, string>;
  testCommand: string;
  expectedFixSummary: string;
}

export interface TerminalEntry {
  id: string;
  type: 'command' | 'stdout' | 'stderr' | 'system';
  text: string;
  timestamp: string;
}

export interface DiffLine {
  type: 'normal' | 'add' | 'delete';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  minSubtotal?: number;
}

export interface AgentSettings {
  model: string;
  agentMode: AgentMode;
  maxIterations: number;
  autoApproveCommands: boolean;
  temperature: number;
  enableBrowser: boolean;
  systemPromptAddendum: string;
}
