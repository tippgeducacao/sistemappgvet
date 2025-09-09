
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useVendas } from '@/hooks/useVendas';
import DashboardMetricsCards from '@/components/dashboard/DashboardMetricsCards';
import VendedorMetas from '@/components/dashboard/VendedorMetas';

import SemanasConsecutivasCard from '@/components/dashboard/SemanasConsecutivasCard';
import { ReunioesVendedoresChart } from '@/components/dashboard/ReunioesVendedoresChart';
import ReuniaoAtrasadaModal from '@/components/vendedor/ReuniaoAtrasadaModal';
import { useReuniaoAtrasada } from '@/hooks/useReuniaoAtrasada';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const VendedorDashboard: React.FC = () => {
  const { profile } = useAuthStore();
  const { vendas } = useVendas();
  const { agendamentosAtrasados, verificarAgendamentosAtrasados } = useReuniaoAtrasada();

  // Usar lógica de semanas consistente
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  const { mes: mesCorreto, ano: anoCorreto } = getMesAnoSemanaAtual();
  const [selectedMonth, setSelectedMonth] = useState<number>(mesCorreto);
  const [selectedYear, setSelectedYear] = useState<number>(anoCorreto);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[month - 1];
  };
  
  // Estado para o modal de reuniões atrasadas
  const [modalAtrasadaAberto, setModalAtrasadaAberto] = useState(false);

  // Abrir modal automaticamente se há agendamentos atrasados
  React.useEffect(() => {
    if (agendamentosAtrasados.length > 0 && !modalAtrasadaAberto) {
      setModalAtrasadaAberto(true);
    }
  }, [agendamentosAtrasados.length]); // Remover modalAtrasadaAberto da dependência para permitir fechar

  return (
    <div className="space-y-6">
      {/* Header com navegação de mês */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {profile?.name || 'Vendedor'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas vendas e acompanhe seu desempenho
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center min-w-[140px]">
            <p className="font-medium">{getMonthName(selectedMonth)} {selectedYear}</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>


      {/* Cards de métricas */}
      <DashboardMetricsCards
        userType="vendedor"
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* Semanas Consecutivas */}
      <SemanasConsecutivasCard vendedorId={profile?.id} />

      {/* Metas do Vendedor */}
      <VendedorMetas
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* Gráfico de Resultados das Reuniões */}
      {/* <ReunioesVendedoresChart selectedVendedor={profile?.id} /> */}

      {/* Lista de vendas recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas Vendas Recentes</CardTitle>
          <CardDescription>
            Suas últimas vendas cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma venda cadastrada ainda</p>
              <p className="text-sm">Acesse a aba "Nova Venda" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vendas.slice(0, 5).map((venda) => (
                <div key={venda.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{venda.aluno?.nome || 'Nome não informado'}</p>
                    <p className="text-sm text-muted-foreground">
                      {venda.curso?.nome || 'Curso não informado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {venda.enviado_em ? new Date(venda.enviado_em).toLocaleDateString('pt-BR') : 'Data não informada'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      venda.status === 'matriculado' ? 'bg-green-100 text-green-800' :
                      venda.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {venda.status === 'matriculado' ? 'Matriculado' :
                       venda.status === 'pendente' ? 'Pendente' : 'Rejeitado'}
                    </div>
                    <p className="text-sm font-medium mt-1">
                      {venda.pontuacao_esperada || 0} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Reuniões Atrasadas */}
      <ReuniaoAtrasadaModal
        isOpen={modalAtrasadaAberto}
        onClose={() => setModalAtrasadaAberto(false)}
        agendamentos={agendamentosAtrasados}
      />
    </div>
  );
};

export default VendedorDashboard;
