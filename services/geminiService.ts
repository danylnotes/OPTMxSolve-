
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { RefineryUnit, Sensor } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";
import { updateSensorSetpoint } from "./mockDataService";

// Lazy initialization of the AI client to prevent runtime crashes if env vars are missing at load time
let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
    if (!aiInstance) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API_KEY is missing in process.env");
            throw new Error("Service Configuration Error: API_KEY is missing.");
        }
        aiInstance = new GoogleGenAI({ apiKey });
    }
    return aiInstance;
};

export const analyzeUnitStatus = async (unit: RefineryUnit): Promise<string> => {
  try {
    const ai = getAiClient();
    const sensorSummary = unit.sensors.map(s => 
      `- ${s.name} (${s.type}): Current ${s.value} ${s.unit} (Range: ${s.threshold.min}-${s.threshold.max}) Status: ${s.status}`
    ).join('\n');

    const prompt = `
      Analyze the current status of ${unit.name} (${unit.description}).
      
      Current Efficiency: ${unit.efficiency}%
      Overall Status: ${unit.status}
      
      Sensor Readings:
      ${sensorSummary}
      
      Provide a brief operational assessment, potential root causes for any warnings, and recommended actions for the operator.
      Format as Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
      }
    });

    if (!response.text) throw new Error("Empty response from analysis service.");
    return response.text;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    return `ERROR: ${error.message || "Unable to generate unit analysis. Please check connection."}`;
  }
};

export const getPredictiveMaintenanceReport = async (metrics: any[]): Promise<string> => {
    try {
        const ai = getAiClient();
        const metricsSummary = metrics.map(m => 
            `- Asset: ${m.asset} (${m.location}). Running Hours: ${m.runningHours}, MTBF: ${m.mtbf}, Reliability Index: ${m.reliabilityIndex}%, Downtime: ${m.downtime}h.`
        ).join('\n');

        const prompt = `
            Perform a Predictive Maintenance Analysis for the following refinery assets:
            ${metricsSummary}

            Based on MTBF (Mean Time Between Failures), current running hours, and the Reliability Index:
            1. Identify the TOP 2 highest risk assets.
            2. Predict the estimated "Remaining Useful Life" (RUL) before the next significant failure.
            3. Provide specific technical recommendations (e.g., vibration check, seal replacement, lubrication analysis).
            4. Rank risk levels as CRITICAL, HIGH, or MEDIUM.

            Be technical and concise. Format the output as clean Markdown.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: "You are an expert Reliability Engineer specializing in Rotating Equipment and Static Assets in oil refineries.",
                temperature: 0.2,
            }
        });

        if (!response.text) throw new Error("Empty response from predictive service.");
        return response.text;
    } catch (error: any) {
        console.error("Predictive Analysis Error:", error);
        return `ERROR: ${error.message || "Predictive analysis service unavailable."}`;
    }
};

export const chatWithData = async (
  history: {role: 'user' | 'model', text: string}[], 
  currentContext: RefineryUnit[]
): Promise<string> => {
    try {
        const ai = getAiClient();
        const plantContext = currentContext.map(u => 
            `Unit: ${u.name} (Status: ${u.status})\nSensors: ${u.sensors.map(s => `${s.name}: ${s.value} ${s.unit}`).join(', ')}`
        ).join('\n---\n');

        const lastMessage = history[history.length - 1].text;
        
        const prompt = `
        Current Plant Data Context:
        ${plantContext}
        
        User Query: "${lastMessage}"
        
        Answer the user's query based on the live plant data provided above.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });

        return response.text || "I couldn't process that request.";

    } catch (error: any) {
        console.error("Gemini Chat Error:", error);
        return `System Error: ${error.message || "AI Service unavailable"}`;
    }
}

export const chatWithDataStream = async (
  history: {role: 'user' | 'model', text: string}[], 
  currentContext: RefineryUnit[]
) => {
    try {
        const ai = getAiClient();
        const plantContext = currentContext.map(u => 
            `Unit: ${u.name} (Status: ${u.status})\nSensors: ${u.sensors.map(s => `${s.name}: ${s.value} ${s.unit}`).join(', ')}`
        ).join('\n---\n');

        const lastMessage = history[history.length - 1].text;
        
        const prompt = `
        Current Plant Data Context:
        ${plantContext}
        
        User Query: "${lastMessage}"
        
        Answer the user's query based on the live plant data provided above.
        `;

        const response = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7
            }
        });

        return response;

    } catch (error: any) {
        console.error("Gemini Chat Stream Error:", error);
        throw new Error(error.message || "Stream Connection Failed");
    }
}

export const runOperatorChat = async (
  message: string,
  history: {role: 'user' | 'model', text: string}[],
  units: RefineryUnit[]
): Promise<string> => {
    const setParameterTool: FunctionDeclaration = {
        name: 'set_process_parameter',
        description: 'Adjusts the setpoint (target value) for a specific sensor in the refinery.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                unitId: { type: Type.STRING },
                sensorId: { type: Type.STRING },
                value: { type: Type.NUMBER }
            },
            required: ['unitId', 'sensorId', 'value']
        }
    };

    const sensorMap = units.flatMap(u => u.sensors.map(s => 
        `Unit: ${u.id}, Sensor: ${s.id} (${s.name}), Current PV: ${s.value}, Current SP: ${s.setpoint}`
    )).join('\n');

    const prompt = `
    You are "Chief", the Lead DCS Operator for the refinery. 
    Current Plant State:
    ${sensorMap}
    User Request: "${message}"
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{ functionDeclarations: [setParameterTool] }],
            }
        });

        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            if (call.name === 'set_process_parameter') {
                const args = call.args as any;
                updateSensorSetpoint(args.sensorId, args.value);
                return `Action Confirmed: Setting ${args.sensorId} on ${args.unitId} to ${args.value}. Monitor the PV for response.`;
            }
        }
        return response.text || "Standby.";
    } catch (error: any) {
        console.error("Operator Chat Error:", error);
        return `Comms Link Failure: ${error.message}`;
    }
};

export const parseOperationalData = async (
    rawText: string, 
    units: RefineryUnit[]
): Promise<Record<string, number> | null> => {
    try {
        const ai = getAiClient();
        const schema = units.flatMap(u => u.sensors.map(s => `${s.id} (${s.name})`)).join(', ');
        const prompt = `Task: Extract sensor values. Keys: IDs. Values: numbers. Report: ${rawText}`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) { 
        console.error("Parsing Error:", e);
        return null; 
    }
};

export const parseNaturalLanguageLog = async (
    logText: string, 
    schemaContext: string
): Promise<Record<string, string> | null> => {
    try {
        const ai = getAiClient();
        const prompt = `Extract operational values. Schema: ${schemaContext}. Log: "${logText}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) { 
        console.error("NLP Parse Error:", e);
        return null; 
    }
};

export const parseMultimodalData = async (
    file: { inlineData: { data: string; mimeType: string } } | string,
    schemaContext: string
): Promise<Record<string, string> | null> => {
    try {
        const ai = getAiClient();
        const promptText = `Analyze document and extract operational values. Schema: ${schemaContext}`;
        let parts: any[] = [];
        if (typeof file === 'string') parts.push({ text: promptText + `\n\nDocument Text:\n${file}` });
        else { parts.push(file); parts.push({ text: promptText }); }
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts },
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) { 
        console.error("Multimodal Parse Error:", e);
        return null; 
    }
};
