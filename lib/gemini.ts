import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem, ChatMessage } from "../types";

let _ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!_ai) {
    const key = import.meta.env.VITE_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set.");
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
};

const getMenuContext = (menu: MenuItem[]) =>
  `Menu: ${JSON.stringify(menu.map(i => ({ id: i.id, name: i.name, category: i.category, description: i.description, price: i.price })))}`;

export const getPairingRecommendation = async (item: MenuItem, currentMenu: MenuItem[]) => {
  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User added "${item.name}" to cart. ${getMenuContext(currentMenu)}. Suggest ONE complementary item from the menu.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["name", "reason"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const chatWithChef = async (history: ChatMessage[], message: string, currentMenu: MenuItem[]) => {
  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are "The Best Chef", a warm and knowledgeable AI culinary companion at LuxeTable restaurant.
      Keep responses friendly and under 4 sentences unless the user asks for detail.
      Current menu you know inside out: ${getMenuContext(currentMenu)}.
      
      Recent conversation: ${JSON.stringify(history.slice(-4))}
      
      User says: ${message}
      
      Respond as The Best Chef:`,
    });
    return {
      text: response.text,
      sources: []
    };
  } catch (e) {
    console.error(e);
    return {
      text: "I apologize, I am momentarily unavailable. Please try again!",
      sources: []
    };
  }
};

export const chooseForMe = async (preferences: any, currentMenu: MenuItem[]) => {
  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User dining preferences: ${JSON.stringify(preferences)}. 
      Pick a perfect 3-course meal from this menu: ${getMenuContext(currentMenu)}.
      Choose one appetizer, one main, and one drink or side.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendationText: { type: Type.STRING },
            itemIds: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["recommendationText", "itemIds"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const scanMenuUrl = async (url: string) => {
  // Step 1: Research with Google Search
  const researchResponse = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Research ALL menu items at this restaurant: ${url}. 
    Find every item with its name, description, and price. Include drinks and desserts.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const rawResearchText = researchResponse.text || '';
  const sources = researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  // Step 2: Parse into structured JSON
  const parseResponse = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Convert this restaurant menu research into a structured JSON list.
    
    RESEARCH TEXT: ${rawResearchText}
    
    CATEGORY RULES:
    - "Apps": Appetizers, starters, wings, soups, small plates
    - "Salads": Salads, bowls, greens
    - "Panfry": Stir-fry, noodles, pasta, tacos, curry, wok dishes
    - "Entree": Steaks, chicken mains, fish, seafood, lamb, ribs
    - "Ovens": Pizza, burgers, sandwiches, baked dishes, flatbreads
    - "Bar": All drinks including cocktails, wine, beer, mocktails, coffee`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            price: { type: Type.NUMBER },
            category: {
              type: Type.STRING,
              enum: ["Apps", "Salads", "Panfry", "Entree", "Ovens", "Bar"]
            },
            calories: { type: Type.INTEGER },
            allergens: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "description", "price", "category"]
        }
      }
    }
  });

  const items: Partial<MenuItem>[] = [];
  try {
    const parsedData = JSON.parse(parseResponse.text || '[]');
    if (Array.isArray(parsedData)) {
      parsedData.forEach((item: any) => {
        items.push({
          ...item,
          id: `ext-${Math.random().toString(36).substr(2, 5)}`,
          image: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80`
        });
      });
    }
  } catch (e) {
    console.error("Failed to parse menu JSON:", e);
  }

  return { items, sources };
};