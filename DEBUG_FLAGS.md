# Debug Flags - Guia de Uso

Este projeto implementa um sistema de logging controlado por flags para evitar poluição de logs em desenvolvimento e produção.

## ⚠️ Importante

- **Em desenvolvimento**: Logs debug só aparecem quando as flags estão ativadas
- **Em produção**: `console.log` é automaticamente removido pelo Terser durante o build

## 🚩 Flags Disponíveis

Ative as flags no console do navegador quando necessário:

### 1. DEBUG_ROLES
Exibe informações sobre roles e permissões do usuário.

```javascript
window.DEBUG_ROLES = true;
```

**O que mostra:**
- User type e email
- Roles atribuídas
- Flags de permissão (isAdmin, isVendedor, isSDR, etc.)

### 2. DEBUG_COMMISSION
Exibe cálculos de comissionamento e regras aplicadas.

```javascript
window.DEBUG_COMMISSION = true;
```

**O que mostra:**
- Multiplicadores históricos
- Regras de comissionamento aplicáveis
- Cálculo de percentuais

### 3. DEBUG_VENDAS
Exibe detalhes sobre processamento de vendas.

```javascript
window.DEBUG_VENDAS = true;
```

**O que mostra:**
- Datas efetivas de vendas
- Data de assinatura de contrato
- Cálculos de período

### 4. DEBUG_DASHBOARD
Exibe processamento de dados no dashboard.

```javascript
window.DEBUG_DASHBOARD = true;
```

**O que mostra:**
- Filtros aplicados
- Cálculo de ranking
- Processamento de metas

## 🔧 Como Usar

1. Abra o console do navegador (F12)
2. Digite a flag que deseja ativar:
   ```javascript
   window.DEBUG_ROLES = true;
   ```
3. Recarregue a página (F5)
4. Os logs relevantes começarão a aparecer

## 🔕 Desativar Logs

Para desativar os logs:

```javascript
window.DEBUG_ROLES = false;
window.DEBUG_COMMISSION = false;
window.DEBUG_VENDAS = false;
window.DEBUG_DASHBOARD = false;
```

Ou simplesmente recarregue a página sem definir as flags.

## 📝 Exemplo de Uso

**Cenário:** Você quer debugar por que um vendedor não está vendo certas vendas no dashboard.

```javascript
// Ativar logs de roles e vendas
window.DEBUG_ROLES = true;
window.DEBUG_VENDAS = true;
window.DEBUG_DASHBOARD = true;

// Recarregar página
location.reload();
```

Agora você verá:
- Roles do usuário
- Processamento de cada venda
- Filtros aplicados no dashboard
- Cálculos de data efetiva

## 🏗️ Para Desenvolvedores

Se você precisar adicionar novos logs debug:

```typescript
import { Logger } from '@/services/logger/LoggerService';

// Usar Logger.debug com flag
if ((window as any).DEBUG_YOUR_FLAG) {
  Logger.debug('Sua mensagem', { contexto: 'dados relevantes' });
}
```

**Benefícios:**
- Console limpo em desenvolvimento normal
- Logs disponíveis quando necessário
- Sem impacto em produção (removido pelo Terser)
- Sanitização automática de dados sensíveis

## 🔒 Segurança

O `Logger` sanitiza automaticamente dados sensíveis:
- Passwords
- Tokens
- API Keys
- Secrets
- Authorization headers

Mesmo com debug ativado, dados sensíveis aparecem como `***REDACTED***`.
