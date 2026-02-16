
import React from 'react';
import { DiningStation } from '../types';

// Updated stations to match requested order: Apps, Salads, Panfry, Entree, Ovens, Bar
const STATIONS: (DiningStation & { imageUrl: string })[] = [
  { 
    id: 'Apps', 
    name: 'Apps', 
    icon: 'bruschetta', 
    description: 'Station 01', 
    tablePrefix: 'A',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARv__glbzMLgivV1JfnT0hOIzyF1QlNFnMy_WFG2lVVYBvA1F1wTTTX4zdQ3CAHJAL-LhQBcZBer6KaIj61LQ69Q-mAymBlKJezpYGo_kIp7PjksjRWK8mgHm7JQBH4EaYjfBi0KhPL1Mf5zNRL6HTzQD8sHj50osQ9jOzrdyP9-QRi-ZG5TKmxx-BwDSvfvdUjKj84ZgaN7rutuJKWwg-d5Xg7KCGH5hvr9Ci18gke4sidDC2rwcosh-qpujuwVR2tebYGHAQlvua' 
  },
  { 
    id: 'Salads', 
    name: 'Salads', 
    icon: 'eco', 
    description: 'Station 02', 
    tablePrefix: 'S',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6Rk0l9v2j58gtpMuq0dfpZGnZ7fQUQcUmmRSDSOnDENLPnEC7ItwVls1SN8xtRdw2MM3mcwBLo2ijgu6exis5VLG4Ak0_L5aSZe-gph7q3ov8DEtY3qhXnjiHmDcrbGDhn3h05DdqLUYno2ZlM5PwpQdOadBK7YgpzU7BlSVmx4Ig-qNd8srVDSPYuZpBjP21CdHnkbg73YMFfqUzf8dxsXJRWJEhKzJAGGpRDqPYH65-e_h8FqUwT4-jLxQOmbxbDizioTx3N_RG' 
  },
  { 
    id: 'Panfry', 
    name: 'Panfry', 
    icon: 'skillet', 
    description: 'Station 03', 
    tablePrefix: 'P',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARj0lEKY6yKXi2WLMEsVyBnRaORpW08krVevMVDoN5YVdP1ob7ftp6-xRoFs3CbmbD9feIW01vMUp15gqpOfuiE563f1ZxjTmBkdfeImQRviuQislMteMYnanBpqPvuTlW6Ve5MvLlQPXyqPtZ60Rz9Jj-0C4RlXC_Pm3G5k2V_C6I9DOAITlRE2kDGLQIlp_U2jGDrt2XLtmlhF6ZIqvBzgwv3N2_9K9qZBAXrDCmsuFd9tzLiCMt8aS7fG-L-6PU9TMMq-GT9xaS' 
  },
  { 
    id: 'Entree', 
    name: 'Entree', 
    icon: 'restaurant', 
    description: 'Station 04', 
    tablePrefix: 'E',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoocHlfOWH8ZiivbnSyLQm9VNvqbHTLQoQXTnE55OpnTxC2gsAD4_sffwYOzzysMf_W1cMwNK_CsukQ3YTT1C5VJH-TJsjwjGUTwnvyg6xOAiebxdQzH7IttcGiy2hjbZRWP76slFAz_z2wCrV-wSyY1_cre1l5v9e8oK7jfL8wJHJrhDjBdvB9hi2Rj07WkYzvyM2pthqFf87KwFIWNaojalVy5FMvT5e6LNuO4C1f8PCpvGSpZsvQqZ0wbP0WMVlMM9dCPzwFIYZ' 
  },
  { 
    id: 'Ovens', 
    name: 'Ovens', 
    icon: 'outdoor_grill', 
    description: 'Station 05', 
    tablePrefix: 'O',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-jao5d9KL9rijJb03Pq9-NvvynVgUSxmcDE2ud-1nkivnc0hxsDdNJ3LHpb0ObT57MG02keBOgykhWeFMBHIN_wUcjr0OgoihXLRicdvBxLND1VxIGQRf-VPlQPKdIq9TMUCmiOf_5yFAAl7gBxoCnPp2NRFO9gAMIiL1yHV-Gh3xXP6-dSIn1xd5Gy8tbzsy7yZnoCre4jFToo8p_6sd3lTFu_dMIGB3XXiWhzZUu4s0yYaac569SzZfJglvFeTJH95CswaCzpoZ' 
  },
  { 
    id: 'Bar', 
    name: 'Bar', 
    icon: 'liquor', 
    description: 'Station 06', 
    tablePrefix: 'B',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzvVYX0T842deG9bE0BzjzairZAuFhUfncfh2y1ERl1XVKoB2QO011TONe7xz2C1VJxlNhA2Ariti6iw977pWB9HB2FKa88MekJEBvdkXFfMyCiYwARaGcnlonVmyFcDeFO2PWQ6vIAdCC2h1Ni026cntOHpVR4v2oI9MxOeXXeNAdaxJ2RqXY3ZsaZqcaN0bQpAMGK6hSfm7tPO3Ok-_foYLRzxo70WgzoOeiccJa2GLHdLmRLHKj-Z-fLbrmmvCvJM351A36u-uz' 
  }
];

