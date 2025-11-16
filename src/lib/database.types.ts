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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          flat_number: string
          phone: string | null
          role: 'resident' | 'admin' | 'security'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          flat_number: string
          phone?: string | null
          role?: 'resident' | 'admin' | 'security'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          flat_number?: string
          phone?: string | null
          role?: 'resident' | 'admin' | 'security'
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          title: string
          content: string
          post_type: 'announcement' | 'discussion' | 'poll' | 'alert'
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          content: string
          post_type?: 'announcement' | 'discussion' | 'poll' | 'alert'
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          content?: string
          post_type?: 'announcement' | 'discussion' | 'poll' | 'alert'
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
      }
      visitors: {
        Row: {
          id: string
          visitor_name: string
          visitor_phone: string
          flat_number: string
          resident_id: string | null
          purpose: string | null
          status: 'pending' | 'approved' | 'rejected' | 'checked_out'
          check_in_time: string
          check_out_time: string | null
          added_by: string
          created_at: string
        }
        Insert: {
          id?: string
          visitor_name: string
          visitor_phone: string
          flat_number: string
          resident_id?: string | null
          purpose?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'checked_out'
          check_in_time?: string
          check_out_time?: string | null
          added_by: string
          created_at?: string
        }
        Update: {
          id?: string
          visitor_name?: string
          visitor_phone?: string
          flat_number?: string
          resident_id?: string | null
          purpose?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'checked_out'
          check_in_time?: string
          check_out_time?: string | null
          added_by?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          resident_id: string
          amount: number
          description: string
          due_date: string
          status: 'pending' | 'paid' | 'verified'
          transaction_id: string | null
          paid_at: string | null
          verified_by: string | null
          verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          amount: number
          description: string
          due_date: string
          status?: 'pending' | 'paid' | 'verified'
          transaction_id?: string | null
          paid_at?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          amount?: number
          description?: string
          due_date?: string
          status?: 'pending' | 'paid' | 'verified'
          transaction_id?: string | null
          paid_at?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
        }
      }
      issues: {
        Row: {
          id: string
          reported_by: string
          category: 'maintenance' | 'security' | 'housekeeping'
          title: string
          description: string
          status: 'open' | 'in_progress' | 'resolved'
          priority: 'low' | 'medium' | 'high'
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reported_by: string
          category: 'maintenance' | 'security' | 'housekeeping'
          title: string
          description: string
          status?: 'open' | 'in_progress' | 'resolved'
          priority?: 'low' | 'medium' | 'high'
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reported_by?: string
          category?: 'maintenance' | 'security' | 'housekeeping'
          title?: string
          description?: string
          status?: 'open' | 'in_progress' | 'resolved'
          priority?: 'low' | 'medium' | 'high'
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      issue_comments: {
        Row: {
          id: string
          issue_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          issue_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          issue_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}
