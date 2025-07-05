export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alunos: {
        Row: {
          crmv: string | null
          email: string
          form_entry_id: string
          id: string
          nome: string
          telefone: string | null
          vendedor_id: string | null
        }
        Insert: {
          crmv?: string | null
          email: string
          form_entry_id: string
          id?: string
          nome: string
          telefone?: string | null
          vendedor_id?: string | null
        }
        Update: {
          crmv?: string | null
          email?: string
          form_entry_id?: string
          id?: string
          nome?: string
          telefone?: string | null
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
        ]
      }
      cursos: {
        Row: {
          ativo: boolean
          created_at: string
          criado_por: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_entries: {
        Row: {
          aluno_id: string | null
          atualizado_em: string | null
          curso_id: string | null
          documento_comprobatorio: string | null
          enviado_em: string | null
          id: string
          motivo_pendencia: string | null
          observacoes: string | null
          pontuacao_esperada: number | null
          pontuacao_validada: number | null
          status: Database["public"]["Enums"]["form_status"]
          vendedor_id: string
        }
        Insert: {
          aluno_id?: string | null
          atualizado_em?: string | null
          curso_id?: string | null
          documento_comprobatorio?: string | null
          enviado_em?: string | null
          id?: string
          motivo_pendencia?: string | null
          observacoes?: string | null
          pontuacao_esperada?: number | null
          pontuacao_validada?: number | null
          status?: Database["public"]["Enums"]["form_status"]
          vendedor_id: string
        }
        Update: {
          aluno_id?: string | null
          atualizado_em?: string | null
          curso_id?: string | null
          documento_comprobatorio?: string | null
          enviado_em?: string | null
          id?: string
          motivo_pendencia?: string | null
          observacoes?: string | null
          pontuacao_esperada?: number | null
          pontuacao_validada?: number | null
          status?: Database["public"]["Enums"]["form_status"]
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_entries_aluno_id_fkey"
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
        ]
      }
      historico_validacoes: {
        Row: {
          acao: Database["public"]["Enums"]["validation_action"]
          data: string | null
          descricao: string | null
          form_entry_id: string
          id: string
          secretaria_id: string
        }
        Insert: {
          acao: Database["public"]["Enums"]["validation_action"]
          data?: string | null
          descricao?: string | null
          form_entry_id: string
          id?: string
          secretaria_id: string
        }
        Update: {
          acao?: Database["public"]["Enums"]["validation_action"]
          data?: string | null
          descricao?: string | null
          form_entry_id?: string
          id?: string
          secretaria_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_validacoes_form_entry_id_fkey"
            columns: ["form_entry_id"]
            isOneToOne: false
            referencedRelation: "form_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_validacoes_secretaria_id_fkey"
            columns: ["secretaria_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          created_at: string | null
          data_proxima_acao: string | null
          descricao: string | null
          id: string
          lead_id: string
          proxima_acao: string | null
          resultado: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_proxima_acao?: string | null
          descricao?: string | null
          id?: string
          lead_id: string
          proxima_acao?: string | null
          resultado?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_proxima_acao?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string
          proxima_acao?: string | null
          resultado?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          convertido_em_venda: boolean | null
          created_at: string | null
          data_captura: string | null
          dispositivo: string | null
          email: string | null
          fonte_captura: string | null
          fonte_referencia: string | null
          id: string
          ip_address: string | null
          nome: string
          observacoes: string | null
          pagina_id: string | null
          pagina_nome: string | null
          regiao: string | null
          sprinthub_id: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          venda_id: string | null
          vendedor_atribuido: string | null
          whatsapp: string | null
        }
        Insert: {
          convertido_em_venda?: boolean | null
          created_at?: string | null
          data_captura?: string | null
          dispositivo?: string | null
          email?: string | null
          fonte_captura?: string | null
          fonte_referencia?: string | null
          id?: string
          ip_address?: string | null
          nome: string
          observacoes?: string | null
          pagina_id?: string | null
          pagina_nome?: string | null
          regiao?: string | null
          sprinthub_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          venda_id?: string | null
          vendedor_atribuido?: string | null
          whatsapp?: string | null
        }
        Update: {
          convertido_em_venda?: boolean | null
          created_at?: string | null
          data_captura?: string | null
          dispositivo?: string | null
          email?: string | null
          fonte_captura?: string | null
          fonte_referencia?: string | null
          id?: string
          ip_address?: string | null
          nome?: string
          observacoes?: string | null
          pagina_id?: string | null
          pagina_nome?: string | null
          regiao?: string | null
          sprinthub_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          venda_id?: string | null
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
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          photo_url: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          photo_url?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          photo_url?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      regras_pontuacao: {
        Row: {
          campo_nome: string
          created_at: string | null
          criado_por: string | null
          id: string
          opcao_valor: string
          pontos: number
        }
        Insert: {
          campo_nome: string
          created_at?: string | null
          criado_por?: string | null
          id?: string
          opcao_valor: string
          pontos?: number
        }
        Update: {
          campo_nome?: string
          created_at?: string | null
          criado_por?: string | null
          id?: string
          opcao_valor?: string
          pontos?: number
        }
        Relationships: [
          {
            foreignKeyName: "regras_pontuacao_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_formulario: {
        Row: {
          campo_nome: string
          form_entry_id: string
          id: string
          tick_status: Database["public"]["Enums"]["tick_status"] | null
          valor_informado: string
        }
        Insert: {
          campo_nome: string
          form_entry_id: string
          id?: string
          tick_status?: Database["public"]["Enums"]["tick_status"] | null
          valor_informado: string
        }
        Update: {
          campo_nome?: string
          form_entry_id?: string
          id?: string
          tick_status?: Database["public"]["Enums"]["tick_status"] | null
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
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          password_hash: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_pontuacao_formulario: {
        Args: { form_entry_id_param: string }
        Returns: number
      }
      calcular_pontuacao_total: {
        Args: { entry_id: string }
        Returns: number
      }
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
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      list_bucket_files: {
        Args: { bucket_name: string; folder_prefix?: string }
        Returns: {
          file_name: string
          file_path: string
          created_at: string
          file_size: number
        }[]
      }
      update_venda_status: {
        Args: {
          venda_id: string
          new_status: string
          pontuacao_validada_param?: number
          motivo_pendencia_param?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "secretaria" | "vendedor"
      form_status: "pendente" | "matriculado" | "desistiu"
      tick_status: "ok" | "pendente"
      user_role: "secretaria" | "vendedor"
      user_type: "secretaria" | "vendedor"
      validation_action: "marcou_ok" | "pendencia" | "status_alterado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "secretaria", "vendedor"],
      form_status: ["pendente", "matriculado", "desistiu"],
      tick_status: ["ok", "pendente"],
      user_role: ["secretaria", "vendedor"],
      user_type: ["secretaria", "vendedor"],
      validation_action: ["marcou_ok", "pendencia", "status_alterado"],
    },
  },
} as const
