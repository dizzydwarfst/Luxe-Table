import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured on server");
  return new GoogleGenAI({ apiKey: key });
};

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, payload } = req.body;

  try {
    const ai = getAI();

    switch (action) {

      case "chat": {
        const { history, message, menu } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `You are "The Best Chef", a warm and knowledgeable AI culinary companion at LuxeTable restaurant.
Keep responses friendly and under 4 sentences unless the user asks for detail.
Current menu you know inside out: ${JSON.stringify(menu)}.
Recent conversation: ${JSON.stringify(history)}
User says: ${message}
Respond as The Best Chef:`,
        });
        return res.json({ text: response.text, sources: [] });
      }

      case "pairing": {
        const { item, menu } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `User added "${item.name}" to cart. Menu: ${JSON.stringify(menu)}. Suggest ONE complementary item from the menu.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["name", "reason"],
            },
          },
        });
        return res.json(JSON.parse(response.text || "{}"));
      }

      case "choose": {
        const { preferences, menu } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `User dining preferences: ${JSON.stringify(preferences)}.
Pick a perfect 3-course meal from this menu: ${JSON.stringify(menu)}.
Choose one appetizer, one main, and one drink or side.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendationText: { type: Type.STRING },
                itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["recommendationText", "itemIds"],
            },
          },
        });
        return res.json(JSON.parse(response.text || "{}"));
      }

      case "scan": {
        const { url } = payload;
        // Step 1: Research with Google Search
        const researchResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Research ALL menu items at this restaurant: ${url}.
Find every item with its name, description, and price. Include drinks and desserts.`,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        const rawText = researchResponse.text || "";
        const sources = researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        // Step 2: Parse into structured JSON
        const parseResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Convert this restaurant menu research into a structured JSON list.
RESEARCH TEXT: ${rawText}
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
                    enum: ["Apps", "Salads", "Panfry", "Entree", "Ovens", "Bar"],
                  },
                  calories: { type: Type.INTEGER },
                  allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["name", "description", "price", "category"],
              },
            },
          },
        });

        let items: any[] = [];
        try {
          const parsed = JSON.parse(parseResponse.text || "[]");
          if (Array.isArray(parsed)) {
            items = parsed.map((item: any) => ({
              ...item,
              id: `ext-${Math.random().toString(36).substr(2, 5)}`,
              image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
            }));
          }
        } catch (e) {
          console.error("Failed to parse menu JSON:", e);
        }

        return res.json({ items, sources });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    console.error("Gemini proxy error:", e);
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
}