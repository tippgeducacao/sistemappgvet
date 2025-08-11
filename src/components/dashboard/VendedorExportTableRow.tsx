import React, { useState, useEffect } from 'react';

interface VendedorExportTableRowProps {
  vendedor: any;
  index: number;
  vendedores: any[];
  niveis: any[];
  selectedMonth: string;
  getVendedorWeeklyPoints: (vendedorId: string, weeks: any[]) => number[];
  getWeeksOfMonth: (year: number, month: number) => any[];
  calculateWeeklyCommission: (points: number, metaSemanal: number, variavelSemanal: number) => Promise<any>;
}

const VendedorExportTableRow: React.FC<VendedorExportTableRowProps> = ({
  vendedor,
  index,
  vendedores,
  niveis,
  selectedMonth,
  getVendedorWeeklyPoints,
  getWeeksOfMonth,
  calculateWeeklyCommission
}) => {
  const [totalCommission, setTotalCommission] = useState(0);
  const [weeklyCommissions, setWeeklyCommissions] = useState<number[]>([]);

  const vendedorData = vendedores.find(v => v.id === vendedor.id);
  const vendedorNivel = vendedorData?.nivel || 'junior';
  const nivelConfig = niveis.find(n => n.nivel === vendedorNivel);
  const weeks = getWeeksOfMonth(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]));
  const weeklyPoints = getVendedorWeeklyPoints(vendedor.id, weeks);
  const totalPoints = weeklyPoints.reduce((sum, points) => sum + points, 0);
  const metaMensal = (nivelConfig?.meta_semanal_vendedor || 6) * weeks.length;
  const achievementPercentage = metaMensal > 0 ? (totalPoints / metaMensal) * 100 : 0;

  useEffect(() => {
    const calculateCommissions = async () => {
      const metaSemanal = nivelConfig?.meta_semanal_vendedor || 6;
      const variavelSemanal = nivelConfig?.variavel_semanal || 0;
      
      const commissions = await Promise.all(
        weeklyPoints.map(points => calculateWeeklyCommission(points, metaSemanal, variavelSemanal))
      );
      
      const total = commissions.reduce((sum, c) => sum + c.valor, 0);
      setTotalCommission(total);
      setWeeklyCommissions(commissions.map(c => c.valor));
    };
    
    if (weeklyPoints.length > 0) {
      calculateCommissions();
    }
  }, [weeklyPoints, nivelConfig, calculateWeeklyCommission]);

  return (
    <tr key={vendedor.id} className={index % 2 === 0 ? "bg-background/50" : "bg-muted/20"}>
      <td className="p-2 font-medium">{vendedor.name}</td>
      <td className="p-2">{vendedorNivel.charAt(0).toUpperCase() + vendedorNivel.slice(1)}</td>
      <td className="p-2">{nivelConfig?.meta_semanal_vendedor || 6}</td>
      <td className="p-2">R$ {(nivelConfig?.variavel_semanal || 0).toFixed(2)}</td>
      {weeklyPoints.map((points, weekIndex) => {
        const metaSemanal = nivelConfig?.meta_semanal_vendedor || 6;
        const percentage = metaSemanal > 0 ? ((points / metaSemanal) * 100).toFixed(1) : "0.0";
        const weeklyCommission = weeklyCommissions[weekIndex] || 0;
        const variavelSemanal = nivelConfig?.variavel_semanal || 0;
        const fatorComissao = variavelSemanal > 0 ? (variavelSemanal / 100).toFixed(1) : "0.0";
        return (
          <td key={weekIndex} className="p-2 text-xs">
            <div>{points.toFixed(1)}pts ({percentage}%) x {fatorComissao}</div>
            <div className="opacity-70 text-green-600">R$ {weeklyCommission.toFixed(2)}</div>
          </td>
        );
      })}
      <td className="p-2 font-semibold">{totalPoints.toFixed(1)}</td>
      <td className="p-2 font-semibold">{achievementPercentage.toFixed(1)}%</td>
      <td className="p-2 font-semibold text-green-600">R$ {totalCommission.toFixed(2)}</td>
    </tr>
  );
};

export default VendedorExportTableRow;