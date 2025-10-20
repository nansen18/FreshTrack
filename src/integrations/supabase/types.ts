export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      claimed_offers: {
        Row: {
          claimed_at: string | null
          consumer_id: string
          created_at: string | null
          discount: number
          id: string
          offer_id: string
          product_name: string
          retailer_id: string
        }
        Insert: {
          claimed_at?: string | null
          consumer_id: string
          created_at?: string | null
          discount: number
          id?: string
          offer_id: string
          product_name: string
          retailer_id: string
        }
        Update: {
          claimed_at?: string | null
          consumer_id?: string
          created_at?: string | null
          discount?: number
          id?: string
          offer_id?: string
          product_name?: string
          retailer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claimed_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "retailer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      freshness_checks: {
        Row: {
          ai_description: string
          created_at: string
          freshness_level: string
          freshness_score: number
          id: string
          image_url: string
          product_name: string | null
          user_id: string
        }
        Insert: {
          ai_description: string
          created_at?: string
          freshness_level: string
          freshness_score: number
          id?: string
          image_url: string
          product_name?: string | null
          user_id: string
        }
        Update: {
          ai_description?: string
          created_at?: string
          freshness_level?: string
          freshness_score?: number
          id?: string
          image_url?: string
          product_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          ai_feedback: string | null
          barcode: string | null
          calories: number | null
          carbohydrates: number | null
          consumed: boolean | null
          created_at: string | null
          expiry_date: string
          fat: number | null
          fiber: number | null
          health_score: string | null
          id: string
          name: string
          nutrition_data: Json | null
          nutrition_score: string | null
          protein: number | null
          purchase_date: string | null
          sodium: number | null
          sugar: number | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          barcode?: string | null
          calories?: number | null
          carbohydrates?: number | null
          consumed?: boolean | null
          created_at?: string | null
          expiry_date: string
          fat?: number | null
          fiber?: number | null
          health_score?: string | null
          id?: string
          name: string
          nutrition_data?: Json | null
          nutrition_score?: string | null
          protein?: number | null
          purchase_date?: string | null
          sodium?: number | null
          sugar?: number | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          barcode?: string | null
          calories?: number | null
          carbohydrates?: number | null
          consumed?: boolean | null
          created_at?: string | null
          expiry_date?: string
          fat?: number | null
          fiber?: number | null
          health_score?: string | null
          id?: string
          name?: string
          nutrition_data?: Json | null
          nutrition_score?: string | null
          protein?: number | null
          purchase_date?: string | null
          sodium?: number | null
          sugar?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      retailer_products: {
        Row: {
          created_at: string | null
          discount: number | null
          discounted: boolean | null
          expiry_date: string
          id: string
          name: string
          retailer_id: string
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          discounted?: boolean | null
          expiry_date: string
          id?: string
          name: string
          retailer_id: string
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          discounted?: boolean | null
          expiry_date?: string
          id?: string
          name?: string
          retailer_id?: string
        }
        Relationships: []
      }
      reverse_commerce_items: {
        Row: {
          ai_reasoning: string | null
          category: string
          co2_saved: number | null
          created_at: string | null
          expiry_date: string
          id: string
          product_id: string
          product_name: string
          retailer_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          ai_reasoning?: string | null
          category: string
          co2_saved?: number | null
          created_at?: string | null
          expiry_date: string
          id?: string
          product_id: string
          product_name: string
          retailer_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          ai_reasoning?: string | null
          category?: string
          co2_saved?: number | null
          created_at?: string | null
          expiry_date?: string
          id?: string
          product_id?: string
          product_name?: string
          retailer_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "consumer" | "retailer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["consumer", "retailer"],
    },
  },
} as const
