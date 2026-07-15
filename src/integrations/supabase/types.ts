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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          starts_at: string
          target_audience: string
          title: string
          updated_at: string
          variant: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string
          target_audience?: string
          title: string
          updated_at?: string
          variant?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string
          target_audience?: string
          title?: string
          updated_at?: string
          variant?: string
        }
        Relationships: []
      }
      app_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          level: string
          message: string
          source: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message: string
          source?: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          source?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      category_groups: {
        Row: {
          created_at: string
          id: number
          key: string
          label: string
          sort_order: number
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: number
          key: string
          label: string
          sort_order?: number
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: number
          key?: string
          label?: string
          sort_order?: number
          visible?: boolean
        }
        Relationships: []
      }
      category_overrides: {
        Row: {
          group_key: string | null
          key: string
          label: string | null
          short_label: string | null
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          group_key?: string | null
          key: string
          label?: string | null
          short_label?: string | null
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          group_key?: string | null
          key?: string
          label?: string | null
          short_label?: string | null
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "category_overrides_group_key_fkey"
            columns: ["group_key"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["key"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          listing_id: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          available_days: string[] | null
          available_hours: Json | null
          benefits: string[] | null
          category: Database["public"]["Enums"]["listing_category"]
          city: string
          created_at: string
          description: string
          district: string | null
          education_level: string | null
          experience_years: number | null
          id: string
          images: string[]
          is_featured: boolean
          is_remote: boolean
          is_urgent: boolean
          meta_description: string | null
          meta_title: string | null
          off_days: string[] | null
          price: number | null
          price_type: Database["public"]["Enums"]["price_type"]
          requirements: string[] | null
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          type: Database["public"]["Enums"]["listing_type"]
          updated_at: string
          user_id: string
          view_count: number
          work_type: string | null
        }
        Insert: {
          available_days?: string[] | null
          available_hours?: Json | null
          benefits?: string[] | null
          category: Database["public"]["Enums"]["listing_category"]
          city: string
          created_at?: string
          description: string
          district?: string | null
          education_level?: string | null
          experience_years?: number | null
          id?: string
          images?: string[]
          is_featured?: boolean
          is_remote?: boolean
          is_urgent?: boolean
          meta_description?: string | null
          meta_title?: string | null
          off_days?: string[] | null
          price?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          requirements?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          type: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          user_id: string
          view_count?: number
          work_type?: string | null
        }
        Update: {
          available_days?: string[] | null
          available_hours?: Json | null
          benefits?: string[] | null
          category?: Database["public"]["Enums"]["listing_category"]
          city?: string
          created_at?: string
          description?: string
          district?: string | null
          education_level?: string | null
          experience_years?: number | null
          id?: string
          images?: string[]
          is_featured?: boolean
          is_remote?: boolean
          is_urgent?: boolean
          meta_description?: string | null
          meta_title?: string | null
          off_days?: string[] | null
          price?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          requirements?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          type?: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          user_id?: string
          view_count?: number
          work_type?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_actions: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          new_status: string | null
          note: string | null
          prev_status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          new_status?: string | null
          note?: string | null
          prev_status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          new_status?: string | null
          note?: string | null
          prev_status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_reason: string | null
          bio: string | null
          birth_year: number | null
          city: string | null
          created_at: string
          district: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_banned: boolean
          is_verified: boolean
          languages: string[] | null
          phone: string | null
          phone_verified: boolean
          skills: string[] | null
          trust_level: number
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_banned?: boolean
          is_verified?: boolean
          languages?: string[] | null
          phone?: string | null
          phone_verified?: boolean
          skills?: string[] | null
          trust_level?: number
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          languages?: string[] | null
          phone?: string | null
          phone_verified?: boolean
          skills?: string[] | null
          trust_level?: number
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      review_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          review_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          review_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          review_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_note: string | null
          comment: string
          created_at: string
          id: string
          listing_id: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          comment: string
          created_at?: string
          id?: string
          listing_id?: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          comment?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          adsense_enabled: boolean
          adsense_publisher_id: string | null
          adsense_slot_footer: string | null
          adsense_slot_header: string | null
          adsense_slot_in_article: string | null
          adsense_slot_sidebar: string | null
          adsense_test_mode: boolean
          announcement_active: boolean
          announcement_banner: string | null
          badge_email_otp_enabled: boolean
          contact_email: string
          contact_phone: string | null
          ga_measurement_id: string | null
          id: number
          og_image_url: string | null
          password_reset_otp_enabled: boolean
          robots_txt: string
          search_console_verification: string | null
          signup_email_otp_enabled: boolean
          site_description: string
          site_keywords: string
          site_name: string
          trust_badge_visibility: string
          updated_at: string
        }
        Insert: {
          adsense_enabled?: boolean
          adsense_publisher_id?: string | null
          adsense_slot_footer?: string | null
          adsense_slot_header?: string | null
          adsense_slot_in_article?: string | null
          adsense_slot_sidebar?: string | null
          adsense_test_mode?: boolean
          announcement_active?: boolean
          announcement_banner?: string | null
          badge_email_otp_enabled?: boolean
          contact_email?: string
          contact_phone?: string | null
          ga_measurement_id?: string | null
          id?: number
          og_image_url?: string | null
          password_reset_otp_enabled?: boolean
          robots_txt?: string
          search_console_verification?: string | null
          signup_email_otp_enabled?: boolean
          site_description?: string
          site_keywords?: string
          site_name?: string
          trust_badge_visibility?: string
          updated_at?: string
        }
        Update: {
          adsense_enabled?: boolean
          adsense_publisher_id?: string | null
          adsense_slot_footer?: string | null
          adsense_slot_header?: string | null
          adsense_slot_in_article?: string | null
          adsense_slot_sidebar?: string | null
          adsense_test_mode?: boolean
          announcement_active?: boolean
          announcement_banner?: string | null
          badge_email_otp_enabled?: boolean
          contact_email?: string
          contact_phone?: string | null
          ga_measurement_id?: string | null
          id?: number
          og_image_url?: string | null
          password_reset_otp_enabled?: boolean
          robots_txt?: string
          search_console_verification?: string | null
          signup_email_otp_enabled?: boolean
          site_description?: string
          site_keywords?: string
          site_name?: string
          trust_badge_visibility?: string
          updated_at?: string
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          enabled: boolean
          from_email: string
          from_name: string
          host: string
          id: number
          password: string
          port: number
          secure: boolean
          updated_at: string
          username: string
        }
        Insert: {
          enabled?: boolean
          from_email?: string
          from_name?: string
          host?: string
          id?: number
          password?: string
          port?: number
          secure?: boolean
          updated_at?: string
          username?: string
        }
        Update: {
          enabled?: boolean
          from_email?: string
          from_name?: string
          host?: string
          id?: number
          password?: string
          port?: number
          secure?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_admin: boolean
          sender_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          last_message_at: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          purpose: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          purpose: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_broadcast_dm: { Args: { _body: string }; Returns: number }
      admin_get_user_id_by_email: { Args: { _email: string }; Returns: string }
      admin_list_review_reports: { Args: never; Returns: Json }
      admin_list_reviews: { Args: { _status?: string }; Returns: Json }
      admin_list_users: { Args: never; Returns: Json }
      admin_moderation_inbox: { Args: never; Returns: Json }
      admin_recent_mod_actions: { Args: { _limit?: number }; Returns: Json }
      admin_set_banned: {
        Args: { _banned: boolean; _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_set_report_status: {
        Args: { _report_id: string; _status: string }
        Returns: undefined
      }
      admin_set_review_status: {
        Args: { _note?: string; _review_id: string; _status: string }
        Returns: undefined
      }
      admin_set_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_set_trust_level: {
        Args: { _level: number; _user_id: string }
        Returns: undefined
      }
      admin_set_verified: {
        Args: { _user_id: string; _verified: boolean }
        Returns: undefined
      }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          banned_reason: string | null
          bio: string | null
          birth_year: number | null
          city: string | null
          created_at: string
          district: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_banned: boolean
          is_verified: boolean
          languages: string[] | null
          phone: string | null
          phone_verified: boolean
          skills: string[] | null
          trust_level: number
          updated_at: string
          website: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listing_view: { Args: { _id: string }; Returns: undefined }
      listings_owner_stats: {
        Args: { _user_ids: string[] }
        Returns: {
          avg_rating: number
          review_count: number
          user_id: string
        }[]
      }
      user_review_stats: {
        Args: { _user_id: string }
        Returns: {
          avg_rating: number
          review_count: number
        }[]
      }
    }
    Enums: {
      app_role: "user" | "admin"
      listing_category:
        | "bakici"
        | "ev_temizlik"
        | "ofis_temizlik"
        | "merdiven_temizlik"
        | "evcil_yuva_arayan"
        | "evcil_yuva_veren"
      listing_status: "active" | "paused" | "closed"
      listing_type: "offering" | "seeking"
      price_type: "hourly" | "daily" | "monthly" | "job" | "negotiable"
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
      app_role: ["user", "admin"],
      listing_category: [
        "bakici",
        "ev_temizlik",
        "ofis_temizlik",
        "merdiven_temizlik",
        "evcil_yuva_arayan",
        "evcil_yuva_veren",
      ],
      listing_status: ["active", "paused", "closed"],
      listing_type: ["offering", "seeking"],
      price_type: ["hourly", "daily", "monthly", "job", "negotiable"],
    },
  },
} as const
