import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialise Gemini client with standard telemetry
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('[OpenHands Server] Could not initialize GoogleGenAI client:', err);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!geminiApiKey,
    agent: 'OpenHands-CodeAct-v1',
    timestamp: new Date().toISOString(),
  });
});

// Real Agent Step Execution via Gemini API
app.post('/api/agent/step', async (req, res) => {
  try {
    const { prompt, workspaceFiles, history, agentMode } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!aiClient) {
      return res.status(200).json({
        fallback: true,
        message: 'No server-side GEMINI_API_KEY configured; using client-side autonomous engine.',
      });
    }

    const filesContext = Object.entries(workspaceFiles || {})
      .map(([filepath, content]) => `--- File: ${filepath} ---\n${String(content).slice(0, 1500)}`)
      .join('\n\n');

    const systemPrompt = `You are OpenHands, the premier open-source autonomous AI software engineer.
You are running as a ${agentMode || 'CodeAct'} agent.
Your objective is to solve the user's software engineering task by producing thoughtful analysis and concrete actions.

Current Workspace Snapshot:
${filesContext}

Respond in structured JSON format with this exact schema:
{
  "thought": "Your internal chain-of-thought analysis of the current issue and next step.",
  "actionType": "execute_bash" | "file_write" | "file_read" | "finish",
  "command": "bash command if actionType is execute_bash",
  "filepath": "file path if actionType is file_write or file_read",
  "fileContent": "complete updated file content if actionType is file_write",
  "summary": "one-sentence explanation of what you are doing",
  "isFinished": boolean
}`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `User request: ${prompt}\n\nRecent steps history:\n${JSON.stringify(history || []).slice(0, 2000)}`,
          },
        ],
      },
    ];

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        thought: responseText,
        actionType: 'finish',
        summary: 'Agent completed analysis.',
        isFinished: true,
      };
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('[OpenHands Agent Error]:', error);
    return res.status(500).json({
      error: error?.message || 'Agent execution failed',
      fallback: true,
    });
  }
});

// Mount Vite middleware in development or static serve in production
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[OpenHands Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
