// llm.js

import OpenAI from 'openai';
import fs from 'fs-extra';
import { encode } from 'gpt-3-encoder';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "https://tonsite.com",
        "X-Title": "CVTransformerApp",
    },
});

async function callLLM(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: "meta-llama/llama-4-maverick:free",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
        });

        const message = response.choices?.[0]?.message?.content;
        if (!message) {
            throw new Error("LLM response is empty or malformed.");
        }

        return message.trim();
    } catch (error) {
        console.error("LLM API call failed:", error);
        throw new Error("Failed to get a valid response from the LLM.");
    }
}


export async function extractFieldsWithLLM(templateHtml) {
    const prompt = `You are an AI assistant. Analyze the following HTML CV template and extract a list of fields that should be filled, like name, email, experience, education, certifications, languages, skills, etc. Return them as a JSON array. Only return the JSON array, no explanations. \n\n---\n${templateHtml}\n---`;

    const result = await callLLM(prompt);

    console.log('LLM Response for fields:', result);

    const arrayMatch = result.match(/\[[\s\S]*?\]/);
    if (!arrayMatch) {
        throw new Error("No JSON array found in LLM response.");
    }

    return JSON.parse(arrayMatch[0]);
}

export async function extractDataWithLLM(cvText, requiredFields) {
    const prompt = `You are an HR expert. Extract ONLY the following fields from the provided CV text: ${JSON.stringify(requiredFields)}. Return JSON.\n\nDo not summarize experiences, certifications, or education—extract complete details with dates and responsibilities.\n\n---\n${cvText}\n---`;

    const result = await callLLM(prompt);

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("No JSON object found in LLM response.");
    }

    return JSON.parse(jsonMatch[0]);
}

export async function generateFilledCVWithLLM(templateHtml, fields, data) {
    const prompt = `
You are a strict HTML transformer assistant.

You will be given:
1. An HTML CV template.
2. A list of fields required to be filled in that template.
3. A JSON object with the extracted CV data.

Your tasks:
- Fill the template exactly using the data provided.
- Preserve all original styles, table layout, margins, and formatting.
- The final HTML must look visually clean and respect standard page margins (2.5 cm top/bottom, 2 cm left/right).
- If the content exceeds one page, it should flow naturally to additional pages (no content cutoff).
- DO NOT remove or alter any style, table layout, or HTML tags.
- DO NOT add any comments, titles, or explanations.
- Simply return the fully filled HTML as is — nothing before or after.

---
Template HTML:
${templateHtml}

Fields:
${JSON.stringify(fields)}

Data:
${JSON.stringify(data, null, 2)}
---
`.trim();

    return await callLLM(prompt);
}