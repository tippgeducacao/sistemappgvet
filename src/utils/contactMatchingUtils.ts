/**
 * Utilitário para normalização e matching de contatos entre leads e alunos
 * Garante consistência entre diferentes partes do sistema
 */

export interface LeadContact {
  id: string;
  whatsapp?: string;
  email?: string;
}

export interface AlunoContact {
  form_entry_id: string;
  nome: string;
  telefone?: string;
  email?: string;
}

/**
 * Normaliza um número de telefone removendo todos os caracteres não-numéricos
 */
export const normalizePhoneNumber = (phone?: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Normaliza um email convertendo para minúsculas e removendo espaços
 */
export const normalizeEmail = (email?: string): string => {
  if (!email) return '';
  return email.toLowerCase().trim();
};

/**
 * Verifica se dois números de telefone são iguais após normalização
 */
export const isPhoneMatch = (phone1?: string, phone2?: string): boolean => {
  if (!phone1 || !phone2) return false;
  
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);
  
  if (!normalized1 || !normalized2) return false;
  
  return normalized1 === normalized2;
};

/**
 * Verifica se dois emails são iguais após normalização
 */
export const isEmailMatch = (email1?: string, email2?: string): boolean => {
  if (!email1 || !email2) return false;
  
  const normalized1 = normalizeEmail(email1);
  const normalized2 = normalizeEmail(email2);
  
  if (!normalized1 || !normalized2) return false;
  
  return normalized1 === normalized2;
};

/**
 * Faz o matching entre um lead e um aluno baseado em telefone/WhatsApp e email
 */
export const isContactMatch = (lead: LeadContact, aluno: AlunoContact): boolean => {
  // Match por telefone/WhatsApp
  const phoneMatch = isPhoneMatch(lead.whatsapp, aluno.telefone);
  
  // Match por email
  const emailMatch = isEmailMatch(lead.email, aluno.email);
  
  return phoneMatch || emailMatch;
};

/**
 * Encontra matching entre uma lista de leads e uma lista de alunos
 * Retorna um Map com agendamento_id -> aluno_data para matches encontrados
 */
export const findContactMatches = (
  agendamentosComLeads: Array<{ id: string; lead_id: string }>,
  leadsData: LeadContact[],
  alunosData: AlunoContact[]
): Map<string, AlunoContact> => {
  const matches = new Map<string, AlunoContact>();
  
  console.log('🔍 MATCHING - Iniciando processo de matching:', {
    agendamentos: agendamentosComLeads.length,
    leads: leadsData.length,
    alunos: alunosData.length
  });
  
  agendamentosComLeads.forEach(agendamento => {
    const leadData = leadsData.find(l => l.id === agendamento.lead_id);
    if (!leadData) {
      console.log(`⚠️ Lead não encontrado para agendamento ${agendamento.id}`);
      return;
    }
    
    const leadWhatsApp = normalizePhoneNumber(leadData.whatsapp);
    const leadEmail = normalizeEmail(leadData.email);
    
    console.log(`🔍 MATCHING - Buscando match para agendamento ${agendamento.id}:`, {
      lead_id: leadData.id,
      lead_whatsapp: leadWhatsApp || 'N/A',
      lead_email: leadEmail || 'N/A'
    });
    
    const alunoMatching = alunosData.find(aluno => {
      const alunoWhatsApp = normalizePhoneNumber(aluno.telefone);
      const alunoEmail = normalizeEmail(aluno.email);
      
      // Match por telefone/WhatsApp
      const phoneMatch = leadWhatsApp && alunoWhatsApp && leadWhatsApp === alunoWhatsApp;
      
      // Match por email
      const emailMatch = leadEmail && alunoEmail && leadEmail === alunoEmail;
      
      const isMatch = phoneMatch || emailMatch;
      
      if (isMatch) {
        console.log(`✅ MATCH ENCONTRADO para agendamento ${agendamento.id}:`, {
          match_type: phoneMatch ? 'telefone' : 'email',
          lead_whatsapp: leadWhatsApp,
          aluno_telefone: alunoWhatsApp,
          lead_email: leadEmail,
          aluno_email: alunoEmail,
          aluno_nome: aluno.nome,
          form_entry_id: aluno.form_entry_id
        });
      }
      
      return isMatch;
    });
    
    if (alunoMatching) {
      matches.set(agendamento.id, alunoMatching);
    } else {
      console.log(`❌ Nenhum match encontrado para agendamento ${agendamento.id}`);
    }
  });
  
  console.log('🔍 MATCHING - Resultado final:', {
    total_matches: matches.size,
    matches_detalhes: Array.from(matches.entries()).map(([agendamento_id, aluno]) => ({
      agendamento_id,
      aluno_nome: aluno.nome,
      form_entry_id: aluno.form_entry_id
    }))
  });
  
  return matches;
};