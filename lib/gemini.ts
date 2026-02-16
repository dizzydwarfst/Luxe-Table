
import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem, ChatMessage } from "../types";
import { MENU_ITEMS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getMenuContext = (menu: MenuItem[]) => `Current Menu Items: ${JSON.stringify(menu.map(i => ({ id: i.id, name: i.name, category: i.category, description: i.description })))}`;

/**
 * Recommend a pairing based on a selected item.
 * Added responseSchema as per guidelines for JSON responses.
 */
export const getPairingRecommendation = async (item: MenuItem, currentMenu: MenuItem[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
};

/**
 * Chat with the AI Chef. 
 * Updated to return grounding sources to comply with Google Search requirements.
 */
export const chatWithChef = async (history: ChatMessage[], message: string, currentMenu: MenuItem[]) => {
  const response = await ai.models.generateContent({
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
};

/**
 * AI logic for "Choose for Me" feature.
 */
export const chooseForMe = async (preferences: any, currentMenu: MenuItem[]) => {
  const response = await ai.models.generateContent({
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
 * Sorting AI - Extracts and validates menu items from a URL.
 * Uses Google Search for cross-referencing and verification.
 */
export const scanMenuUrl = async (url: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are the LuxeTable "Sorting AI". Your mission is to research the restaurant at this URL: ${url}.
    
    1. Deeply extract the full menu.
    2. Act as a verification specialist: ensure item names, descriptions, and prices are accurate based on current search data.
    3. Categorization Specialist: You MUST strictly map every item into one of these internal LuxeTable stations:
       - Apps (Appetizers, starters, small plates)
       - Salads (Leafy greens, vegetable bowls)
       - Panfry (Sautéed items, noodles, stir-fry)
       - Entree (Main courses, steaks, large plates)
       - Ovens (Pizzas, roasted meats, baked dishes)
       - Bar (Cocktails, wine, beer, spirits, non-alcoholic specialty drinks)
    
    Use Google Search to cross-reference multiple sources if the URL is limited.
    
    Output Format:
    DATA| [Name] | [Rich Description] | [Price] | [Category] | [Estimated Calories] | [Common Allergens]`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });

  const text = response.text || '';
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  const lines = text.split('\n');
  const items: Partial<MenuItem>[] = [];
  
  lines.forEach(line => {
    if (line.trim().startsWith('DATA|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 5) {
        const price = parseFloat(parts[3].replace(/[^0-9.]/g, '')) || 0;
        const calories = parts[5] ? parseInt(parts[5].replace(/\D/g, '')) : undefined;
        const allergens = parts[6] ? parts[6].split(',').map(a => a.trim()).filter(a => a) : [];
        
        items.push({
          id: `ext-${Math.random().toString(36).substr(2, 5)}`,
          name: parts[1],
          description: parts[2],
          price: price,
          category: (parts[4] as any) || 'Entree',
          calories,
          allergens,
          image: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80`
        });
      }
    }
  });

  return {
    items,
    sources: groundingChunks
  };
};
