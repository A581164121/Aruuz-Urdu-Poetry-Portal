
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MeterAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Enhanced helper to call Gemini with robust exponential backoff for 429 (Rate Limit) errors.
 * Detects rate limits even if buried in the error object.
 */
async function callGeminiWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 5000
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await apiCall();
    } catch (error: any) {
      // Robust detection of rate limit/quota errors
      const errorString = (error?.message || "") + JSON.stringify(error);
      const isRateLimit = 
        error?.status === 429 || 
        errorString.includes('429') || 
        errorString.toLowerCase().includes('resource_exhausted') || 
        errorString.toLowerCase().includes('quota') ||
        errorString.toLowerCase().includes('too many requests');
      
      if (isRateLimit && retries < maxRetries) {
        // Exponential backoff: 5s, 10s, 20s, 40s, 80s
        const delay = initialDelay * Math.pow(2, retries);
        console.warn(`[Aruuz AI] Rate limit/Quota hit. Retrying in ${delay}ms... (Attempt ${retries + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries++;
        continue;
      }
      
      // If we exhausted retries or it's not a rate limit, rethrow
      throw error;
    }
  }
}

export const analyzePoetryMeter = async (text: string): Promise<MeterAnalysis | null> => {
  if (!process.env.API_KEY) return null;

  try {
    const result = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the Urdu poetry meter (Aruuz/Taqti) for the following text: "${text}". 
        Return the analysis in a structured JSON format including the meter name and a breakdown of words with their weights.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The name of the Urdu Bahr (meter)" },
              results: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    scansion: { type: Type.STRING, description: "1 for long, 0 for short" },
                    weight: { type: Type.STRING, description: "The Arkan/Afayeel like 'فاعلن'" }
                  }
                }
              }
            },
            required: ["name", "results"]
          }
        }
      });
    });

    return JSON.parse(result.text.trim());
  } catch (error) {
    console.error("Meter analysis failed finally:", error);
    return null;
  }
};

export const analyzePoetryLiterary = async (text: string, mode: string = "general"): Promise<string> => {
  if (!process.env.API_KEY) return "API Key is missing.";

  const instructions: Record<string, string> = {
    tajziya: "آپ ایک کہنہ مشق اردو ناقد کے طور پر اس کلام کا فنی اور ادبی جائزہ لیں۔ محاسن اور معائب پر مفصل روشنی ڈالیں۔",
    islah: "آپ ایک مشفق استادِ سخن کے طور پر اس کلام کی اصلاح کریں۔ الفاظ کی نشست و برخاست درست کریں اور بہتر متبادل تجویز کریں۔",
    completion: "اس مصرعے کی تکمیل کے لیے پانچ بہترین متبادل مصرعِ ثانی تجویز کریں۔",
    alternatives: "اس مصرعے کے ہم وزن اور ہم معنی 10 متبادل مصرعے تحریر کریں۔",
    tazmeen: "اس مصرعے پر تظمین کرتے ہوئے پانچ مصرعوں کا ایک بند (stanza) تخلیق کریں جس میں یہ مصرع شامل ہو۔",
    generate_full: "صارف کے فراہم کردہ قوافی اور ردیف (اگر دیے گئے ہوں) کی بنیاد پر ایک مکمل غزل یا نعت تخلیق کریں۔ بحر کا خاص خیال رکھیں۔ کلام میں کم از کم 5 اشعار ہوں۔"
  };

  const instruction = instructions[mode] || instructions.tajziya;

  try {
    const result = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${instruction}\n\nصارف کی فراہم کردہ معلومات:\n${text}`,
      });
    });

    return result.text || "تجزیہ فراہم نہیں کیا جا سکا۔";
  } catch (error) {
    console.error("Literary analysis failed finally:", error);
    return "معذرت، ابھی سرور پر بوجھ بہت زیادہ ہے۔ براہ کرم تھوڑی دیر (تقریباً ایک منٹ) بعد دوبارہ کوشش کریں۔";
  }
};

export const sendPoetryChatMessage = async (message: string, currentPoetry: string, meter: string = ""): Promise<string> => {
  if (!process.env.API_KEY) return "API کلید موجود نہیں ہے۔";

  try {
    const result = await callGeminiWithRetry(async () => {
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `آپ ایک مشفق اور صاحبِ علم 'استادِ سخن' (AI Ustad) ہیں۔ آپ کا کام شعراء کی ادبی رہنمائی کرنا ہے۔ 
          صارف کا موجودہ کلام یہ ہے: "${currentPoetry}"
          کلام کی موجودہ بحر: "${meter}"
          اگر صارف کسی مصرعے کی تبدیلی یا نئے شعر کا مطالبہ کرے تو بحر کا خاص خیال رکھتے ہوئے جواب دیں۔
          اردو زبان کا بہترین استعمال کریں اور ادبی لہجہ برقرار رکھیں۔`,
        },
      });
      return await chat.sendMessage({ message });
    });

    return result.text || "معذرت، میں آپ کی بات سمجھ نہیں سکا۔";
  } catch (error) {
    console.error("Chat error finally:", error);
    return "گفتگو کے دوران کچھ مسئلہ پیش آیا۔ شاید سرور بہت زیادہ مصروف ہے۔";
  }
};
