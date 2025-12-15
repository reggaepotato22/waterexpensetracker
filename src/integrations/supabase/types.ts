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
      fuel_data: {
        Row: {
          amount_earned: number | null
          created_at: string
          diesel_amount: number | null
          diesel_cost: number | null
          fuel_balance: number | null
          fuel_cf: number | null
          id: string
          monthly_log_id: string
          petrol_amount: number | null
          petrol_cost: number | null
          total_cost: number | null
          total_expense: number | null
          total_liters_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_earned?: number | null
          created_at?: string
          diesel_amount?: number | null
          diesel_cost?: number | null
          fuel_balance?: number | null
          fuel_cf?: number | null
          id?: string
          monthly_log_id: string
          petrol_amount?: number | null
          petrol_cost?: number | null
          total_cost?: number | null
          total_expense?: number | null
          total_liters_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_earned?: number | null
          created_at?: string
          diesel_amount?: number | null
          diesel_cost?: number | null
          fuel_balance?: number | null
          fuel_cf?: number | null
          id?: string
          monthly_log_id?: string
          petrol_amount?: number | null
          petrol_cost?: number | null
          total_cost?: number | null
          total_expense?: number | null
          total_liters_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_data_monthly_log_id_fkey"
            columns: ["monthly_log_id"]
            isOneToOne: true
            referencedRelation: "monthly_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_entries: {
        Row: {
          amount_paid: number | null
          created_at: string
          customer: string | null
          date: string | null
          distance: number | null
          end_location: string
          id: string
          is_parking: boolean | null
          is_water_fill: boolean | null
          job_number: number
          mileage_end: number | null
          mileage_start: number | null
          monthly_log_id: string
          order_number: string | null
          start_location: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          customer?: string | null
          date?: string | null
          distance?: number | null
          end_location: string
          id?: string
          is_parking?: boolean | null
          is_water_fill?: boolean | null
          job_number: number
          mileage_end?: number | null
          mileage_start?: number | null
          monthly_log_id: string
          order_number?: string | null
          start_location: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          customer?: string | null
          date?: string | null
          distance?: number | null
          end_location?: string
          id?: string
          is_parking?: boolean | null
          is_water_fill?: boolean | null
          job_number?: number
          mileage_end?: number | null
          mileage_start?: number | null
          monthly_log_id?: string
          order_number?: string | null
          start_location?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_entries_monthly_log_id_fkey"
            columns: ["monthly_log_id"]
            isOneToOne: false
            referencedRelation: "monthly_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      misdemeanors: {
        Row: {
          created_at: string
          date: string
          description: string | null
          fine: number | null
          id: string
          monthly_log_id: string
          resolved: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          fine?: number | null
          id?: string
          monthly_log_id: string
          resolved?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          fine?: number | null
          id?: string
          monthly_log_id?: string
          resolved?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "misdemeanors_monthly_log_id_fkey"
            columns: ["monthly_log_id"]
            isOneToOne: false
            referencedRelation: "monthly_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_logs: {
        Row: {
          created_at: string
          end_mileage: number | null
          id: string
          month: string
          start_mileage: number | null
          total_distance: number | null
          total_jobs: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_mileage?: number | null
          id?: string
          month: string
          start_mileage?: number | null
          total_distance?: number | null
          total_jobs?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_mileage?: number | null
          id?: string
          month?: string
          start_mileage?: number | null
          total_distance?: number | null
          total_jobs?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_fill_sites: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
