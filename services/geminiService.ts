import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

export const suggestMeal = async (menu: MenuItem[], prompt: string): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("Khóa API chưa được định cấu hình. Vui lòng đặt biến môi trường API_KEY.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const fullPrompt = `
    Dựa trên thực đơn sau được cung cấp dưới dạng đối tượng JSON, vui lòng đề xuất một bữa ăn theo yêu cầu của người dùng (Yêu cầu bằng tiếng Việt).
    
    Yêu cầu của người dùng: "${prompt}"

    Thực đơn:
    ${JSON.stringify(menu, null, 2)}

    Vui lòng CHỈ trả lời bằng một mảng JSON chứa tên chính xác của các món trong thực đơn được đề xuất. Ví dụ: ["Tên Món 1", "Tên Món 2"].
    Nếu bạn không thể đưa ra gợi ý, hãy trả về một mảng trống.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          }
        },
      },
    });

    const jsonText = response.text.trim();
    const suggestedItems = JSON.parse(jsonText);
    
    if (Array.isArray(suggestedItems) && suggestedItems.every(item => typeof item === 'string')) {
      return suggestedItems;
    } else {
      console.error("Gemini response was not a valid array of strings:", suggestedItems);
      return [];
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Không thể nhận được gợi ý từ AI.");
  }
};