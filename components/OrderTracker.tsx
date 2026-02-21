import React, { useEffect, useRef } from 'react';
import { useOrderSync, STAGE_CONFIG, OrderStage } from '../lib/useOrderSync';

const ALL_STAGES: OrderStage[] = ['pending', 'confirmed', 'preparing', 'cooking', 'plating', 'ready'];

interface Props {
  orderId: string;
  onClose: () => void;
}

const OrderTracker: React.FC<Props> = ({ orderId, onClose }) => {
  const sync = useOrderSync(orderId);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!hasSubmitted.current && orderId) {
      hasSubmitted.current = true;
      sync.submitOrder();
    }
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentIdx = ALL_STAGES.indexOf(sync.currentStage);

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl flex flex-col animate-slide-up overflow-hidden max-h-[90vh]">

        {/* Header */}
        <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: sync.stageConfig.color }}>
                  <span className="material-icons-round text-white text-2xl">{sync.stageConfig.icon}</span>
                </div>
                {sync.connected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full">
                    <div className="w-full h-full bg-green-500 rounded-full animate-ping opacity-50" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-white">Order Tracker</h3>
                <p className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: sync.stageConfig.color }}>
                  {sync.stageConfig.label}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors"
            >
              <span className="material-icons-round text-xl">close</span>
            </button>
          </div>

          {/* ETA bar */}
          {sync.estimatedReady !== null && sync.currentStage !== 'ready' && (
            <div className="mt-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estimated Ready</span>
                <span className="text-sm font-black text-navy dark:text-white">
                  ~{sync.estimatedReady} min
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${((currentIdx + 1) / ALL_STAGES.length) * 100}%`,
                    background: `linear-gradient(90deg, ${sync.stageConfig.color}, ${sync.stageConfig.color}88)`,
                  }}
                />
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6">

          {/* Stage Progress */}
          <div className="mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Progress</p>
            <div className="flex items-center justify-between relative">
              {/* Connection line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
              <div
                className="absolute top-4 left-4 h-0.5 transition-all duration-1000 ease-out rounded-full"
                style={{
                  width: `${Math.max(0, (currentIdx / (ALL_STAGES.length - 1)) * (100 - 8))}%`,
                  background: sync.stageConfig.color,
                }}
              />

              {ALL_STAGES.map((stage, i) => {
                const config  = STAGE_CONFIG[stage];
                const isDone  = i < currentIdx;
                const isCurrent = i === currentIdx;
                const isFuture  = i > currentIdx;

                return (
                  <div key={stage} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isDone
                          ? 'border-transparent scale-90'
                          : isCurrent
                            ? 'border-transparent scale-110 shadow-lg'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                      style={
                        isDone || isCurrent
                          ? { background: config.color, borderColor: config.color }
                          : {}
                      }
                    >
                      <span
                        className={`material-icons-round text-sm ${
                          isDone || isCurrent ? 'text-white' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {isDone ? 'check' : config.icon}
                      </span>
                    </div>
                    <span
                      className={`text-[8px] font-bold mt-2 text-center leading-tight transition-colors ${
                        isFuture ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chef info */}
          {sync.chefName && (
            <div className="mb-6 bg-navy rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="material-icons-round text-primary text-xl">face</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{sync.chefName}</p>
                <p className="text-white/40 text-[10px] font-medium">is preparing your order</p>
              </div>
            </div>
          )}

          {/* Live Event Timeline */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Live Updates</p>
            <div className="space-y-1">
              {[...sync.events].reverse().map((event, i) => {
                const config = STAGE_CONFIG[event.stage];
                const time   = new Date(event.timestamp);
                const isLatest = i === 0;

                return (
                  <div
                    key={`${event.stage}-${event.timestamp}`}
                    className={`flex items-start gap-3 py-3 px-4 rounded-xl transition-all ${
                      isLatest
                        ? 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700'
                        : 'opacity-60'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${config.color}20` }}
                    >
                      <span
                        className="material-icons-round text-sm"
                        style={{ color: config.color }}
                      >
                        {config.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy dark:text-white">{event.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        {event.estimatedMinutes !== undefined && event.estimatedMinutes > 0 && (
                          <span className="ml-2 text-primary font-bold">~{event.estimatedMinutes} min left</span>
                        )}
                      </p>
                    </div>
                    {isLatest && (
                      <div className="w-2 h-2 rounded-full mt-2 animate-pulse" style={{ background: config.color }} />
                    )}
                  </div>
                );
              })}

              {sync.events.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 animate-pulse">
                    <span className="material-icons-round text-slate-400 text-2xl">wifi</span>
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Connecting to kitchen...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pb-10 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          {sync.currentStage === 'ready' ? (
            <button
              onClick={onClose}
              className="w-full bg-green-500 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-green-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
            >
              <span className="material-icons-round">celebration</span>
              Order Ready — Enjoy!
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-navy dark:text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform"
              >
                Close
              </button>
              <button
                className="flex-1 bg-navy text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <span className="material-icons-round text-primary text-lg">support_agent</span>
                Call Server
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0, 0, 0.2, 1); }
      `}</style>
    </div>
  );
};

export default OrderTracker;
