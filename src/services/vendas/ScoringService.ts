
import { supabase } from '@/integrations/supabase/client';
import { ScoringCalculationService } from '@/services/scoring/ScoringCalculationService';

export class ScoringService {
  /**
   * Calcula ou atualiza pontuação da venda
   */
  static async calculateOrUpdateScore(entry: any, vendaRespostas: any[], rules: any[]): Promise<number> {
    let pontuacaoEsperada = entry.pontuacao_esperada;
    
    if (!pontuacaoEsperada || pontuacaoEsperada === 0 || !isFinite(pontuacaoEsperada) || pontuacaoEsperada > 100) {
      console.log(`🔢 Recalculando pontuação para venda ${entry.id} (valor atual: ${pontuacaoEsperada})`);
      
      if (vendaRespostas.length > 0 && rules.length > 0) {
        pontuacaoEsperada = await ScoringCalculationService.calculatePointsFromResponses(vendaRespostas, rules, entry.vendedor_id);
        
        if (!isFinite(pontuacaoEsperada) || isNaN(pontuacaoEsperada)) {
          console.warn(`⚠️ Pontuação inválida calculada para venda ${entry.id}, definindo como 0`);
          pontuacaoEsperada = 0;
        }
        
        if (pontuacaoEsperada !== entry.pontuacao_esperada) {
          console.log(`💾 Atualizando pontuação de ${entry.pontuacao_esperada} para ${pontuacaoEsperada}`);
          await supabase
            .from('form_entries')
            .update({ pontuacao_esperada: pontuacaoEsperada })
            .eq('id', entry.id);
        }
      } else {
        console.warn(`⚠️ Não foi possível recalcular pontuação: respostas=${vendaRespostas.length}, regras=${rules.length}`);
        pontuacaoEsperada = 0;
      }
    }

    return pontuacaoEsperada;
  }
}
