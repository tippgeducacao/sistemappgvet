export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          created_at: string | null
          crmv: string | null
          data_matricula: string | null
          email: string
          form_entry_id: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string | null
          crmv?: string | null
          data_matricula?: string | null
          email: string
          form_entry_id?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string | null
          crmv?: string | null
          data_matricula?: string | null
          email?: string
          form_entry_id?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_form_entry_id_fkey"
            columns: ["form_entry_id"]
            isOneToOne: false
            referencedRelation: "form_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_alunos_form_entry"
            columns: ["form_entry_id"]
            isOneToOne: false
            referencedRelation: "form_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          criado_por: string | null
          id: string
          modalidade: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          criado_por?: string | null
          id?: string
          modalidade?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          criado_por?: string | null
          id?: string
          modalidade?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_entries: {
        Row: {
          aluno_id: string | null
          atualizado_em: string | null
          created_at: string | null
          curso_id: string | null
          documento_comprobatorio: string | null
          enviado_em: string | null
          id: string
          motivo_pendencia: string | null
          observacoes: string | null
          pontuacao_esperada: number | null
          pontuacao_validada: number | null
          status: string | null
          vendedor_id: string | null
        }
        Insert: {
          aluno_id?: string | null
          atualizado_em?: string | null
          created_at?: string | null
          curso_id?: string | null
          documento_comprobatorio?: string | null
          enviado_em?: string | null
          id?: string
          motivo_pendencia?: string | null
          observacoes?: string | null
          pontuacao_esperada?: number | null
          pontuacao_validada?: number | null
          status?: string | null
          vendedor_id?: string | null
        }
        Update: {
          aluno_id?: string | null
          atualizado_em?: string | null
          created_at?: string | null
          curso_id?: string | null
          documento_comprobatorio?: string | null
          enviado_em?: string | null
          id?: string
          motivo_pendencia?: string | null
          observacoes?: string | null
          pontuacao_esperada?: number | null
          pontuacao_validada?: number | null
          status?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_form_entries_aluno"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_entries_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_entries_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_validacoes: {
        Row: {
          acao: string
          created_at: string | null
          data: string | null
          descricao: string | null
          form_entry_id: string | null
          id: string
          secretaria_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          form_entry_id?: string | null
          id?: string
          secretaria_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          form_entry_id?: string | null
          id?: string
          secretaria_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_validacoes_form_entry_id_fkey"
            columns: ["form_entry_id"]
            isOneToOne: false
            referencedRelation: "form_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          dispositivo: string | null
          email: string | null
          fonte_referencia: string | null
          id: string
          ip_address: string | null
          nome: string
          observacoes: string | null
          pagina_id: string | null
          pagina_nome: string | null
          regiao: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          vendedor_atribuido: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          dispositivo?: string | null
          email?: string | null
          fonte_referencia?: string | null
          id?: string
          ip_address?: string | null
          nome: string
          observacoes?: string | null
          pagina_id?: string | null
          pagina_nome?: string | null
          regiao?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vendedor_atribuido?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          dispositivo?: string | null
          email?: string | null
          fonte_referencia?: string | null
          id?: string
          ip_address?: string | null
          nome?: string
          observacoes?: string | null
          pagina_id?: string | null
          pagina_nome?: string | null
          regiao?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vendedor_atribuido?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_vendedor_atribuido_fkey"
            columns: ["vendedor_atribuido"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_semanais_vendedores: {
        Row: {
          ano: number
          created_at: string
          created_by: string | null
          id: string
          meta_vendas: number
          semana: number
          updated_at: string
          vendedor_id: string
        }
        Insert: {
          ano: number
          created_at?: string
          created_by?: string | null
          id?: string
          meta_vendas?: number
          semana: number
          updated_at?: string
          vendedor_id: string
        }
        Update: {
          ano?: number
          created_at?: string
          created_by?: string | null
          id?: string
          meta_vendas?: number
          semana?: number
          updated_at?: string
          vendedor_id?: string
        }
        Relationships: []
      }
      metas_vendedores: {
        Row: {
          ano: number
          created_at: string
          created_by: string | null
          id: string
          mes: number
          meta_vendas: number
          updated_at: string
          vendedor_id: string
        }
        Insert: {
          ano: number
          created_at?: string
          created_by?: string | null
          id?: string
          mes: number
          meta_vendas?: number
          updated_at?: string
          vendedor_id: string
        }
        Update: {
          ano?: number
          created_at?: string
          created_by?: string | null
          id?: string
          mes?: number
          meta_vendas?: number
          updated_at?: string
          vendedor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          photo_url: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
          photo_url?: string | null
          updated_at?: string | null
          user_type: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          photo_url?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      regras_pontuacao: {
        Row: {
          campo_nome: string
          created_at: string | null
          id: string
          opcao_valor: string
          pontos: number
        }
        Insert: {
          campo_nome: string
          created_at?: string | null
          id?: string
          opcao_valor: string
          pontos: number
        }
        Update: {
          campo_nome?: string
          created_at?: string | null
          id?: string
          opcao_valor?: string
          pontos?: number
        }
        Relationships: []
      }
      respostas_formulario: {
        Row: {
          campo_nome: string
          created_at: string | null
          form_entry_id: string | null
          id: string
          valor_informado: string
        }
        Insert: {
          campo_nome: string
          created_at?: string | null
          form_entry_id?: string | null
          id?: string
          valor_informado: string
        }
        Update: {
          campo_nome?: string
          created_at?: string | null
          form_entry_id?: string | null
          id?: string
          valor_informado?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_formulario_form_entry_id_fkey"
            columns: ["form_entry_id"]
            isOneToOne: false
            referencedRelation: "form_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
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
      delete_venda_cascade: {
        Args: { venda_id: string }
        Returns: boolean
      }
      find_document_by_venda_id: {
        Args: { venda_id_param: string }
        Returns: string
      }
      find_document_in_bucket: {
        Args: { search_pattern: string }
        Returns: string
      }
      get_weeks_in_month: {
        Args: { ano: number; mes: number }
        Returns: number
      }
      has_role: {
        Args: { user_id: string; role_name: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_diretor: {
        Args: { _user_id: string }
        Returns: boolean
      }
      list_bucket_files: {
        Args: { bucket_name: string; folder_prefix?: string }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      recalculate_venda_score: {
        Args: { venda_id: string }
        Returns: undefined
      }
      update_venda_status: {
        Args: {
          venda_id_param: string
          novo_status: string
          pontuacao_param?: number
          motivo_param?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "secretaria" | "vendedor" | "diretor" | "sdr"
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
      app_role: ["admin", "secretaria", "vendedor", "diretor", "sdr"],
    },
  },
} as const
