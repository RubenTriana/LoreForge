import { db } from '../db/db';

/**
 * Servicio dinámico para interactuar con diversos LLMs.
 * Soporta OpenAI, Anthropic y Google Gemini.
 */
export async function analyzeWithScriptDoctor(stepTitle, stepContent, universeId, stepObjective) {
  // 1. Obtener configuración y contexto desde Dexie
  const settings = await db.settings.toCollection().first();
  const universe = universeId ? await db.universes.get(universeId) : null;
  
  if (!settings || !settings.apiKey) {
    throw new Error("Por favor, configura tu API Key en el Portal de IA");
  }

  const { provider, apiKey, temperature, systemRole } = settings;

  // 2. Preparar el contexto de Lore
  const loreContext = universe 
    ? `Contexto del Universo:
       - Género: ${universe.genre || 'No definido'}
       - Descripción: ${universe.description || 'No definida'}
       - Lore/Reglas: ${universe.lore || 'No definidas'}`
    : 'No hay contexto de lore disponible.';

  // 3. Preparar el prompt estructurado
  const mainInstruction = `
    Eres un Script Doctor experto. Analiza este hito: '${stepTitle}'.
    
    OBJETIVO: "${stepObjective}"
    CONTENIDO: "${stepContent}"
    
    ${loreContext}
    
    TAREA:
    1. Evalúa cumplimiento del OBJETIVO y LORE (0-100).
    2. Proporciona un feedback BREVE (MÁXIMO 100 CARACTERES).
    3. Sugiere una mejora corta.

    Responde ÚNICAMENTE en JSON:
    {
      "score": number,
      "feedback": "string (máx 100 caracteres)",
      "suggestions": "string"
    }
  `;

  const fullSystemPrompt = systemRole ? `${systemRole}\n\n${mainInstruction}` : mainInstruction;

  let responseData = {
    text: '',
    promptTokens: 0,
    completionTokens: 0,
    analysis: null
  };

  try {
    let rawText = '';
    switch (provider) {
      case 'openai':
        const oaResponse = await fetch('/api-openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemRole || 'Eres un experto Script Doctor.' },
              { role: 'user', content: mainInstruction }
            ],
            temperature: temperature || 0.7,
            response_format: { type: "json_object" }
          })
        });
        
        if (!oaResponse.ok) throw new Error(`OpenAI Error: ${oaResponse.statusText}`);
        const oaData = await oaResponse.json();
        rawText = oaData.choices[0].message.content;
        responseData.promptTokens = oaData.usage.prompt_tokens;
        responseData.completionTokens = oaData.usage.completion_tokens;
        break;

      case 'anthropic':
        const antResponse = await fetch('/api-anthropic/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            'dangerouslyAllowBrowser': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            system: systemRole || '',
            messages: [{ role: 'user', content: mainInstruction + "\nResponde solo en JSON." }],
            temperature: temperature || 0.7
          })
        });

        if (!antResponse.ok) throw new Error(`Anthropic Error: ${antResponse.statusText}`);
        const antData = await antResponse.json();
        rawText = antData.content[0].text;
        responseData.promptTokens = antData.usage.input_tokens;
        responseData.completionTokens = antData.usage.output_tokens;
        break;

      case 'gemini':
        const geminiUrl = `/api-gemini/v1beta/models/gemini-flash-latest:generateContent`;
        const gemResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: fullSystemPrompt + "\nResponde solo en JSON." }]
            }],
            generationConfig: {
              temperature: temperature || 0.7,
              maxOutputTokens: 1024
            }
          })
        });

        if (!gemResponse.ok) {
          const errorData = await gemResponse.json().catch(() => ({}));
          const errMsg = errorData.error?.message || gemResponse.statusText || "Bad Request";
          console.error("Gemini Error Detail:", errorData);
          throw new Error(`Gemini Error: ${errMsg}`);
        }
        const gemData = await gemResponse.json();
        rawText = gemData.candidates[0].content.parts[0].text;
        responseData.promptTokens = gemData.usageMetadata?.promptTokenCount || Math.floor(fullSystemPrompt.length / 4);
        responseData.completionTokens = gemData.usageMetadata?.candidatesTokenCount || Math.floor(rawText.length / 4);
        break;

      default:
        throw new Error(`Proveedor no soportado: ${provider}`);
    }

    // Función para limpiar el texto de respuesta, eliminando bloques de código markdown
    const cleanJson = (text) => {
      const match = text.match(/```json\s?([\s\S]*?)\s?```/);
      return match ? match[1].trim() : text.trim();
    };

    // Intentar parsear el JSON después de limpiar el texto
    try {
      responseData.analysis = JSON.parse(cleanJson(rawText));
      responseData.text = responseData.analysis.suggestions; // Por retrocompatibilidad si es necesario
    } catch (e) {
      console.warn("Error parseando respuesta JSON de IA:", rawText);
      responseData.text = rawText;
    }

    return responseData;

  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
}

/**
 * Función de prueba para verificar la conectividad con el proveedor de IA.
 */
export async function testAiConnection() {
  const settings = await db.settings.toCollection().first();
  if (!settings || !settings.apiKey) {
    throw new Error("No hay API Key configurada.");
  }

  const { provider, apiKey } = settings;

  try {
    switch (provider) {
      case 'openai':
        const oaResp = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!oaResp.ok) throw new Error("API Key inválida o error de conexión.");
        return true;

      case 'anthropic':
        // Anthropic no tiene un endpoint de health check simple sin tokens, 
        // pero podemos probar un mensaje mínimo.
        const antResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            'dangerouslyAllowBrowser': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }]
          })
        });
        if (!antResp.ok) throw new Error("Error de conexión con Anthropic.");
        return true;

      case 'gemini':
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${apiKey}`;
        const gemResp = await fetch(geminiUrl);
        if (!gemResp.ok) throw new Error("Error de conexión con Gemini.");
        return true;

      default:
        throw new Error("Proveedor no configurado.");
    }
  } catch (error) {
    console.error("Connection Test Error:", error);
    throw error;
  }
}
