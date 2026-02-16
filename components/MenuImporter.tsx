
import React, { useState, useEffect } from 'react';
import { scanMenuUrl } from '../lib/gemini';
import { MenuItem } from '../types';
import { CATEGORIES } from '../constants';

interface Props {
  onClose: () => void;
  onImport: (items: MenuItem[]) => void;
}

interface ImportHistory {
  timestamp: number;
  url: string;
  itemIds: string[];
}

const MenuImporter: React.FC<Props> = ({ onClose, onImport }) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [editableItems, setEditableItems] = useState<MenuItem[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('luxe_import_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveHistory = (newHistory: ImportHistory[]) => {
    setHistory(newHistory);
    localStorage.setItem('luxe_import_history', JSON.stringify(newHistory));
  };

  const handleScan = async () => {
    if (!url.trim()) return;
    setStatus('loading');
    try {
      const data = await scanMenuUrl(url);
      const items = data.items as MenuItem[];
      setEditableItems(items);
      setSources(data.sources || []);
      setSelectedIds(new Set(items.map(i => i.id!)));
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const toggleItemSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const updateItem = (id: string, updates: Partial<MenuItem>) => {
    setEditableItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleFinalImport = () => {
    const itemsToImport = editableItems.filter(i => selectedIds.has(i.id!));
    onImport(itemsToImport);

    // Save to history
    const newEntry: ImportHistory = {
      timestamp: Date.now(),
      url: url,
      itemIds: itemsToImport.map(i => i.id)
    };
    saveHistory([newEntry, ...history].slice(0, 5)); // Keep last 5 imports
    onClose();
  };

  const deleteFromHistory = (entry: ImportHistory) => {
    const newHistory = history.filter(h => h.timestamp !== entry.timestamp);
    saveHistory(newHistory);
    // In a real app, this might also trigger item removal from the global menu
    alert(`Import session for ${entry.url} removed from history.`);
  };

  // Reorder items in the local list
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const nextItems = [...editableItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextItems.length) return;
    
    [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];
    setEditableItems(nextItems);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-navy/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-navy dark:hover:text-white transition-all z-20">
          <span className="material-icons-round">close</span>
        </button>

        <div className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-navy shadow-lg shadow-primary/20">
              <span className="material-icons-round text-2xl">travel_explore</span>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-extrabold text-navy dark:text-white leading-tight">Sorting AI Importer</h3>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1">
                Verified by Deep Thinking Pro
                <span className="material-icons-round text-[10px]">verified</span>
              </p>
            </div>
          </div>
        </div>

        {status === 'idle' && (
          <div className="p-8 pt-0 flex-1 overflow-y-auto no-scrollbar space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Paste Restaurant Link</label>
              <div className="relative group">
                <input 
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://gourmet-house.com/menu"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 px-5 text-sm focus:ring-4 focus:ring-primary/20 focus:border-primary dark:text-white placeholder:text-slate-400 outline-none transition-all"
                />
                <button 
                  onClick={handleScan}
                  disabled={!url.trim()}
                  className="absolute right-3 top-3 bottom-3 bg-navy text-primary px-5 rounded-xl font-bold text-xs disabled:opacity-30 active:scale-95 transition-transform"
                >
                  Scan
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed px-1">
                Sorting AI will automatically categorize items into your stations using Deep Thinking.
              </p>
            </div>

            {history.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recent Import Logs</h4>
                  <button onClick={() => saveHistory([])} className="text-[10px] text-rose-500 font-bold hover:underline">Clear History</button>
                </div>
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.timestamp} className="group p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-primary/30 transition-all">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-navy dark:text-white truncate">{entry.url}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{entry.itemIds.length} items • {new Date(entry.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <button 
                        onClick={() => deleteFromHistory(entry)}
                        className="ml-3 p-2 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors opacity-60 group-hover:opacity-100"
                        title="Delete log"
                      >
                        <span className="material-icons-round text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-24 h-24 mb-8 relative">
              <div className="absolute inset-0 border-8 border-primary/10 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="material-icons-round text-primary text-4xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">psychology</span>
            </div>
            <h3 className="text-lg font-bold text-navy dark:text-white mb-2">Deep Sorting Logic</h3>
            <p className="text-sm text-slate-500">Categorizing items and feeding insights to The Best Chef AI...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sorting & Verification</p>
                <h4 className="text-sm font-bold text-navy dark:text-white">{selectedIds.size} of {editableItems.length} Verified</h4>
              </div>
              <button 
                onClick={() => setSelectedIds(selectedIds.size === editableItems.length ? new Set() : new Set(editableItems.map(i => i.id!)))}
                className="text-[10px] font-bold text-primary uppercase bg-navy/10 px-3 py-1.5 rounded-lg"
              >
                {selectedIds.size === editableItems.length ? 'Deselect' : 'Select All'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 p-8">
              {/* Grounding Sources for Google Search results */}
              {sources.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <span className="material-icons-round text-xs">history_edu</span>
                    Search Grounding Sources
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((source, i) => (
                      source.web && (
                        <a 
                          key={i} 
                          href={source.web.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span className="material-icons-round text-[10px]">link</span>
                          {source.web.title || 'Source'}
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}

              {editableItems.map((item, idx) => (
                <div 
                  key={item.id}
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    selectedIds.has(item.id!) ? 'border-primary bg-primary/5' : 'border-slate-50 dark:border-slate-800'
                  }`}
                >
                  {/* Reordering Controls */}
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveItem(idx, 'up')} className="p-1 text-slate-400 hover:text-primary"><span className="material-icons-round text-lg">expand_less</span></button>
                    <button onClick={() => moveItem(idx, 'down')} className="p-1 text-slate-400 hover:text-primary"><span className="material-icons-round text-lg">expand_more</span></button>
                  </div>

                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => toggleItemSelection(item.id!)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${
                        selectedIds.has(item.id!) ? 'bg-primary border-primary text-navy' : 'border-slate-200'
                      }`}
                    >
                      {selectedIds.has(item.id!) && <span className="material-icons-round text-sm font-bold">check</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <div className="space-y-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-primary/20">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Item Name</label>
                            <input 
                              value={item.name}
                              onChange={(e) => updateItem(item.id!, { name: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 text-sm font-bold dark:text-white outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Description</label>
                            <textarea 
                              value={item.description}
                              onChange={(e) => updateItem(item.id!, { description: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 text-xs text-slate-500 outline-none focus:ring-1 focus:ring-primary"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Price</label>
                              <input 
                                type="number"
                                value={item.price}
                                onChange={(e) => updateItem(item.id!, { price: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 text-sm font-bold dark:text-white"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Station</label>
                              <select 
                                value={item.category}
                                onChange={(e) => updateItem(item.id!, { category: e.target.value as any })}
                                className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 text-xs font-bold dark:text-white outline-none"
                              >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="w-full bg-navy text-primary text-[10px] font-black uppercase py-2.5 rounded-xl shadow-lg"
                          >
                            Save Verification
                          </button>
                        </div>
                      ) : (
                        <div className="group flex flex-col" onClick={() => setEditingId(item.id!)}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-navy dark:text-white truncate pr-2 group-hover:text-primary transition-colors">{item.name}</h4>
                            <span className="text-xs font-black text-primary flex-shrink-0">${item.price}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mb-2">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              <span className="px-2 py-0.5 rounded-full bg-navy text-primary text-[8px] font-bold uppercase tracking-widest">
                                {item.category}
                              </span>
                              {item.calories && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                  {item.calories} cal
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] font-bold text-blue-500 flex items-center gap-1 group-hover:underline">
                              <span className="material-icons-round text-[10px]">edit</span>
                              Edit Sorting
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 pt-4 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-3">
              <button 
                onClick={handleFinalImport}
                disabled={selectedIds.size === 0}
                className="w-full bg-navy text-primary font-black uppercase text-sm py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30"
              >
                Inject {selectedIds.size} Sorted Items
                <span className="material-icons-round text-sm">bolt</span>
              </button>
              <button onClick={() => setStatus('idle')} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-2">
                New Search Link
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-500">
              <span className="material-icons-round text-4xl">report_problem</span>
            </div>
            <h3 className="text-xl font-bold text-navy dark:text-white">Validation Error</h3>
            <p className="text-sm text-slate-500 mt-2 mb-8">The Sorting AI couldn't parse this menu structure. Please try a different source or verify the link.</p>
            <button 
              onClick={() => setStatus('idle')}
              className="bg-navy text-primary font-bold px-10 py-4 rounded-xl shadow-lg"
            >
              Back to Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuImporter;
