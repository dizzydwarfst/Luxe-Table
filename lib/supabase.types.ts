/**
 * TypeScript types for the Supabase database schema.
 *
 * In production you'd generate these with `supabase gen types typescript`.
 * This hand-written version matches our schema.sql exactly.
 */

export interface Database {
  public: {
    Tables: {
      stations: {
        Row: {
          id: string;
          name: string;
          icon: string;
          description: string | null;
          table_prefix: string | null;
          image_url: string | null;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['stations']['Row'], 'sort_order'> & {
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['stations']['Insert']>;
      };

      menu_items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          category: string;
          image: string | null;
          model_url: string | null;
          calories: number | null;
          allergens: string[];
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['menu_items']['Row'], 'sort_order' | 'is_active' | 'created_at' | 'allergens'> & {
          sort_order?: number;
          is_active?: boolean;
          allergens?: string[];
        };
        Update: Partial<Database['public']['Tables']['menu_items']['Insert']>;
      };

      toppings: {
        Row: {
          id: string;
          name: string;
          price: number;
          model_url: string | null;
          binary_bit: number;
          emoji: string | null;
          color: string | null;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['toppings']['Row'], 'sort_order' | 'price'> & {
          sort_order?: number;
          price?: number;
        };
        Update: Partial<Database['public']['Tables']['toppings']['Insert']>;
      };

      menu_item_toppings: {
        Row: {
          menu_item_id: string;
          topping_id: string;
        };
        Insert: Database['public']['Tables']['menu_item_toppings']['Row'];
        Update: Partial<Database['public']['Tables']['menu_item_toppings']['Insert']>;
      };

      tables: {
        Row: {
          id: string;
          display_name: string;
          station_id: string | null;
          is_occupied: boolean;
          current_session_id: string | null;
          capacity: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tables']['Row'], 'is_occupied' | 'created_at' | 'capacity'> & {
          is_occupied?: boolean;
          capacity?: number;
        };
        Update: Partial<Database['public']['Tables']['tables']['Insert']>;
      };

      orders: {
        Row: {
          id: string;
          display_id: string;
          table_id: string | null;
          station_id: string | null;
          status: string;
          subtotal: number | null;
          tax: number | null;
          total: number | null;
          guest_count: number;
          user_id: string | null;
          chef_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'status' | 'guest_count' | 'created_at' | 'updated_at'> & {
          id?: string;
          status?: string;
          guest_count?: number;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };

      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          unit_price: number;
          topping_ids: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'quantity' | 'created_at' | 'topping_ids'> & {
          id?: string;
          quantity?: number;
          topping_ids?: string[];
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };

      order_events: {
        Row: {
          id: string;
          order_id: string;
          stage: string;
          message: string;
          chef_name: string | null;
          estimated_minutes: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_events']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['order_events']['Insert']>;
      };

      user_preferences: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          hunger: string | null;
          spice: string | null;
          mood: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_preferences']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>;
      };

      kitchen_staff: {
        Row: {
          id: string;
          name: string;
          role: string;
          station_id: string | null;
          is_active: boolean;
          user_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kitchen_staff']['Row'], 'id' | 'is_active' | 'created_at'> & {
          id?: string;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['kitchen_staff']['Insert']>;
      };
    };
  };
}
