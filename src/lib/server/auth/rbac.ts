import { error } from '@sveltejs/kit';

/**
 * Catálogo unificado de permissões do sistema SaaS Judô Hinodê.
 */
export type Permissao =
	| 'DASHBOARD_VER'
	| 'ALUNOS_VER'
	| 'ALUNOS_CRIAR'
	| 'ALUNOS_EDITAR'
	| 'TURMAS_VER'
	| 'TURMAS_GERENCIAR'
	| 'GRADUACOES_VER'
	| 'GRADUACOES_HOMOLOGAR'
	| 'CAMPEONATOS_VER'
	| 'CAMPEONATOS_CRIAR'
	| 'CAMPEONATOS_GERENCIAR'
	| 'CAMPEONATOS_INSCREVER'
	| 'CAMPEONATOS_RESULTADOS'
	| 'ACADEMIA_CONFIGURAR'
	| 'AUDITORIA_VER'
	| 'USUARIOS_VER'
	| 'USUARIOS_GERENCIAR';

/**
 * Matriz base de permissões associadas a cada papel (Role) do dojo.
 * Um usuário com múltiplos papéis (ex.: Admin + Professor) possui a união dessas permissões.
 */
const PERMISSOES_POR_PAPEL: Record<string, readonly Permissao[]> = {
	admin: [
		'DASHBOARD_VER',
		'ALUNOS_VER',
		'ALUNOS_CRIAR',
		'ALUNOS_EDITAR',
		'TURMAS_VER',
		'TURMAS_GERENCIAR',
		'GRADUACOES_VER',
		'GRADUACOES_HOMOLOGAR',
		'CAMPEONATOS_VER',
		'CAMPEONATOS_CRIAR',
		'CAMPEONATOS_GERENCIAR',
		'CAMPEONATOS_INSCREVER',
		'CAMPEONATOS_RESULTADOS',
		'ACADEMIA_CONFIGURAR',
		'AUDITORIA_VER',
		'USUARIOS_VER',
		'USUARIOS_GERENCIAR'
	],
	professor: [
		'DASHBOARD_VER',
		'ALUNOS_VER',
		'ALUNOS_CRIAR',
		'ALUNOS_EDITAR',
		'TURMAS_VER',
		'TURMAS_GERENCIAR',
		'GRADUACOES_VER',
		'GRADUACOES_HOMOLOGAR',
		'CAMPEONATOS_VER',
		'CAMPEONATOS_CRIAR',
		'CAMPEONATOS_GERENCIAR',
		'CAMPEONATOS_INSCREVER',
		'CAMPEONATOS_RESULTADOS'
	],
	recepcao: [
		'DASHBOARD_VER',
		'ALUNOS_VER',
		'ALUNOS_CRIAR',
		'ALUNOS_EDITAR',
		'TURMAS_VER',
		'CAMPEONATOS_VER',
		'CAMPEONATOS_INSCREVER'
	],
	aluno: [
		'DASHBOARD_VER',
		'TURMAS_VER',
		'GRADUACOES_VER',
		'CAMPEONATOS_VER',
		'CAMPEONATOS_INSCREVER'
	],
	responsavel: [
		'DASHBOARD_VER',
		'TURMAS_VER',
		'GRADUACOES_VER',
		'CAMPEONATOS_VER',
		'CAMPEONATOS_INSCREVER'
	]
};

/**
 * Normaliza o nome do papel removendo acentuação e convertendo para minúsculas.
 */
export function normalizarNomePapel(papel: string): string {
	return papel
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
}

/**
 * Calcula o conjunto unificado de permissões no servidor considerando papéis acumulativos.
 */
export function calcularPermissoes(perfis: string[]): Permissao[] {
	const conjuntoPermissoes = new Set<Permissao>();

	for (const perfil of perfis) {
		const chave = normalizarNomePapel(perfil);
		const permissoesDoPapel = PERMISSOES_POR_PAPEL[chave];
		if (permissoesDoPapel) {
			for (const p of permissoesDoPapel) {
				conjuntoPermissoes.add(p);
			}
		}
	}

	return Array.from(conjuntoPermissoes);
}

/**
 * Verifica se os perfis do usuário contemplam uma permissão específica.
 */
export function temPermissao(perfis: string[], permissao: Permissao): boolean {
	const permissoes = calcularPermissoes(perfis);
	return permissoes.includes(permissao);
}

/**
 * Garante no lado do servidor que o usuário possui a permissão requerida.
 * Se não possuir, interrompe com HTTP 403 Forbidden.
 */
