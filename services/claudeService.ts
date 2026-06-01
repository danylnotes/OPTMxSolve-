import { RefineryUnit } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';
import { updateSensorSetpoint } from './mockDataService';

const MODEL = 'claude-opus-4-8';
const API_URL = 'https://api.anthropic.com/v1/messages';

const getApiKey = (): string => {
  const key = (process.env.ANTHROPIC_API_KEY as string) || '';
  if (!key) throw new Error('Service Configuration Error: ANTHROPIC_API_KEY is missing.');
  return key;
};

const buildHeaders = (apiKey: string): Record<string, string> => ({
  'content-type': 'application/json',
  'x-api-key': apiKey,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
});

interface MessageParam {
  role: 'user' | 'assistant';
  content: string | any[];
}

interface RequestBody {
  model: string;
  max_tokens: number;
  system?: string;
  messages: MessageParam[];
  thinking?: { type: string };
  tools?: any[];
  stream?: boolean;
}

async function callMessages(body: RequestBody): Promise<any> {
  const apiKey = getApiKey();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Claude API ${res.status}: ${err}`);
  }
  return res.json();
}

function extractText(data: any): string {
  return ((data.content as any[]) || [])
    .filter(b => b.type === 'text')
    .map(b => b.text as string)
    .join('');
}

async function* streamMessages(body: Omit<RequestBody, 'stream'>): AsyncGenerator<string> {
  const apiKey = getApiKey();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify({ ...body, stream: true }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const event = JSON.parse(raw);
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          yield event.delta.text as string;
        }
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export const analyzeUnitStatus = async (unit: RefineryUnit): Promise<string> => {
  try {
    const sensorSummary = unit.sensors
      .map(s => `- ${s.name} (${s.type}): ${s.value} ${s.unit} | Range: ${s.threshold.min}–${s.threshold.max} | Status: ${s.status}`)
      .join('\n');

    const data = await callMessages({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: SYSTEM_INSTRUCTION,
      messages: [{
        role: 'user',
        content: `Analyse ${unit.name} (${unit.description}).\nEfficiency: ${unit.efficiency}%\nStatus: ${unit.status}\n\nSensors:\n${sensorSummary}\n\nProvide a brief operational assessment, potential root causes for any warnings, and recommended actions. Format as Markdown.`,
      }],
    });

    const text = extractText(data);
    if (!text) throw new Error('Empty response.');
    return text;
  } catch (err: any) {
    console.error('Claude Analysis Error:', err);
    return `ERROR: ${err.message || 'Unable to generate unit analysis.'}`;
  }
};

export const getPredictiveMaintenanceReport = async (metrics: any[]): Promise<string> => {
  try {
    const metricsSummary = metrics
      .map(m => `- Asset: ${m.asset} (${m.location}). Running Hours: ${m.runningHours}, MTBF: ${m.mtbf}, Reliability Index: ${m.reliabilityIndex}%, Downtime: ${m.downtime}h.`)
      .join('\n');

    const data = await callMessages({
      model: MODEL,
      max_tokens: 1536,
      thinking: { type: 'adaptive' },
      system: 'You are an expert Reliability Engineer specialising in Rotating Equipment and Static Assets in oil refineries.',
      messages: [{
        role: 'user',
        content: `Perform a Predictive Maintenance Analysis:\n${metricsSummary}\n\n1. Identify the TOP 2 highest-risk assets.\n2. Predict Remaining Useful Life (RUL).\n3. Give specific technical recommendations.\n4. Rank risk as CRITICAL, HIGH, or MEDIUM.\n\nBe technical and concise. Format as Markdown.`,
      }],
    });

    const text = extractText(data);
    if (!text) throw new Error('Empty response.');
    return text;
  } catch (err: any) {
    console.error('Predictive Analysis Error:', err);
    return `ERROR: ${err.message || 'Predictive analysis service unavailable.'}`;
  }
};

export const chatWithData = async (
  history: { role: 'user' | 'model'; text: string }[],
  currentContext: RefineryUnit[]
): Promise<string> => {
  try {
    const plantContext = currentContext
      .map(u => `Unit: ${u.name} (Status: ${u.status})\nSensors: ${u.sensors.map(s => `${s.name}: ${s.value} ${s.unit}`).join(', ')}`)
      .join('\n---\n');

    const lastMessage = history[history.length - 1].text;

    const data = await callMessages({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_INSTRUCTION,
      messages: [{
        role: 'user',
        content: `Plant Data:\n${plantContext}\n\nQuery: "${lastMessage}"\n\nAnswer based on the live data above.`,
      }],
    });

    return extractText(data) || "I couldn't process that request.";
  } catch (err: any) {
    console.error('Claude Chat Error:', err);
    return `System Error: ${err.message || 'AI Service unavailable'}`;
  }
};

export const chatWithDataStream = async (
  history: { role: 'user' | 'model'; text: string }[],
  currentContext: RefineryUnit[]
): Promise<AsyncIterable<string>> => {
  const plantContext = currentContext
    .map(u => `Unit: ${u.name} (Status: ${u.status})\nSensors: ${u.sensors.map(s => `${s.name}: ${s.value} ${s.unit}`).join(', ')}`)
    .join('\n---\n');

  const lastMessage = history[history.length - 1].text;

  return streamMessages({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    system: SYSTEM_INSTRUCTION,
    messages: [{
      role: 'user',
      content: `Plant Data:\n${plantContext}\n\nQuery: "${lastMessage}"\n\nAnswer based on the live data above.`,
    }],
  });
};

export const runOperatorChat = async (
  message: string,
  _history: { role: 'user' | 'model'; text: string }[],
  units: RefineryUnit[]
): Promise<string> => {
  try {
    const tools = [{
      name: 'set_process_parameter',
      description: 'Adjusts the setpoint (target value) for a specific sensor in the refinery.',
      input_schema: {
        type: 'object',
        properties: {
          unitId: { type: 'string', description: 'Unit ID (e.g. CDU-01)' },
          sensorId: { type: 'string', description: 'Sensor ID' },
          value: { type: 'number', description: 'New setpoint value' },
        },
        required: ['unitId', 'sensorId', 'value'],
      },
    }];

    const sensorMap = units
      .flatMap(u => u.sensors.map(s => `Unit: ${u.id}, Sensor: ${s.id} (${s.name}), PV: ${s.value}, SP: ${s.setpoint}`))
      .join('\n');

    const messages: MessageParam[] = [{
      role: 'user',
      content: `Plant State:\n${sensorMap}\n\nUser Request: "${message}"`,
    }];

    const data = await callMessages({
      model: MODEL,
      max_tokens: 1024,
      system: 'You are "Chief", the Lead DCS Operator. Help operators adjust process parameters safely.',
      tools,
      messages,
    });

    if (data.stop_reason === 'tool_use') {
      const toolUse = (data.content as any[]).find(c => c.type === 'tool_use');
      if (toolUse?.name === 'set_process_parameter') {
        const args = toolUse.input as { unitId: string; sensorId: string; value: number };
        updateSensorSetpoint(args.sensorId, args.value);

        const followUp = await callMessages({
          model: MODEL,
          max_tokens: 512,
          system: 'You are "Chief", the Lead DCS Operator.',
          messages: [
            ...messages,
            { role: 'assistant', content: data.content },
            {
              role: 'user',
              content: [{
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: `Successfully set ${args.sensorId} to ${args.value}`,
              }],
            },
          ],
        });

        return extractText(followUp) ||
          `Action Confirmed: ${args.sensorId} on ${args.unitId} → ${args.value}. Monitor PV for response.`;
      }
    }

    return extractText(data) || 'Standby.';
  } catch (err: any) {
    console.error('Operator Chat Error:', err);
    return `Comms Link Failure: ${err.message}`;
  }
};

export const parseOperationalData = async (
  rawText: string,
  units: RefineryUnit[]
): Promise<Record<string, number> | null> => {
  try {
    const schema = units.flatMap(u => u.sensors.map(s => `${s.id} (${s.name})`)).join(', ');
    const data = await callMessages({
      model: MODEL,
      max_tokens: 512,
      system: 'You are a data extraction assistant. Respond ONLY with a valid JSON object — no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `Extract sensor values. Return JSON: keys=sensor IDs, values=numbers.\nValid IDs: ${schema}\nReport: ${rawText}`,
      }],
    });
    const text = extractText(data);
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : JSON.parse(text);
  } catch (e) {
    console.error('Parsing Error:', e);
    return null;
  }
};

export const parseNaturalLanguageLog = async (
  logText: string,
  schemaContext: string
): Promise<Record<string, string> | null> => {
  try {
    const data = await callMessages({
      model: MODEL,
      max_tokens: 512,
      system: 'You are a data extraction assistant. Respond ONLY with valid JSON — no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `Extract operational values from this log. Return JSON matching schema: ${schemaContext}\nLog: "${logText}"`,
      }],
    });
    const text = extractText(data);
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : JSON.parse(text);
  } catch (e) {
    console.error('NLP Parse Error:', e);
    return null;
  }
};

export const parseMultimodalData = async (
  file: { inlineData: { data: string; mimeType: string } } | string,
  schemaContext: string
): Promise<Record<string, string> | null> => {
  try {
    const promptText = `Analyse this document and extract operational values. Return JSON matching schema: ${schemaContext}. Respond ONLY with valid JSON.`;

    let userContent: string | any[];

    if (typeof file === 'string') {
      userContent = `${promptText}\n\nDocument Text:\n${file}`;
    } else {
      userContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.inlineData.mimeType,
            data: file.inlineData.data,
          },
        },
        { type: 'text', text: promptText },
      ];
    }

    const data = await callMessages({
      model: MODEL,
      max_tokens: 512,
      system: 'You are a document analysis assistant. Respond only with valid JSON.',
      messages: [{ role: 'user', content: userContent }],
    });

    const text = extractText(data);
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : JSON.parse(text);
  } catch (e) {
    console.error('Multimodal Parse Error:', e);
    return null;
  }
};