interface Props {
  onSelect: (station: DiningStation) => void;
}

const StationSelectionScreen: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="flex flex-col h-full bg-background-dark text-white font-display antialiased selection:bg-primary selection:text-white relative overflow-hidden">
      
      {/* Header */}
      <header className="flex justify-between items-center px-6 pt-12 pb-4 z-50 bg-gradient-to-b from-background-dark to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-navy-surface border border-white/10 overflow-hidden relative">
            <img 
              alt="Alex" 
              className="object-cover w-full h-full" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDj4FVWnw79rVeBiTJEUPmWPdpadFdU2RnTTdDu_B-qRke6Kmn77yrWPz9W-rWPINtWHcIMtHVF7qZPVphjbCBOb5VWLuMxL-UDvWax0KML4dFBeMlPNTRXeTDOW9Jsj4klkmbLjU7YzZ-CYU4Z2Hos3a3-zAzXQt4gJNxe0xiWZMQYaK1xkREZN1lN567C7CSLaAS6pU38VdaJ5nD2j98NBnTBWC9G_UpTmU47wlUAK5FLrFwpqrWtEoLrgZkCP4z5X_S2dFRmleFi"
            />
          </div>
          <div>
            <p className="text-xs text-white/60 font-medium tracking-wide uppercase">Table 12</p>
            <h2 className="text-lg font-bold leading-tight">Alex</h2>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10">
            <span className="material-icons-round">search</span>
          </button>
          <button className="h-10 px-4 rounded-full glass flex items-center justify-center text-white relative hover:bg-white/10 transition-colors gap-2 border border-white/10">
            <span className="material-icons-round text-sm">receipt_long</span>
            <span className="text-xs font-bold">My Table</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-40">
        
        {/* AR Hero Section */}
        <section className="mb-8 mt-2 relative overflow-hidden rounded-2xl glass p-6 border-l-4 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)]">
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase border border-primary/30">In-Store Exclusive</span>
              </div>
              <h1 className="text-2xl font-bold mb-1">Explore in AR</h1>
              <p className="text-sm text-white/70 max-w-[200px]">Preview dishes on your table before you order.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#D4AF37]">
              <span className="material-icons-round text-3xl">view_in_ar</span>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        </section>

        {/* Station Selection Grid */}
        <div className="flex justify-between items-end mb-5">
          <h2 className="text-xl font-bold">The Kitchen</h2>
          <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold flex items-center gap-1">
            6 Stations <span className="material-icons-round text-[14px]">restaurant</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {STATIONS.map((station, idx) => (
            <button
              key={station.id}
              onClick={() => onSelect(station)}
              className="group relative h-48 rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <img 
                alt={station.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70" 
                src={station.imageUrl} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-4 w-full">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider mb-1">{station.description}</p>
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{station.name}</h3>
                  </div>
                  <span className="material-icons-round text-white/60 text-sm group-hover:text-white group-hover:translate-x-1 transition-all">arrow_forward</span>
                </div>
              </div>
              {/* Optional 3D badge for some categories */}
              {(station.id === 'Panfry' || station.id === 'Entree') && (
                <div className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                  <span className="material-icons-round text-[10px] text-[#D4AF37]">view_in_ar</span> 3D
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="h-8"></div>
      </main>

      {/* Floating Bottom Button */}
      <div className="fixed bottom-6 left-6 right-6 z-40">
        <button 
          onClick={() => onSelect(STATIONS[3])} // Default to Entree station if "View All" is clicked
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-between group transition-all transform active:scale-95 backdrop-blur-sm bg-primary/95"
        >
          <span className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-icons-round text-sm">restaurant_menu</span>
            </span>
            View Full Menu
          </span>
          <span className="material-icons-round group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { 
          animation: slide-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; 
        }
        .glass {
          background: rgba(26, 34, 51, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default StationSelectionScreen;