export function exigirPermissao(perfis: string[], permissao: Permissao): void {
	if (!temPermissao(perfis, permissao)) {
		throw error(403, {
			message: 'Acesso negado: seu perfil não possui privilégios para esta operação.'
		});
	}
}

export type IconeMenu =
	| 'dashboard'
	| 'users'
	| 'calendar'
	| 'award'
	| 'trophy'
	| 'settings'
	| 'users-cog'
	| 'user';

export interface ItemMenu {
	titulo: string;
	href: string;
	icone: IconeMenu;
	descricao: string;
	permissao?: Permissao;
	fase: number;
	badge?: string;
	badgeUrgente?: boolean;
}

/**
 * Catálogo mestre dos módulos navegáveis do SaaS Judô Hinodê.
 */
const CATALOGO_MENU: readonly ItemMenu[] = [
	{
		titulo: 'Painel Geral',
		href: '/dashboard',
		icone: 'dashboard',
		descricao: 'Visão executiva do dojo e métricas',
		permissao: 'DASHBOARD_VER',
		fase: 3
	},
	{
		titulo: 'Alunos & Judocas',
		href: '/dashboard/alunos',
		icone: 'users',
		descricao: 'Matrículas, responsáveis e prontuário',
		permissao: 'ALUNOS_VER',
		fase: 4,
		badge: 'Fase 4'
	},
	{
		titulo: 'Turmas & Treinos',
		href: '/dashboard/turmas',
		icone: 'calendar',
		descricao: 'Horários, tatame e alocação de senseis',
		permissao: 'TURMAS_VER',
		fase: 5,
		badge: 'Fase 5'
	},
	{
		titulo: 'Graduações & Faixas',
		href: '/dashboard/graduacoes',
		icone: 'award',
		descricao: 'Histórico imutável de Dan/Kyu e homologação',
		permissao: 'GRADUACOES_VER',
		fase: 6,
		badge: 'Fase 6'
	},
	{
		titulo: 'Campeonatos',
		href: '/dashboard/campeonatos',
		icone: 'trophy',
		descricao: 'Inscrições em torneios e resultados',
		permissao: 'CAMPEONATOS_VER',
		fase: 7,
		badge: 'Fase 7'
	},
	{
		titulo: 'Meu Perfil',
		href: '/dashboard/perfil',
		icone: 'user',
		descricao: 'Meus dados cadastrais, contato e endereço',
		fase: 10
	},
	{
		titulo: 'Equipe & Usuários',
		href: '/dashboard/usuarios',
		icone: 'users-cog',
		descricao: 'Gestão de operadores e perfis acumulativos',
		permissao: 'USUARIOS_VER',
		fase: 9,
		badge: 'Fase 9'
	},
	{
		titulo: 'Configurações do Dojo',
		href: '/dashboard/configuracoes',
		icone: 'settings',
		descricao: 'Dados da academia e auditoria LGPD',
		permissao: 'ACADEMIA_CONFIGURAR',
		fase: 8,
		badge: 'Fase 8'
	}
];

/**
 * Retorna os itens de navegação autorizados para o conjunto de papéis do usuário logado.
 */
export function obterMenuAutorizado(perfis: string[]): ItemMenu[] {
	const permissoesAtivas = new Set(calcularPermissoes(perfis));
	const ehGestorOuProfessor = perfis.some((p) => {
		const norm = normalizarNomePapel(p);
		return norm === 'admin' || norm === 'professor' || norm === 'recepcao';
	});
	const ehAluno = perfis.some((p) => normalizarNomePapel(p) === 'aluno');

	return CATALOGO_MENU.filter((item) => {
		if (!item.permissao) return true;
		return permissoesAtivas.has(item.permissao);
	}).map((item) => {
		if (ehAluno && !ehGestorOuProfessor) {
			if (item.href === '/dashboard') {
				return {
					...item,
					titulo: 'Meu Painel',
					descricao: 'Minha jornada, graduações e treinos'
				};
			}
			if (item.href === '/dashboard/turmas') {
				return {
					...item,
					titulo: 'Meus Treinos & Grade',
					descricao: 'Horários do dojo e turmas inscritas'
				};
			}
			if (item.href === '/dashboard/graduacoes') {
				return {
					...item,
					titulo: 'Minhas Graduações',
					descricao: 'Histórico de faixas e exames agendados'
				};
			}
			if (item.href === '/dashboard/campeonatos') {
				return {
					...item,
					titulo: 'Torneios & Inscrições',
					descricao: 'Calendário de competições e inscrições'
				};
			}
		}
		return item;
	});
}
