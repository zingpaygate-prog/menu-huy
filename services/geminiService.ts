import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

export const suggestMeal = async (menu: MenuItem[], prompt: string): Promise<string[][]> => {
  if (!process.env.API_KEY) {
    throw new Error("Khóa API chưa được định cấu hình. Vui lòng đặt biến môi trường API_KEY.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const fullPrompt = `
    Dựa trên thực đơn sau được cung cấp dưới dạng đối tượng JSON, vui lòng đề xuất 3 lựa chọn bữa ăn riêng biệt theo yêu cầu của người dùng (Yêu cầu bằng tiếng Việt).
    Mỗi lựa chọn nên là một sự kết hợp hợp lý các món ăn.

    Yêu cầu của người dùng: "${prompt}"

    Thực đơn:
    ${JSON.stringify(menu, null, 2)}

    Vui lòng CHỈ trả lời bằng một mảng JSON chứa chính xác 3 mảng con. Mỗi mảng con đại diện cho một lựa chọn bữa ăn và chứa tên chính xác của các món trong thực đơn được đề xuất.
    Ví dụ: [["Tên Món A", "Tên Món B"], ["Tên Món C"], ["Tên Món D", "Tên Món E"]].
    Nếu bạn không thể đưa ra bất kỳ gợi ý nào, hãy trả về một mảng trống: [].
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
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            }
          }
        },
      },
    });

    const jsonText = response.text.trim();
    const suggestedItems = JSON.parse(jsonText);
    
    if (
        Array.isArray(suggestedItems) && 
        suggestedItems.every(option => 
            Array.isArray(option) && 
            option.every(item => typeof item === 'string')
        )
    ) {
      return suggestedItems;
    } else {
      console.error("Gemini response was not a valid array of string arrays:", suggestedItems);
      return [];
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Không thể nhận được gợi ý từ AI.");
  }
};

export const suggestTeabreak = async (menu: MenuItem[]): Promise<string[][]> => {
  if (!process.env.API_KEY) {
    throw new Error("Khóa API chưa được định cấu hình. Vui lòng đặt biến môi trường API_KEY.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const fullPrompt = `
    Dựa trên thực đơn sau được cung cấp dưới dạng đối tượng JSON, vui lòng đề xuất 3 lựa chọn tiệc trà (teabreak) riêng biệt.

    Yêu cầu cấu trúc cho mỗi suất tiệc trà:
    - 2 món bánh (tìm trong danh mục 'bánh', 'tráng miệng', hoặc tương tự)
    - 1 món "Carmen" (có thể là panna cotta, caramen, sữa chua, hoặc món tráng miệng tương tự)
    - 1 món hoa quả (tìm trong danh mục 'hoa quả', 'trái cây')
    - 1 loại nước ép (tìm trong danh mục 'nước ép', 'đồ uống')
    - 1 loại trà
    - 1 loại cà phê

    Nếu một loại món ăn nào đó không có trong thực đơn, hãy cố gắng tìm món thay thế phù hợp. Mỗi gợi ý nên là một sự kết hợp hợp lý.

    Thực đơn:
    ${JSON.stringify(menu, null, 2)}

    Vui lòng CHỈ trả lời bằng một mảng JSON chứa chính xác 3 mảng con. Mỗi mảng con đại diện cho một lựa chọn tiệc trà và chứa tên chính xác của các món trong thực đơn được đề xuất.
    Ví dụ: [["Bánh Tiramisu", "Bánh Mousse Chanh Dây", "Panna Cotta Dâu", "Dưa Hấu", "Nước Cam", "Trà Lipton", "Cà Phê Đen"], ["Bánh...", "Bánh..."], ["Bánh...", "Bánh..."]].
    Nếu bạn không thể đưa ra bất kỳ gợi ý nào, hãy trả về một mảng trống: [].
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
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            }
          }
        },
      },
    });

    const jsonText = response.text.trim();
    const suggestedItems = JSON.parse(jsonText);
    
    if (
        Array.isArray(suggestedItems) && 
        suggestedItems.every(option => 
            Array.isArray(option) && 
            option.every(item => typeof item === 'string')
        )
    ) {
      return suggestedItems;
    } else {
      console.error("Gemini response was not a valid array of string arrays:", suggestedItems);
      return [];
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Không thể nhận được gợi ý từ AI.");
  }
};
