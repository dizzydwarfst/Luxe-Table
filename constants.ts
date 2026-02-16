
import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'a1',
    name: 'Truffle Arancini',
    description: 'Crispy risotto balls with black truffle and mozzarella.',
    price: 14.00,
    category: 'Apps',
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=400&q=80',
    calories: 420,
    allergens: ['Dairy', 'Gluten']
  },
  {
    id: 'a2',
    name: 'Calamari Fritti',
    description: 'Lightly battered squid with spicy arrabbiata dip.',
    price: 16.00,
    category: 'Apps',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80',
    calories: 380,
    allergens: ['Shellfish', 'Gluten']
  },
  {
    id: 's1',
    name: 'Burrata & Heirloom',
    description: 'Creamy burrata, balsamic glaze, and vine-ripened tomatoes.',
    price: 18.50,
    category: 'Salads',
    image: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&w=400&q=80',
    calories: 310,
    allergens: ['Dairy']
  },
  {
    id: '1',
    name: 'Prime Ribeye Steak',
    description: 'Garlic butter, rosemary potatoes, and seasonal greens.',
    price: 32.00,
    category: 'Entree',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmRbmm-Co92uv6OLeQy73_1W13fn2Av44p1fYcowXyOtsNYkG9L6DkvZFJ73Tq1Lyw-qQQfdZcngWE59X-rnl0aNG3WvIKmX1s_e3bm_jkpdcNE_z1VtKc7NHcLvk1-mLMcMhxwdsD93oGDcqX7LsiEwwo5bOlsxq8vj6EJ7LqtJyYKH4mlK9itmSHudgvC6d10GBiSwOKtXU9_duOlFo9wCyEccKHpswHUgNQSbqCJnV_mU-CBc4Xbz11eq6yiyJtkaVCUqYgtdcv',
    calories: 850,
    allergens: ['Dairy']
  },
  {
    id: '4',
    name: 'Spicy Pad Thai',
    description: 'Extra spicy, No peanuts, Extra lime wedge.',
    price: 16.50,
    category: 'Panfry',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvuwAkujSqeMRNZA4GZYKI1SPE6PVE-R2xP0cc_1NgipUcgdQBIxa3hk8nXtXHitkeUXBeW2gl92DXmk6ci35_jBay7pAYh3LT5yr_c4P7tLBIUMzJf2jWWHfXAeFMP-03g0UcaFmObxOOplO_BwsTBXG8JLnSC454LXNd36QTBnEug_c14XxlekWASKKIYFxR-vQKINZjAU8ph41CU5hLEvQBv7S0TrzS33QWG4KGhOEGQLK-7NoC1IgkEDzQT_xDoaQH63kTPEru',
    calories: 740,
    allergens: ['Shellfish', 'Egg']
  },
  {
    id: '5',
    name: 'Smoked Old Fashioned',
    description: 'Premium bourbon, orange zest, cherrywood smoke.',
    price: 15.00,
    category: 'Bar',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzvVYX0T842deG9bE0BzjzairZAuFhUfncfh2y1ERl1XVKoB2QO011TONe7xz2C1VJxlNhA2Ariti6iw977pWB9HB2FKa88MekJEBvdkXFfMyCiYwARaGcnlonVmyFcDeFO2PWQ6vIAdCC2h1Ni026cntOHpVR4v2oI9MxOeXXeNAdaxJ2RqXY3ZsaZqcaN0bQpAMGK6hSfm7tPO3Ok-_foYLRzxo70WgzoOeiccJa2GLHdLmRLHKj-Z-fLbrmmvCvJM351A36u-uz',
    calories: 180,
    allergens: []
  },
  {
    id: '3',
    name: 'Wagyu Supreme',
    description: 'Medium rare, Swiss cheese, Truffle aioli, Brioche bun.',
    price: 18.00,
    category: 'Ovens',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwNTxTyGKFyGb8SIPZdfnLBl_nMS9Mddgzl3ry8ID97PEU06E1991zy2VeEWTMvwEc7LVSJd4AjmC6Ghm1gbF9Z6hsnfLsVOEda2RwDaPXsxVXpO_LIC2QiV2VykrKnn4dyBMCtIrwvI4nBI9l39R4TYKPPWe4X7ykRqBMnhRA5TkwTuXEKyb960AASxQrxoKFjSSkVwYeGaxsai8mgp0zgHbrah8H5TAoxuJThRr-DvTF67ZZbd_dqgjPRCahjKM23n9hGGfj8FtN',
    calories: 920,
    allergens: ['Gluten', 'Dairy', 'Egg']
  }
];

export const CATEGORIES = ['Apps', 'Salads', 'Panfry', 'Entree', 'Ovens', 'Bar'] as const;
