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
          family_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          date_of_birth?: string | null
          gender?: string | null
          user_id: string
          family_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          date_of_birth?: string | null
          gender?: string | null
          user_id?: string
          family_id?: string | null
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
