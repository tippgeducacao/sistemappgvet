export class NavigationService {
  static readonly SECTIONS = {
    DASHBOARD: 'dashboard',
    MINHAS_VENDAS: 'minhas-vendas',
    GERENCIAR_PONTUACOES: 'gerenciar-pontuacoes',
    GERENCIAR_CURSOS: 'gerenciar-cursos',
    GERENCIAR_VENDAS: 'gerenciar-vendas',
    GESTAO_LEADS: 'gestao-leads',
    GERENCIAR_PERFIS: 'gerenciar-perfis', // Nova seção para perfis
  } as const;

  static navigateTo(section: string) {
    window.location.hash = `#${section}`;
  }

  static getCurrentSection(): string {
    const hash = window.location.hash.substring(1); // Remove the '#'
    return hash || this.SECTIONS.DASHBOARD;
  }
}
