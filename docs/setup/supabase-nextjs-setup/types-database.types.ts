// types/database.types.ts

/**
 * Database Types từ Supabase
 * 
 * 🔄 Generate types từ database schema:
 * npx supabase gen types typescript --project-id your-project-id --schema public > types/database.types.ts
 * 
 * Hoặc dùng Supabase CLI:
 * supabase gen types typescript --local > types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      persons: {
        Row: {
          id: string
          created_at: string
          name: string
          date_of_birth: string | null
          gender: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          date_of_birth?: string | null
          gender?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          date_of_birth?: string | null
          gender?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "persons_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
