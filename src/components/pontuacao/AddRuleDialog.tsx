
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { NewRule } from '@/types/pontuacao';

interface AddRuleDialogProps {
  showAddDialog: boolean;
  setShowAddDialog: (show: boolean) => void;
  newRule: NewRule;
  setNewRule: (rule: NewRule) => void;
  onAddRule: () => void;
  isAdding: boolean;
}

const AddRuleDialog: React.FC<AddRuleDialogProps> = ({
  showAddDialog,
  setShowAddDialog,
  newRule,
  setNewRule,
  onAddRule,
  isAdding
}) => {
  return (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogTrigger asChild>
        <Button className="bg-ppgvet-teal hover:bg-ppgvet-teal/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nova Regra de Pontuação</DialogTitle>
          <DialogDescription>
            Defina uma nova regra para calcular pontuações nas vendas
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="campo_nome">Nome do Campo</Label>
            <Input
              id="campo_nome"
              value={newRule.campo_nome}
              onChange={(e) => setNewRule({ ...newRule, campo_nome: e.target.value })}
              placeholder="Ex: titulacao, especializacao"
            />
          </div>
          
          <div>
            <Label htmlFor="opcao_valor">Valor da Opção</Label>
            <Input
              id="opcao_valor"
              value={newRule.opcao_valor}
              onChange={(e) => setNewRule({ ...newRule, opcao_valor: e.target.value })}
              placeholder="Ex: Mestrado, Doutorado"
            />
          </div>
          
          <div>
            <Label htmlFor="pontos">Pontos</Label>
            <Input
              id="pontos"
              type="number"
              value={newRule.pontos}
              onChange={(e) => setNewRule({ ...newRule, pontos: Number(e.target.value) })}
              placeholder="0"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={onAddRule} disabled={isAdding}>
            {isAdding ? 'Adicionando...' : 'Adicionar Regra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRuleDialog;
