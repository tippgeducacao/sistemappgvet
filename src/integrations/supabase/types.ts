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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string
          data_agendamento: string
          data_fim_agendamento: string | null
          data_resultado: string | null
          id: string
          lead_id: string
          link_reuniao: string
          observacoes: string | null
          observacoes_resultado: string | null
          pos_graduacao_interesse: string
          resultado_reuniao: string | null
          sdr_id: string
          status: string
          updated_at: string
          vendedor_id: string
        }
        Insert: {
          created_at?: string
          data_agendamento: string
          data_fim_agendamento?: string | null
          data_resultado?: string | null
          id?: string
          lead_id: string
          link_reuniao?: string
          observacoes?: string | null
          observacoes_resultado?: string | null
          pos_graduacao_interesse: string
          resultado_reuniao?: string | null
          sdr_id: string
          status?: string
          updated_at?: string
          vendedor_id: string
        }
        Update: {
          created_at?: string
          data_agendamento?: string
          data_fim_agendamento?: string | null
          data_resultado?: string | null
          id?: string
          lead_id?: string
          link_reuniao?: string
          observacoes?: string | null
          observacoes_resultado?: string | null
          pos_graduacao_interesse?: string
          resultado_reuniao?: string | null
          sdr_id?: string
          status?: string
          updated_at?: string
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      avaliacoes_semanais_vendedores: {
        Row: {
          ano: number
          classificacao: string
          created_at: string
          created_by: string | null
          id: string
          observacoes: string | null
          semana: number
          semanas_consecutivas_abaixo_meta: number
          status_risco: string
          taxa_conversao: number
          total_matriculas: number
          total_reunioes_realizadas: number
          updated_at: string
          vendedor_id: string
        }
        Insert: {
          ano: number
          classificacao?: string
          created_at?: string
          created_by?: string | null
          id?: string
          observacoes?: string | null
          semana: number
          semanas_consecutivas_abaixo_meta?: number
          status_risco?: string
          taxa_conversao?: number
          total_matriculas?: number
          total_reunioes_realizadas?: number
          updated_at?: string
          vendedor_id: string
        }
        Update: {
          ano?: number
          classificacao?: string
          created_at?: string
          created_by?: string | null
          id?: string
          observacoes?: string | null
          semana?: number
          semanas_consecutivas_abaixo_meta?: number
          status_risco?: string
          taxa_conversao?: number
          total_matriculas?: number
          total_reunioes_realizadas?: number
          updated_at?: string
          vendedor_id?: string
        }
        Relationships: []
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
      eventos_especiais: {
        Row: {
          created_at: string
          created_by: string
          data_fim: string
          data_fim_recorrencia: string | null
          data_inicio: string
          data_inicio_recorrencia: string | null
          descricao: string | null
          dias_semana: number[] | null
          hora_fim: string
          hora_inicio: string
          id: string
          is_recorrente: boolean
          tipo_recorrencia: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data_fim: string
          data_fim_recorrencia?: string | null
          data_inicio: string
          data_inicio_recorrencia?: string | null
          descricao?: string | null
          dias_semana?: number[] | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          is_recorrente?: boolean
          tipo_recorrencia?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data_fim?: string
          data_fim_recorrencia?: string | null
          data_inicio?: string
          data_inicio_recorrencia?: string | null
          descricao?: string | null
          dias_semana?: number[] | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          is_recorrente?: boolean
          tipo_recorrencia?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      form_entries: {
        Row: {
          abertura: string | null
          aluno_id: string | null
          atualizado_em: string | null
          created_at: string | null
          curso_id: string | null
          data_aprovacao: string | null
          data_assinatura_contrato: string | null
          documento_comprobatorio: string | null
          enviado_em: string | null
          id: string
          motivo_pendencia: string | null
          observacoes: string | null
          pontuacao_esperada: number | null
          pontuacao_validada: number | null
          status: string | null
          turma: string | null
          vendedor_id: string | null
        }
        Insert: {
          abertura?: string | null
          aluno_id?: string | null
          atualizado_em?: string | null
          created_at?: string | null
          curso_id?: string | null
          data_aprovacao?: string | null
          data_assinatura_contrato?: string | null
          documento_comprobatorio?: string | null
          enviado_em?: string | null
          id?: string
          motivo_pendencia?: string | null
          observacoes?: string | null
          pontuacao_esperada?: number | null
          pontuacao_validada?: number | null
          status?: string | null
          turma?: string | null
          vendedor_id?: string | null
        }
        Update: {
          abertura?: string | null
          aluno_id?: string | null
          atualizado_em?: string | null
          created_at?: string | null
          curso_id?: string | null
          data_aprovacao?: string | null
          data_assinatura_contrato?: string | null
          documento_comprobatorio?: string | null
          enviado_em?: string | null
          id?: string
          motivo_pendencia?: string | null
          observacoes?: string | null
          pontuacao_esperada?: number | null
          pontuacao_validada?: number | null
          status?: string | null
          turma?: string | null
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
      grupos_pos_graduacoes: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      grupos_pos_graduacoes_cursos: {
        Row: {
          created_at: string
          curso_id: string
          grupo_id: string
          id: string
        }
        Insert: {
          created_at?: string
          curso_id: string
          grupo_id: string
          id?: string
        }
        Update: {
          created_at?: string
          curso_id?: string
          grupo_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_pos_graduacoes_cursos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_pos_graduacoes_cursos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_pos_graduacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_supervisores: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome_grupo: string
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome_grupo: string
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome_grupo?: string
          supervisor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      historico_mensal_planilhas: {
        Row: {
          ano: number
          created_at: string
          data_fechamento: string | null
          fechado_por: string | null
          id: string
          mes: number
          snapshot_metas: Json
          snapshot_niveis: Json
          snapshot_regras_comissionamento: Json
          status: string
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          data_fechamento?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          snapshot_metas?: Json
          snapshot_niveis?: Json
          snapshot_regras_comissionamento?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          data_fechamento?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          snapshot_metas?: Json
          snapshot_niveis?: Json
          snapshot_regras_comissionamento?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      indicacoes: {
        Row: {
          area_interesse: string | null
          cadastrado_por: string
          created_at: string
          formacao: string | null
          id: string
          nome_aluno: string
          nome_indicado: string
          observacoes: string | null
          status: string
          updated_at: string
          vendedor_atribuido: string | null
          whatsapp_aluno: string
          whatsapp_indicado: string
        }
        Insert: {
          area_interesse?: string | null
          cadastrado_por: string
          created_at?: string
          formacao?: string | null
          id?: string
          nome_aluno: string
          nome_indicado: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          vendedor_atribuido?: string | null
          whatsapp_aluno: string
          whatsapp_indicado: string
        }
        Update: {
          area_interesse?: string | null
          cadastrado_por?: string
          created_at?: string
          formacao?: string | null
          id?: string
          nome_aluno?: string
          nome_indicado?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          vendedor_atribuido?: string | null
          whatsapp_aluno?: string
          whatsapp_indicado?: string
        }
        Relationships: []
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
      membros_grupos_supervisores: {
        Row: {
          created_at: string
          created_by: string | null
          grupo_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          grupo_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          grupo_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_membros_grupos_supervisores_grupo"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_supervisores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_membros_grupos_supervisores_usuario"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membros_grupos_supervisores_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_supervisores"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_mensais_supervisores: {
        Row: {
          ano: number
          created_at: string
          created_by: string | null
          grupo_id: string | null
          id: string
          mes: number
          meta_vendas: number
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          created_by?: string | null
          grupo_id?: string | null
          id?: string
          mes: number
          meta_vendas?: number
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          created_by?: string | null
          grupo_id?: string | null
          id?: string
          mes?: number
          meta_vendas?: number
          supervisor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_mensais_supervisores_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_supervisores"
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
      niveis_vendedores: {
        Row: {
          bonus_reuniao_b2b: number | null
          created_at: string
          created_by: string | null
          fixo_mensal: number
          id: string
          meta_semanal_inbound: number | null
          meta_semanal_outbound: number | null
          meta_semanal_vendedor: number
          meta_vendas_cursos: number
          nivel: string
          tipo_usuario: string
          updated_at: string
          vale: number
          variavel_semanal: number
        }
        Insert: {
          bonus_reuniao_b2b?: number | null
          created_at?: string
          created_by?: string | null
          fixo_mensal?: number
          id?: string
          meta_semanal_inbound?: number | null
          meta_semanal_outbound?: number | null
          meta_semanal_vendedor?: number
          meta_vendas_cursos?: number
          nivel: string
          tipo_usuario?: string
          updated_at?: string
          vale?: number
          variavel_semanal?: number
        }
        Update: {
          bonus_reuniao_b2b?: number | null
          created_at?: string
          created_by?: string | null
          fixo_mensal?: number
          id?: string
          meta_semanal_inbound?: number | null
          meta_semanal_outbound?: number | null
          meta_semanal_vendedor?: number
          meta_vendas_cursos?: number
          nivel?: string
          tipo_usuario?: string
          updated_at?: string
          vale?: number
          variavel_semanal?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string | null
          email: string
          horario_trabalho: Json | null
          id: string
          name: string
          nivel: string | null
          photo_url: string | null
          pos_graduacoes: string[] | null
          semanas_consecutivas_meta: number | null
          theme_preference: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          email: string
          horario_trabalho?: Json | null
          id: string
          name: string
          nivel?: string | null
          photo_url?: string | null
          pos_graduacoes?: string[] | null
          semanas_consecutivas_meta?: number | null
          theme_preference?: string | null
          updated_at?: string | null
          user_type: string
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          email?: string
          horario_trabalho?: Json | null
          id?: string
          name?: string
          nivel?: string | null
          photo_url?: string | null
          pos_graduacoes?: string[] | null
          semanas_consecutivas_meta?: number | null
          theme_preference?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      regras_comissionamento: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          multiplicador: number
          percentual_maximo: number
          percentual_minimo: number
          tipo_usuario: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          multiplicador: number
          percentual_maximo: number
          percentual_minimo: number
          tipo_usuario?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          multiplicador?: number
          percentual_maximo?: number
          percentual_minimo?: number
          tipo_usuario?: string
          updated_at?: string
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
      relatorios_diarios: {
        Row: {
          acoes_proximo_dia: string | null
          created_at: string
          data: string
          id: string
          principais_objecoes: string | null
          reunioes_realizadas: number
          taxa_fechamento: number
          updated_at: string
          vendas_fechadas: number
          vendedor_id: string
        }
        Insert: {
          acoes_proximo_dia?: string | null
          created_at?: string
          data: string
          id?: string
          principais_objecoes?: string | null
          reunioes_realizadas?: number
          taxa_fechamento?: number
          updated_at?: string
          vendas_fechadas?: number
          vendedor_id: string
        }
        Update: {
          acoes_proximo_dia?: string | null
          created_at?: string
          data?: string
          id?: string
          principais_objecoes?: string | null
          reunioes_realizadas?: number
          taxa_fechamento?: number
          updated_at?: string
          vendas_fechadas?: number
          vendedor_id?: string
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
      calcular_avaliacao_semanal_vendedor: {
        Args: { p_ano: number; p_semana: number; p_vendedor_id: string }
        Returns: undefined
      }
      can_access_aluno: {
        Args: { aluno_vendedor_id: string }
        Returns: boolean
      }
      check_and_update_overdue_appointments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_invalid_pos_graduacoes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_weekly_goals_for_vendor: {
        Args: { p_ano: number; p_mes: number; p_vendedor_id: string }
        Returns: undefined
      }
      criar_snapshot_mensal: {
        Args: { p_ano: number; p_mes: number }
        Returns: boolean
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
      generate_monthly_weekly_goals: {
        Args: { p_ano: number; p_mes: number }
        Returns: undefined
      }
      get_current_user_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_student_safe_data: {
        Args: { student_id: string }
        Returns: {
          email_masked: string
          form_entry_id: string
          id: string
          nome: string
          telefone_masked: string
          vendedor_id: string
        }[]
      }
      get_weeks_in_month: {
        Args: { ano: number; mes: number }
        Returns: number
      }
      has_role: {
        Args: { role_name: string; user_id: string }
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
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      reabrir_mes_planilha: {
        Args: { p_ano: number; p_mes: number }
        Returns: boolean
      }
      recalculate_all_vendas: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_venda_score: {
        Args: { venda_id: string }
        Returns: undefined
      }
      update_overdue_appointments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_venda_status: {
        Args: {
          motivo_param?: string
          novo_status: string
          pontuacao_param?: number
          venda_id_param: string
        }
        Returns: boolean
      }
      update_venda_status_fast: {
        Args: {
          motivo_param?: string
          novo_status: string
          pontuacao_param?: number
          venda_id_param: string
        }
        Returns: boolean
      }
      verificar_conflito_evento_especial: {
        Args: { data_fim_agendamento: string; data_inicio_agendamento: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "secretaria"
        | "vendedor"
        | "diretor"
        | "sdr_inbound"
        | "sdr_outbound"
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
      app_role: [
        "admin",
        "secretaria",
        "vendedor",
        "diretor",
        "sdr_inbound",
        "sdr_outbound",
      ],
    },
  },
} as const
