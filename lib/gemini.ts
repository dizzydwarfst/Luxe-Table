import { MenuItem, ChatMessage } from "../types";

// All Gemini calls go through our secure serverless function.
// The API key never reaches the browser.
const call = async (action: string, payload: object) => {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
};

// Only send what the AI needs — saves tokens and bandwidth
const slim = (menu: MenuItem[]) =>
  menu.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    description: i.description,
    price: i.price,
  }));

export const getPairingRecommendation = async (
  item: MenuItem,
  currentMenu: MenuItem[]
) => {
  try {
    return await call("pairing", { item, menu: slim(currentMenu) });
  } catch (e) {
    console.error("Pairing recommendation failed:", e);
    return null;
  }
};

export const chatWithChef = async (
  history: ChatMessage[],
  message: string,
  currentMenu: MenuItem[]
) => {
  try {
    return await call("chat", {
      history: history.slice(-4),
      message,
      menu: slim(currentMenu),
    });
  } catch (e) {
    console.error("Chat failed:", e);
    return {
      text: "I apologize, I am momentarily unavailable. Please try again!",
      sources: [],
    };
  }
};

export const chooseForMe = async (preferences: any, currentMenu: MenuItem[]) => {
  try {
    return await call("choose", { preferences, menu: slim(currentMenu) });
  } catch (e) {
    console.error("Choose for me failed:", e);
    return null;
  }
};

export const scanMenuUrl = async (url: string) => {
  return await call("scan", { url });
};