import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return null;
    }
    openai = new OpenAI({ 
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return openai;
}

const GENERATIVE_MODEL = process.env.OPENAI_GENERATIVE_MODEL || "gpt-4o-mini";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

function isLikelyNonEnglish(text: string): boolean {
  const nonEnglishPattern = /[\u0080-\uFFFF]/;
  return nonEnglishPattern.test(text);
}

export async function translateToEnglish(text: string): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    return text;
  }
  try {
    const response = await client.chat.completions.create({
      model: GENERATIVE_MODEL,
      messages: [
        { 
          role: "system", 
          content: "Translate the following text to English. Return ONLY the translated text, nothing else. If the text is already in English, return it as-is." 
        },
        { role: "user", content: text }
      ],
      temperature: 0.1,
      max_tokens: 200,
    });
    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

export async function generateSlug(title: string): Promise<string> {
  let textToSlugify = title;
  if (isLikelyNonEnglish(title)) {
    textToSlugify = await translateToEnglish(title);
  }
  return slugify(textToSlugify);
}

export async function generatePromptSlug(title: string): Promise<string> {
  const englishTitle = await translateToEnglish(title);
  return slugify(englishTitle);
}
