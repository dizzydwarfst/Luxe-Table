import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem, ChatMessage } from "../types";
import { MENU_ITEMS } from "../constants";

let _ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!_ai) {
    const key = process.env.API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set. AI features are unavailable.");
    }
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
};

const getMenuContext = (menu: MenuItem[]) => `Current Menu Items: ${JSON.stringify(menu.map(i => ({ id: i.id, name: i.name, category: i.category, description: i.description })))}`;

/**
 * Recommend a pairing based on a selected item.
 * Added responseSchema as per guidelines for JSON responses.
 */
export const getPairingRecommendation = async (item: MenuItem, currentMenu: MenuItem[]) => {
  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `The user just added ${item.name} to their cart. Based on our menu: ${getMenuContext(currentMenu)}, suggest ONE specific complementary item (drink, side, or dessert) that pairs perfectly.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the recommended item" },
            reason: { type: Type.STRING, description: "Short explanation for the pairing" }
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

/**
 * Chat with the AI Chef. 
 * Updated to return grounding sources to comply with Google Search requirements.
 */
export const chatWithChef = async (history: ChatMessage[], message: string, currentMenu: MenuItem[]) => {
  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Conversation History: ${JSON.stringify(history)}. New message: ${message}`,
      config: {
        systemInstruction: `You are "The Best Chef", the elite AI culinary companion at LuxeTable. You are sophisticated, helpful, and passionate about food. You know the current menu inside out: ${getMenuContext(currentMenu)}. 
        If users ask general culinary questions or about the restaurant's reputation, use your search tools. If they ask about specific dishes we have, be detailed about ingredients and taste.`,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e) {
    console.error(e);
    return {
      text: "I'm sorry, the AI Chef is currently unavailable. Please try again later.",
      sources: []
    };
  }
};

/**
 * AI logic for "Choose for Me" feature.
 */
export const chooseForMe = async (preferences: any, currentMenu: MenuItem[]) => {
  const response = await getAI().models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `The user has these preferences: ${JSON.stringify(preferences)}. 
    Based on our menu: ${getMenuContext(currentMenu)}, recommend a perfect 3-course meal (Appetizer, Entree, and Side/Drink). 
    Explain why this menu suits their mood.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendationText: { type: Type.STRING },
          itemIds: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }
          }
        },
        required: ["recommendationText", "itemIds"]
      },
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
};

/**
 * Sorting AI - Extracts and validates menu items from a URL using a two-step process.
 * Step 1: Research via Google Search grounding.
 * Step 2: Strictly structured JSON parsing.
 */
export const scanMenuUrl = async (url: string) => {
  // STEP 1: Research the full menu using Google Search
  const researchResponse = await getAI().models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are the LuxeTable Research AI. Your task is to deeply research the restaurant at this URL: ${url}.
    Find EVERY menu item available, including:
    - Appetizers, starters, and shareables
    - Salads and bowls
    - Main courses, entrees, steaks, and seafood
    - Pizza, burgers, sandwiches, and flatbreads
    - Stir-fry, noodles, and wok dishes
    - Full bar menu including cocktails, wine, beer, and non-alcoholic beverages
    - Happy hour and dessert items
    
    Ensure you find the exact names, descriptions, and current prices. For restaurant chains, look for location-specific menus if possible.`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });

  const rawResearchText = researchResponse.text || '';
  const sources = researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  // STEP 2: Parse the raw research text into structured JSON
  const parseResponse = await getAI().models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are the LuxeTable Categorization Specialist. Convert the following research text into a clean, structured JSON list of menu items.
    
    RESEARCH TEXT:
    ${rawResearchText}
    
    STRICT CATEGORY MAPPING RULES:
    - "Apps": Appetizers, starters, small plates, soups, dips, wings, spring rolls, bruschetta, charcuterie.
    - "Salads": Any salad, poke bowl, grain bowl, vegetable-forward bowl.
    - "Panfry": Stir-fry, noodles, pad thai, fried rice, sautéed dishes, tacos, curry, wok dishes, pasta (pan-cooked).
    - "Entree": Steaks, ribs, chicken breast, fish fillet, lamb, main courses, larger protein-focused plates, seafood mains.
    - "Ovens": Pizza, burgers, sandwiches, baked/roasted dishes, flatbreads, anything on a bun, baked pasta, casseroles.
    - "Bar": ALL cocktails, wine, beer, spirits, mocktails, specialty drinks, non-alcoholic beverages, smoothies, fresh juices.
    
    Ensure item names are EXACT. If a price is missing, use 0.`,
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
            allergens: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["name", "description", "price", "category"]
        }
      },
      thinkingConfig: { thinkingBudget: 32768 }
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
    console.error("Failed to parse menu items JSON:", e);
  }

  return {
    items,
    sources
  };
};