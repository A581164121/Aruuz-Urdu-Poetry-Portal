
import { GoogleGenAI, Type } from "@google/genai";
import { MeterAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzePoetryMeter = async (text: string): Promise<MeterAnalysis | null> => {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
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

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Meter analysis failed:", error);
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
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `${instruction}\n\nصارف کی فراہم کردہ معلومات:\n${text}`,
    });

    return response.text || "تجزیہ فراہم نہیں کیا جا سکا۔";
  } catch (error) {
    console.error("Literary analysis failed:", error);
    return "تجزیہ کرنے میں کچھ مشکل پیش آئی۔ براہ کرم دوبارہ کوشش کریں۔";
  }
};

export const generatePoetryAlternatives = async (text: string, meter: string): Promise<string[]> => {
  if (!process.env.API_KEY) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert Urdu poet. Given the verse "${text}" which is in the meter "${meter}", generate 5 to 10 creative alternative verses that maintain exactly the same meter and core theme but use different vocabulary, metaphors, or imagery.
      Return the result as a simple list of verses in Urdu, one per line.`,
    });

    return response.text?.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^\d+[\.\s]*/, '').trim()) || [];
  } catch (error) {
    console.error("Alternative generation failed:", error);
    return [];
  }
};

export const generateCoupletCompletion = async (text: string, meter: string): Promise<string[]> => {
  if (!process.env.API_KEY) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert Urdu poet. Given the first verse (Misra-e-Ula) "${text}" in the meter "${meter}", generate 5 different options for the second verse (Misra-e-Saani) to complete the couplet. The second verse must strictly follow the same meter "${meter}" and be semantically linked to the first verse.
      Return the result as a simple list of verses in Urdu, one per line.`,
    });

    return response.text?.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^\d+[\.\s]*/, '').trim()) || [];
  } catch (error) {
    console.error("Couplet completion failed:", error);
    return [];
  }
};

export const generateStanzaTazmeen = async (text: string, meter: string): Promise<string> => {
  if (!process.env.API_KEY) return "API Key is missing.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `آپ ایک ماہرِ اردو شاعر اور استاد کے طور پر اس مصرعے "${text}" پر تظمین کریں۔ 
      تظمین میں اس مصرعے کو شامل کرتے ہوئے پانچ مصرعوں پر مشتمل ایک خوبصورت بند (stanza) تخلیق کریں۔ 
      تمام مصرعے بحر "${meter}" میں ہونے چاہئیں۔ 
      تظمین کا مقصد مصرعے کے خیال کو وسعت دینا اور اسے فنی طور پر مکمل کرنا ہے۔ 
      جواب صرف اردو بند کی صورت میں دیں جس میں ہر مصرع الگ لائن پر ہو۔`,
    });

    return response.text || "تظمین تخلیق نہیں کی جا سکی۔";
  } catch (error) {
    console.error("Tazmeen generation failed:", error);
    return "تظمین کرنے میں کچھ مشکل پیش آئی۔";
  }
};

/**
 * Sends a message to the AI Ustad in a conversational context.
 * Includes context of current meter and poetry for "LiveChat" style updates.
 */
export const sendPoetryChatMessage = async (message: string, currentPoetry: string, meter: string = ""): Promise<string> => {
  if (!process.env.API_KEY) return "API کلید موجود نہیں ہے۔";

  try {
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

    const response = await chat.sendMessage({ message });
    return response.text || "معذرت، میں آپ کی بات سمجھ نہیں سکا۔";
  } catch (error) {
    console.error("Chat error:", error);
    return "گفتگو کے دوران کچھ مسئلہ پیش آیا۔";
  }
};
