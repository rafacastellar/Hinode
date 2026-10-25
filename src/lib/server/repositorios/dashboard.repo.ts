import type { RowDataPacket } from 'mysql2';
import { getDbPool } from '../db/pool';
import { buscarAlunoPorId } from './aluno.repo';
import { buscarHistoricoDoAluno, type HistoricoAlunoItem } from './graduacao.repo';
import { validarElegibilidadeGraduacao } from '../servicos/regras-graduacao';
import { obterClassificacaoJudo } from '../../dominio/regras-categoria-peso';

export interface MetricasDojo {
	totalAlunos: number;
	totalTurmas: number;
	totalProfessores: number;
	totalGraduacoes: number;
	proximosEventos: Array<{
		id_evento: number;
		nome: string;
		edicao: string | null;
		data_inicio: string | null;
		faixa_inicio?: string | null;
		faixa_fim?: string | null;
		limite_graduacao?: string | null;
		limite_grupo?: string | null;
		valor_inscricao?: number | null;
		eh_campeonato: boolean;
	}>;
}

export interface TreinoInscritoJudoca {
	id_treino: number;
	descricao: string;
	dia_semana: string;
	horario_inicio: string;
	horario_fim: string;
	professores: string;
}

export interface ConquistaJudoca {
	id_classificacao: number;
	id_campeonato: number;
	nome_campeonato: string;
	edicao: string | null;
	data_evento: string;
	classificacao: string;
	qtd_lutas: number;
	qtd_vitorias: number;
	tipo_medalha: 'ouro' | 'prata' | 'bronze' | 'participacao';
}

export interface SenseiResumo {
	id_usuario: number;
	nome: string;
	grau_faixa: string | null;
	email: string;
}

export interface PendenciaJudoca {
	id: string;
	tipo: 'confirmacao_campeonato' | 'exame_elegivel' | 'sem_turma' | 'peso_categoria' | 'federacao';
	gravidade: 'alta' | 'media' | 'informativa';
	dependeDoAluno: boolean;
	prazo?: string | null;
	titulo: string;
	descricao: string;
	textoBotao: string;
	href: string;
	badge: string;
	idInscricao?: number;
	idEvento?: number;
}

export interface PainelJudocaDados {
	judoca: {
		id_usuario: number;
		nome: string;
		email: string;
		telefone: string | null;
		matricula: string | null;
		graduacao_atual: string;
		peso: number | null;
		categoria: string | null;
		data_inicio: string | null;
		data_inicio_br: string | null;
		data_primeira_graduacao: string | null;
		data_primeira_graduacao_br: string | null;
		nome_professor_responsavel: string;
		tempo_faixa_atual: string;
		tempo_judo: string;
		data_ultima_graduacao_br: string | null;
	};
	metricasJudoca: {
		totalTreinosInscritos: number;
		totalCampeonatos: number;
		totalMedalhas: number;
		totalOuro: number;
		totalPrata: number;
		totalBronze: number;
		totalLutas: number;
		totalVitorias: number;
	};
	metricasAcademia: {
		totalAlunos: number;
		totalTreinosDisponiveis: number;
		totalProfessores: number;
		totalTrofeusCampeonatos: number;
		totalMedalhasAlunos: number;
		senseis: SenseiResumo[];
	};
	treinosInscritos: TreinoInscritoJudoca[];
	conquistas: ConquistaJudoca[];
	graduacoes: HistoricoAlunoItem[];
	proximosEventos: MetricasDojo['proximosEventos'];
	pendencias: PendenciaJudoca[];
}

export interface AniversarianteItem {
	id_usuario: number;
	nome: string;
	data_nascimento_br: string;
	dia_mes: string;
	idade_completando: number;
	dias_restantes: number; // 0 = hoje, 1 = amanhã, etc.
	perfis: string;
	faixa?: string | null;
}

export interface TurmaProfessorItem {
	id_treino: number;
	descricao: string;
	dia_semana: string;
	horario_inicio: string;
	horario_fim: string;
	total_alunos: number;
}

export interface AlunoTutelaItem {
	id_usuario: number;
	nome: string;
	matricula: string | null;
	graduacao_atual: string;
	peso: number | null;
	categoria: string | null;
	status_federacao: string | null;
	tem_turma: boolean;
	nome_professor_responsavel?: string | null;
}

export interface PendenciaCampeonatoAutorizacao {
	id_inscricao: number;
	id_evento: number;
	nome_campeonato: string;
	data_campeonato: string | null;
	id_aluno: number;
	nome_aluno: string;
	graduacao_atual: string;
	nome_professor_responsavel?: string | null;
}

export interface MudancaPesoItem {
	id_log: number;
	id_aluno: number;
	nome_aluno: string;
	graduacao_atual: string;
	peso_anterior: number | null;
	peso_novo: number | null;
	categoria_anterior: string | null;
	categoria_nova: string | null;
	data_alteracao: string;
	origem?: string;
	nome_professor_responsavel?: string | null;
}

export interface AlunoViradaTemporadaItem {
	id_usuario: number;
	nome: string;
	graduacao_atual: string;
	categoria_atual: string;
	categoria_esperada: string;
	classe_esperada: string;
}

export interface ViradaTemporadaInfo {
	anoVigente: number;
	totalDesatualizados: number;
	alunos: AlunoViradaTemporadaItem[];
}

export interface PendenciasTecnicasDojo {
	alunosSemPeso: AlunoTutelaItem[];
	alunosSemTurma: AlunoTutelaItem[];
	alunosFederacaoPendente: AlunoTutelaItem[];
	campeonatosPendentesAutorizacao: PendenciaCampeonatoAutorizacao[];
	mudancasRecentesPeso: MudancaPesoItem[];
	viradaTemporada: ViradaTemporadaInfo | null;
}

export interface PainelProfessorDados {
	professor: {
		id_usuario: number;
		nome: string;
		email: string;
		telefone: string | null;
		n_federacao: string | null;
		grau_faixa: string | null;
	};
	turmas: TurmaProfessorItem[];
	totalTurmas: number;
	totalAlunosSobTutela: number;
	totalAlunosTurmas: number;
	alunosSobTutela: AlunoTutelaItem[];
	pendenciasTecnicas: PendenciasTecnicasDojo;
	aniversariantes: AniversarianteItem[];
	proximosEventos: MetricasDojo['proximosEventos'];
}

export interface DependenteItemPainel {
	aluno: {
		id_usuario: number;
		nome: string;
		data_nascimento_br: string;
		idade: number;
		menor_idade: boolean;
		grau_parentesco: string;
		financeiro: boolean;
		matricula: string | null;
		graduacao_atual: string;
		peso: number | null;
		categoria: string | null;
		nome_professor_responsavel: string;
	};
	painelJudoca: PainelJudocaDados;
}

export interface PainelResponsavelDados {
	responsavel: {
		id_usuario: number;
		nome: string;
		email: string;
		telefone: string | null;
	};
	totalDependentes: number;
	totalTurmasAtivas: number;
	totalMedalhasFamilia: number;
	totalPendenciasFamilia: number;
	dependentes: DependenteItemPainel[];
	pendenciasTecnicas: PendenciasTecnicasDojo;
	proximosEventos: MetricasDojo['proximosEventos'];
}

function calcularDiferencaMeses(dataPassada: string | Date | null): number {
	if (!dataPassada) return 0;
	let d: Date;
	if (typeof dataPassada === 'string') {
		if (dataPassada.includes('/')) {
			const [dia, mes, ano] = dataPassada.split('/');
			d = new Date(Number(ano), Number(mes) - 1, Number(dia));
		} else {
			d = new Date(dataPassada);
		}
	} else {
		d = dataPassada;
	}
	if (isNaN(d.getTime())) return 0;
	const agora = new Date();
	const anos = agora.getFullYear() - d.getFullYear();
	const meses = agora.getMonth() - d.getMonth();
	const total = anos * 12 + meses;
	return total > 0 ? total : 0;
}

function formatarTempoExtenso(meses: number): string {
	if (meses <= 0) return 'Iniciando trajetória';
	const anos = Math.floor(meses / 12);
	const mesesRestantes = meses % 12;
	if (anos === 0) {
		return mesesRestantes === 1 ? '1 mês' : `${mesesRestantes} meses`;
	}
	const parteAnos = anos === 1 ? '1 ano' : `${anos} anos`;
	if (mesesRestantes === 0) return parteAnos;
	const parteMeses = mesesRestantes === 1 ? '1 mês' : `${mesesRestantes} meses`;
	return `${parteAnos} e ${parteMeses}`;
}

function formatarDataIsoParaBr(iso: string | null): string | null {
	if (!iso) return null;
	const [ano, mes, dia] = iso.split('-');
	return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}

function inferirTipoMedalha(classificacao: string): 'ouro' | 'prata' | 'bronze' | 'participacao' {
	const c = classificacao.toLowerCase();
	if (c.includes('ouro') || c.includes('1º') || c.includes('1°') || c.includes('campeão') || c.includes('campeao')) {
		return 'ouro';
	}
	if (c.includes('prata') || c.includes('2º') || c.includes('2°') || c.includes('vice')) {
		return 'prata';
	}
	if (c.includes('bronze') || c.includes('3º') || c.includes('3°') || c.includes('terceiro')) {
		return 'bronze';
	}
	return 'participacao';
}

/**
 * Consulta métricas consolidadas da academia para alimentar o painel do dojo.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório e filtra
 * rigorosamente todas as consultas com prepared statements.
 */
export async function obterMetricasDoDojo(idAcademia: number): Promise<MetricasDojo> {
	const pool = getDbPool();

	// 1. Total de Alunos no Tenant
	const sqlAlunos = `
		SELECT COUNT(DISTINCT a.id_usuario) AS total
		FROM Aluno a
		INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario
		WHERE ua.id_academia = ?
	`;
	const [linhasAlunos] = await pool.execute<RowDataPacket[]>(sqlAlunos, [idAcademia]);
	const totalAlunos = Number(linhasAlunos[0]?.total || 0);

	// 2. Total de Turmas no Tenant
	const sqlTurmas = `
		SELECT COUNT(*) AS total
		FROM Treino_Turma
		WHERE id_academia = ?
	`;
	const [linhasTurmas] = await pool.execute<RowDataPacket[]>(sqlTurmas, [idAcademia]);
	const totalTurmas = Number(linhasTurmas[0]?.total || 0);

	// 3. Total de Professores no Tenant
	const sqlProfessores = `
		SELECT COUNT(DISTINCT p.id_usuario) AS total
		FROM Professor p
		INNER JOIN Usuario_Academia ua ON p.id_usuario = ua.id_usuario
		WHERE ua.id_academia = ?
	`;
	const [linhasProfessores] = await pool.execute<RowDataPacket[]>(sqlProfessores, [idAcademia]);
	const totalProfessores = Number(linhasProfessores[0]?.total || 0);

	// 4. Total de Graduações registradas no Tenant
	const sqlGraduacoes = `
		SELECT COUNT(*) AS total
		FROM Historico_Graduacao hg
		INNER JOIN Evento e ON hg.id_evento_graduacao = e.id_evento
		WHERE e.id_academia = ?
	`;
	const [linhasGraduacoes] = await pool.execute<RowDataPacket[]>(sqlGraduacoes, [idAcademia]);
	const totalGraduacoes = Number(linhasGraduacoes[0]?.total || 0);

	// 5. Próximos Eventos cadastrados para o Tenant
	const sqlEventos = `
		SELECT 
			e.id_evento,
			e.nome,
			e.edicao,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_inicio,
			c.faixa_inicio,
			c.faixa_fim,
			c.limite_graduacao,
			c.limite_grupo,
			c.valor_inscricao,
			(c.id_evento IS NOT NULL) AS eh_campeonato
		FROM Evento e
		LEFT JOIN Campeonato c ON e.id_evento = c.id_evento
		WHERE e.id_academia = ?
		ORDER BY e.data_inicio ASC
		LIMIT 4
	`;
	const [linhasEventos] = await pool.execute<RowDataPacket[]>(sqlEventos, [idAcademia]);
	const proximosEventos = linhasEventos.map((linha) => ({
		id_evento: Number(linha.id_evento),
		nome: String(linha.nome),
		edicao: linha.edicao ? String(linha.edicao) : null,
		data_inicio: linha.data_inicio ? String(linha.data_inicio) : null,
		faixa_inicio: linha.faixa_inicio ? String(linha.faixa_inicio) : null,
		faixa_fim: linha.faixa_fim ? String(linha.faixa_fim) : null,
		limite_graduacao: linha.limite_graduacao ? String(linha.limite_graduacao) : null,
		limite_grupo: linha.limite_grupo ? String(linha.limite_grupo) : null,
		valor_inscricao: linha.valor_inscricao !== null && linha.valor_inscricao !== undefined ? Number(linha.valor_inscricao) : null,
		eh_campeonato: Boolean(linha.eh_campeonato)
	}));

	return {
		totalAlunos,
		totalTurmas,
		totalProfessores,
		totalGraduacoes,
		proximosEventos
	};
}

/**
 * Consulta agregada exclusiva para o Painel do Aluno / Judoca.
 * SEGURANÇA MULTI-TENANT: idAcademia e idUsuario são obrigatórios e parametrizados.
 */
export async function obterPainelJudoca(
	idAcademia: number,
	idUsuario: number
): Promise<PainelJudocaDados | null> {
	const pool = getDbPool();

	// 1. Dados cadastrais e técnicos do judoca
	const aluno = await buscarAlunoPorId(idAcademia, idUsuario);
	if (!aluno) return null;

	// 2. Linha do tempo imutável de graduações do judoca
	const graduacoes = await buscarHistoricoDoAluno(idAcademia, idUsuario);

	// Cálculo de permanência na faixa atual e tempo no judô
	let dataUltimaGraduacaoTexto: string | null = null;
	let mesesFaixaAtual = 0;
	if (graduacoes.length > 0) {
		const ultimaGrad = graduacoes[graduacoes.length - 1];
		dataUltimaGraduacaoTexto = ultimaGrad.data_graduacao;
		mesesFaixaAtual = calcularDiferencaMeses(ultimaGrad.data_graduacao);
	} else if (aluno.data_primeira_graduacao) {
		dataUltimaGraduacaoTexto = formatarDataIsoParaBr(aluno.data_primeira_graduacao);
		mesesFaixaAtual = calcularDiferencaMeses(aluno.data_primeira_graduacao);
	} else if (aluno.data_inicio) {
		dataUltimaGraduacaoTexto = formatarDataIsoParaBr(aluno.data_inicio);
		mesesFaixaAtual = calcularDiferencaMeses(aluno.data_inicio);
	}

	const mesesJudo = calcularDiferencaMeses(aluno.data_inicio);

	// 3. Treinos em que o atleta está matriculado (Aluno_Treino)
	const sqlTreinos = `
		SELECT 
			tt.id_treino,
			COALESCE(tt.descricao, 'Treino de Judô') AS descricao,
			COALESCE(tt.dia_semana, 'Segunda-feira') AS dia_semana,
			TIME_FORMAT(tt.horario_inicio, '%H:%i') AS horario_inicio,
			TIME_FORMAT(tt.horario_fim, '%H:%i') AS horario_fim,
			COALESCE(GROUP_CONCAT(DISTINCT u_prof.nome ORDER BY u_prof.nome SEPARATOR ', '), 'Sensei do Dojo') AS professores
		FROM Treino_Turma tt
		INNER JOIN Aluno_Treino at ON tt.id_treino = at.id_treino
		LEFT JOIN Professor_Treino pt ON tt.id_treino = pt.id_treino
		LEFT JOIN Professor p ON pt.id_professor = p.id_usuario
		LEFT JOIN Usuario u_prof ON p.id_usuario = u_prof.id_usuario
		WHERE tt.id_academia = ? AND at.id_aluno = ?
		GROUP BY tt.id_treino
		ORDER BY FIELD(tt.dia_semana, 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'), tt.horario_inicio ASC
	`;
	const [linhasTreinos] = await pool.execute<RowDataPacket[]>(sqlTreinos, [idAcademia, idUsuario]);
	const treinosInscritos: TreinoInscritoJudoca[] = linhasTreinos.map((linha) => ({
		id_treino: Number(linha.id_treino),
		descricao: String(linha.descricao),
		dia_semana: String(linha.dia_semana),
		horario_inicio: String(linha.horario_inicio),
		horario_fim: String(linha.horario_fim),
		professores: String(linha.professores)
	}));

	// 4. Histórico de Conquistas em Campeonatos (Classificacao)
	const sqlConquistas = `
		SELECT 
			cl.id_classificacao,
			cl.id_campeonato,
			e.nome AS nome_campeonato,
			e.edicao,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_evento,
			COALESCE(cl.classificacao_aluno, 'Participação') AS classificacao,
			COALESCE(cl.qtd_lutas, 0) AS qtd_lutas,
			COALESCE(cl.qtd_vitorias, 0) AS qtd_vitorias
		FROM Classificacao cl
		INNER JOIN Campeonato c ON cl.id_campeonato = c.id_evento
		INNER JOIN Evento e ON c.id_evento = e.id_evento
		WHERE e.id_academia = ? AND cl.id_aluno = ?
		ORDER BY e.data_inicio DESC, cl.id_classificacao DESC
	`;
	const [linhasConquistas] = await pool.execute<RowDataPacket[]>(sqlConquistas, [idAcademia, idUsuario]);

	let totalOuro = 0;
	let totalPrata = 0;
	let totalBronze = 0;
	let totalLutas = 0;
	let totalVitorias = 0;

	const conquistas: ConquistaJudoca[] = linhasConquistas.map((linha) => {
		const classificacao = String(linha.classificacao);
		const tipoMedalha = inferirTipoMedalha(classificacao);
		if (tipoMedalha === 'ouro') totalOuro++;
		else if (tipoMedalha === 'prata') totalPrata++;
		else if (tipoMedalha === 'bronze') totalBronze++;

		const lutas = Number(linha.qtd_lutas || 0);
		const vitorias = Number(linha.qtd_vitorias || 0);
		totalLutas += lutas;
		totalVitorias += vitorias;

		return {
			id_classificacao: Number(linha.id_classificacao),
			id_campeonato: Number(linha.id_campeonato),
			nome_campeonato: String(linha.nome_campeonato),
			edicao: linha.edicao ? String(linha.edicao) : null,
			data_evento: String(linha.data_evento),
			classificacao,
			qtd_lutas: lutas,
			qtd_vitorias: vitorias,
			tipo_medalha: tipoMedalha
		};
	});

	// Total de campeonatos participados (inscrições confirmadas ou classificações)
	const sqlTotalCampeonatos = `
		SELECT COUNT(DISTINCT id_campeonato) AS total FROM (
			SELECT ie.id_evento AS id_campeonato
			FROM Inscricao_Evento ie
			INNER JOIN Campeonato c ON ie.id_evento = c.id_evento
			INNER JOIN Evento e ON c.id_evento = e.id_evento
			WHERE e.id_academia = ? AND ie.id_aluno = ?
			UNION
			SELECT cl.id_campeonato
			FROM Classificacao cl
			INNER JOIN Evento e ON cl.id_campeonato = e.id_evento
			WHERE e.id_academia = ? AND cl.id_aluno = ?
		) AS c_part
	`;
	const [linhasTotalCamp] = await pool.execute<RowDataPacket[]>(sqlTotalCampeonatos, [idAcademia, idUsuario, idAcademia, idUsuario]);
	const totalCampeonatos = Number(linhasTotalCamp[0]?.total || 0);

	// 5. Métricas Gerais da Academia (Dojo)
	const metricasDojoGeral = await obterMetricasDoDojo(idAcademia);

	// Total de medalhas conquistadas por todos os alunos do dojo
	const sqlMedalhasDojo = `
		SELECT COUNT(*) AS total
		FROM Classificacao cl
		INNER JOIN Evento e ON cl.id_campeonato = e.id_evento
		WHERE e.id_academia = ? AND (
			cl.classificacao_aluno LIKE '%Ouro%' OR 
			cl.classificacao_aluno LIKE '%Prata%' OR 
			cl.classificacao_aluno LIKE '%Bronze%' OR 
			cl.classificacao_aluno LIKE '%Campeão%' OR 
			cl.classificacao_aluno LIKE '%Campeao%' OR 
			cl.classificacao_aluno LIKE '%1º%' OR 
			cl.classificacao_aluno LIKE '%1°%' OR 
			cl.classificacao_aluno LIKE '%2º%' OR 
			cl.classificacao_aluno LIKE '%2°%' OR 
			cl.classificacao_aluno LIKE '%3º%' OR 
			cl.classificacao_aluno LIKE '%3°%'
		)
	`;
	const [linhasMedalhasDojo] = await pool.execute<RowDataPacket[]>(sqlMedalhasDojo, [idAcademia]);
	const totalMedalhasAlunos = Number(linhasMedalhasDojo[0]?.total || 0);

	// Total de troféus/campeonatos cadastrados no dojo
	const sqlTrofeus = `
		SELECT COUNT(*) AS total
		FROM Campeonato c
		INNER JOIN Evento e ON c.id_evento = e.id_evento
		WHERE e.id_academia = ?
	`;
	const [linhasTrofeus] = await pool.execute<RowDataPacket[]>(sqlTrofeus, [idAcademia]);
	const totalTrofeusCampeonatos = Number(linhasTrofeus[0]?.total || 0);

	// Quadro de Senseis / Professores do Dojo
	const sqlSenseis = `
		SELECT 
			p.id_usuario,
			u.nome,
			COALESCE(p.grau_faixa, 'Faixa Preta') AS grau_faixa,
			u.email
		FROM Professor p
		INNER JOIN Usuario u ON p.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		WHERE ua.id_academia = ?
		ORDER BY u.nome ASC
	`;
	const [linhasSenseis] = await pool.execute<RowDataPacket[]>(sqlSenseis, [idAcademia]);
	const senseis: SenseiResumo[] = linhasSenseis.map((linha) => ({
		id_usuario: Number(linha.id_usuario),
		nome: String(linha.nome),
		grau_faixa: linha.grau_faixa ? String(linha.grau_faixa) : null,
		email: String(linha.email)
	}));

	// 6. Levantamento de Pendências que Dependem da Ação do Próprio Judoca
	const pendencias: PendenciaJudoca[] = [];

	// A) Campeonatos com inscrição aguardando confirmação do atleta
	const sqlCampConfirmar = `
		SELECT 
			ie.id_inscricao,
			ie.id_evento,
			e.nome AS nome_campeonato,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_evento
		FROM Inscricao_Evento ie
		INNER JOIN Campeonato c ON ie.id_evento = c.id_evento
		INNER JOIN Evento e ON c.id_evento = e.id_evento
		WHERE e.id_academia = ? 
		  AND ie.id_aluno = ? 
		  AND COALESCE(ie.confirmado_atleta, 0) = 0
		  AND ie.status_inscricao != 'Cancelada'
		  AND e.data_inicio >= CURDATE()
		ORDER BY e.data_inicio ASC
	`;
	const [linhasCampConfirmar] = await pool.execute<RowDataPacket[]>(sqlCampConfirmar, [idAcademia, idUsuario]);
	for (const cc of linhasCampConfirmar) {
		pendencias.push({
			id: `camp-confirmar-${cc.id_inscricao}`,
			tipo: 'confirmacao_campeonato',
			gravidade: 'alta',
			dependeDoAluno: true,
			prazo: cc.data_evento,
			idInscricao: Number(cc.id_inscricao),
			idEvento: Number(cc.id_evento),
			titulo: `Confirmar Participação: ${cc.nome_campeonato}`,
			descricao: `Sua inscrição no torneio de ${cc.data_evento} aguarda sua confirmação como atleta participante para garantir sua vaga na chave de lutas.`,
			textoBotao: 'Confirmar Presença',
			href: `/dashboard/campeonatos/${cc.id_evento}`,
			badge: 'Ação do Atleta'
		});
	}

	// A2) Campeonatos com inscrição aguardando autorização do responsável legal (quando menor)
	const sqlCampResp = `
		SELECT 
			ie.id_inscricao,
			ie.id_evento,
			e.nome AS nome_campeonato,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_evento
		FROM Inscricao_Evento ie
		INNER JOIN Campeonato c ON ie.id_evento = c.id_evento
		INNER JOIN Evento e ON c.id_evento = e.id_evento
		INNER JOIN Usuario u ON ie.id_aluno = u.id_usuario
		WHERE e.id_academia = ? 
		  AND ie.id_aluno = ? 
		  AND COALESCE(ie.confirmado_responsavel, 0) = 0
		  AND ie.status_inscricao != 'Cancelada'
		  AND e.data_inicio >= CURDATE()
		  AND TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) < 18
		ORDER BY e.data_inicio ASC
	`;
	const [linhasCampResp] = await pool.execute<RowDataPacket[]>(sqlCampResp, [idAcademia, idUsuario]);
	for (const cr of linhasCampResp) {
		pendencias.push({
			id: `camp-resp-${cr.id_inscricao}`,
			tipo: 'confirmacao_campeonato',
			gravidade: 'alta',
			dependeDoAluno: true,
			prazo: cr.data_evento,
			idInscricao: Number(cr.id_inscricao),
			idEvento: Number(cr.id_evento),
			titulo: `Autorização de Campeonato: ${cr.nome_campeonato}`,
			descricao: `Inscrição no torneio de ${cr.data_evento} aguarda autorização expressa do responsável legal para inclusão na chave de lutas.`,
			textoBotao: 'Autorizar Participação',
			href: `/dashboard/campeonatos/${cr.id_evento}`,
			badge: 'Autorização Familiar'
		});
	}

	// B) Exames de Graduação abertos onde o judoca é elegível e ainda não se inscreveu
	const sqlExamesAbertos = `
		SELECT 
			ge.id_evento,
			e.nome AS nome_evento,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_evento,
			DATE_FORMAT(ge.data_fim_inscricao, '%d/%m/%Y') AS data_fim_inscricao,
			ge.faixa_inicio,
			ge.faixa_fim,
			ge.taxa_graduacao,
			ge.tempo_minimo_judo_meses,
			ge.tempo_minimo_ultima_graduacao_meses,
			DATE_FORMAT(e.data_inicio, '%Y-%m-%d') AS data_inicio_iso
		FROM Graduacao_Evento ge
		INNER JOIN Evento e ON ge.id_evento = e.id_evento
		WHERE e.id_academia = ?
		  AND ge.status = 'Agendado'
		  AND (ge.data_fim_inscricao IS NULL OR ge.data_fim_inscricao >= CURDATE())
		  AND NOT EXISTS (
			  SELECT 1 FROM Inscricao_Evento ie WHERE ie.id_evento = ge.id_evento AND ie.id_aluno = ?
		  )
		ORDER BY e.data_inicio ASC
		LIMIT 1
	`;
	const [linhasExames] = await pool.execute<RowDataPacket[]>(sqlExamesAbertos, [idAcademia, idUsuario]);
	for (const ex of linhasExames) {
		const checagem = validarElegibilidadeGraduacao({
			faixaAtleta: aluno.graduacao_atual,
			faixaInicioEvento: String(ex.faixa_inicio || 'Branca'),
			faixaFimEvento: String(ex.faixa_fim || 'Marrom'),
			dataInicioJudoAtleta: aluno.data_inicio,
			dataUltimaGraduacaoAtleta: dataUltimaGraduacaoTexto,
			dataPrimeiraGraduacaoAtleta: aluno.data_primeira_graduacao,
			tempoMinimoJudoMeses: Number(ex.tempo_minimo_judo_meses || 0),
			tempoMinimoUltimaGraduacaoMeses: Number(ex.tempo_minimo_ultima_graduacao_meses || 0),
			dataEventoIso: String(ex.data_inicio_iso)
		});

		if (checagem.elegivel) {
			pendencias.push({
				id: `exame-elegivel-${ex.id_evento}`,
				tipo: 'exame_elegivel',
				gravidade: 'alta',
				dependeDoAluno: true,
				prazo: ex.data_fim_inscricao,
				idEvento: Number(ex.id_evento),
				titulo: `Você está Apto para o ${ex.nome_evento}!`,
				descricao: `Você atingiu os critérios de tempo e carência técnica para promoção de faixa. O prazo de inscrições encerra em ${ex.data_fim_inscricao || 'breve'}.`,
				textoBotao: 'Inscrever-se no Exame',
				href: `/dashboard/graduacoes/${ex.id_evento}`,
				badge: 'Apto para Promoção'
			});
		}
	}

	// C) Judoca sem turma semanal cadastrada
	if (treinosInscritos.length === 0) {
		pendencias.push({
			id: 'sem-turma-alocado',
			tipo: 'sem_turma',
			gravidade: 'media',
			dependeDoAluno: true,
			titulo: 'Você ainda não está alocado a uma Turma Semanal',
			descricao: 'Consulte a grade de treinos e horários disponíveis do dojo para alinhar seus dias de treino com o Sensei.',
			textoBotao: 'Ver Grade de Treinos',
			href: '/dashboard/turmas',
			badge: 'Grade de Treinos'
		});
	}

	// D) Pesagem oficial do judoca não informada
	if (aluno.peso === null) {
		pendencias.push({
			id: 'peso-categoria-pendente',
			tipo: 'peso_categoria',
			gravidade: 'media',
			dependeDoAluno: true,
			titulo: 'Pesagem Oficial Pendente',
			descricao: 'Mantenha seu peso corporal atualizado no seu perfil para validação de categoria e agilidade em competições.',
			textoBotao: 'Atualizar no Meu Perfil',
			href: '/dashboard/perfil',
			badge: 'Meu Perfil'
		});
	}

	// Ordena pendências: as que dependem de ação direta do aluno vêm sempre primeiro
	pendencias.sort((a, b) => {
		if (a.dependeDoAluno && !b.dependeDoAluno) return -1;
		if (!a.dependeDoAluno && b.dependeDoAluno) return 1;
		if (a.gravidade === 'alta' && b.gravidade !== 'alta') return -1;
		if (a.gravidade !== 'alta' && b.gravidade === 'alta') return 1;
		return 0;
	});

	return {
		judoca: {
			id_usuario: aluno.id_usuario,
			nome: aluno.nome,
			email: aluno.email,
			telefone: aluno.telefone,
			matricula: aluno.matricula,
			graduacao_atual: aluno.graduacao_atual,
			peso: aluno.peso,
			categoria: aluno.categoria,
			data_inicio: aluno.data_inicio,
			data_inicio_br: formatarDataIsoParaBr(aluno.data_inicio),
			data_primeira_graduacao: aluno.data_primeira_graduacao,
			data_primeira_graduacao_br: formatarDataIsoParaBr(aluno.data_primeira_graduacao),
			nome_professor_responsavel: aluno.nome_professor_responsavel,
			tempo_faixa_atual: formatarTempoExtenso(mesesFaixaAtual),
			tempo_judo: formatarTempoExtenso(mesesJudo),
			data_ultima_graduacao_br: dataUltimaGraduacaoTexto
		},
		metricasJudoca: {
			totalTreinosInscritos: treinosInscritos.length,
			totalCampeonatos,
			totalMedalhas: totalOuro + totalPrata + totalBronze,
			totalOuro,
			totalPrata,
			totalBronze,
			totalLutas,
			totalVitorias
		},
		metricasAcademia: {
			totalAlunos: metricasDojoGeral.totalAlunos,
			totalTreinosDisponiveis: metricasDojoGeral.totalTurmas,
			totalProfessores: metricasDojoGeral.totalProfessores,
			totalTrofeusCampeonatos,
			totalMedalhasAlunos,
			senseis
		},
		treinosInscritos,
		conquistas,
		graduacoes,
		proximosEventos: metricasDojoGeral.proximosEventos,
		pendencias
	};
}

/**
 * Retorna contagem rápida de pendências que requerem ação do próprio aluno
 * para uso em layouts, menus e indicadores de atenção.
 */
export async function contarPendenciasAcaoAluno(
	idAcademia: number,
	idUsuario: number
): Promise<number> {
	const pool = getDbPool();

	// 1. Campeonatos aguardando confirmação do atleta
	const sqlCamp = `
		SELECT COUNT(*) AS total
		FROM Inscricao_Evento ie
		INNER JOIN Campeonato c ON ie.id_evento = c.id_evento
		INNER JOIN Evento e ON c.id_evento = e.id_evento
		WHERE e.id_academia = ? 
		  AND ie.id_aluno = ? 
		  AND COALESCE(ie.confirmado_atleta, 0) = 0
		  AND ie.status_inscricao != 'Cancelada'
		  AND e.data_inicio >= CURDATE()
	`;
	const [rowsCamp] = await pool.execute<RowDataPacket[]>(sqlCamp, [idAcademia, idUsuario]);
	const totalCamp = Number(rowsCamp[0]?.total || 0);

	// 2. Aluno sem nenhuma turma semanal
	const sqlTreinos = `SELECT COUNT(*) AS total FROM Aluno_Treino WHERE id_aluno = ?`;
	const [rowsTreinos] = await pool.execute<RowDataPacket[]>(sqlTreinos, [idUsuario]);
	const semTurma = Number(rowsTreinos[0]?.total || 0) === 0 ? 1 : 0;

	// 3. Aluno com pesagem pendente
	const sqlPeso = `SELECT peso FROM Aluno WHERE id_usuario = ? LIMIT 1`;
	const [rowsPeso] = await pool.execute<RowDataPacket[]>(sqlPeso, [idUsuario]);
	const semPeso = rowsPeso.length > 0 && rowsPeso[0]?.peso === null ? 1 : 0;

	return totalCamp + semTurma + semPeso;
}

/**
 * Consulta e formata os aniversariantes da academia nos próximos 7 dias.
 * Apenas utiliza dados existentes da tabela Usuario (data_nascimento).
 */
export async function obterAniversariantesDaSemana(
	idAcademia: number
): Promise<AniversarianteItem[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.data_nascimento,
			al.graduacao_atual,
			GROUP_CONCAT(DISTINCT p.role SEPARATOR ', ') AS perfis
		FROM Usuario u
		INNER JOIN Usuario_Academia ua ON ua.id_usuario = u.id_usuario
		LEFT JOIN Usuario_Academia_Perfil uap ON uap.id_usuario = u.id_usuario AND uap.id_academia = ua.id_academia
		LEFT JOIN Perfil p ON p.id_perfil = uap.id_perfil
		LEFT JOIN Aluno al ON al.id_usuario = u.id_usuario
		WHERE ua.id_academia = ?
		GROUP BY u.id_usuario, u.nome, u.data_nascimento, al.graduacao_atual
	`;
	const [rows] = await pool.execute<RowDataPacket[]>(sql, [idAcademia]);

	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);
	const anoAtual = hoje.getFullYear();

	const aniversariantes: AniversarianteItem[] = [];

	for (const row of rows) {
		if (!row.data_nascimento) continue;
		const nasc = new Date(row.data_nascimento);
		if (isNaN(nasc.getTime())) continue;

		const mesNasc = nasc.getUTCMonth();
		const diaNasc = nasc.getUTCDate();

		// Data de aniversário no ano atual
		let dataAniv = new Date(anoAtual, mesNasc, diaNasc);
		dataAniv.setHours(0, 0, 0, 0);

		// Se já passou este ano e estamos perto do fim do ano, checar ano que vem
		if (dataAniv.getTime() < hoje.getTime()) {
			dataAniv = new Date(anoAtual + 1, mesNasc, diaNasc);
			dataAniv.setHours(0, 0, 0, 0);
		}

		const diffTime = dataAniv.getTime() - hoje.getTime();
		const diffDias = Math.round(diffTime / (1000 * 60 * 60 * 24));

		if (diffDias >= 0 && diffDias <= 7) {
			const anoNasc = nasc.getUTCFullYear();
			const idadeCompletando = dataAniv.getFullYear() - anoNasc;

			const diaStr = String(diaNasc).padStart(2, '0');
			const mesStr = String(mesNasc + 1).padStart(2, '0');

			aniversariantes.push({
				id_usuario: row.id_usuario,
				nome: row.nome,
				data_nascimento_br: `${diaStr}/${mesStr}/${anoNasc}`,
				dia_mes: `${diaStr}/${mesStr}`,
				idade_completando: idadeCompletando,
				dias_restantes: diffDias,
				perfis: row.perfis || 'Usuário',
				faixa: row.graduacao_atual || null
			});
		}
	}

	aniversariantes.sort((a, b) => a.dias_restantes - b.dias_restantes);
	return aniversariantes;
}

/**
 * Monta os dados consolidados do painel do Sensei / Professor
 * baseado 100% no banco de dados existente.
 */
export async function obterPainelProfessor(
	idAcademia: number,
	idUsuarioProfessor: number
): Promise<PainelProfessorDados | null> {
	const pool = getDbPool();

	// 1. Dados cadastrais e marciais do professor
	const sqlProf = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.email,
			u.telefone,
			p.n_federacao,
			p.grau_faixa
		FROM Professor p
		INNER JOIN Usuario u ON u.id_usuario = p.id_usuario
		INNER JOIN Usuario_Academia ua ON ua.id_usuario = u.id_usuario
		WHERE p.id_usuario = ? AND ua.id_academia = ?
		LIMIT 1
	`;
	const [rowsProf] = await pool.execute<RowDataPacket[]>(sqlProf, [idUsuarioProfessor, idAcademia]);
	if (rowsProf.length === 0) return null;

	const prof = rowsProf[0];

	// 2. Turmas ministradas pelo professor
	const sqlTurmas = `
		SELECT 
			tt.id_treino,
			tt.descricao,
			tt.dia_semana,
			TIME_FORMAT(tt.horario_inicio, '%H:%i') AS horario_inicio,
			TIME_FORMAT(tt.horario_fim, '%H:%i') AS horario_fim,
			(SELECT COUNT(*) FROM Aluno_Treino at WHERE at.id_treino = tt.id_treino) AS total_alunos
		FROM Professor_Treino pt
		INNER JOIN Treino_Turma tt ON tt.id_treino = pt.id_treino
		WHERE pt.id_professor = ? AND tt.id_academia = ?
		ORDER BY 
			FIELD(tt.dia_semana, 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'),
			tt.horario_inicio ASC
	`;
	const [rowsTurmas] = await pool.execute<RowDataPacket[]>(sqlTurmas, [idUsuarioProfessor, idAcademia]);
	const turmas: TurmaProfessorItem[] = rowsTurmas.map((t) => ({
		id_treino: t.id_treino,
		descricao: t.descricao,
		dia_semana: t.dia_semana,
		horario_inicio: t.horario_inicio || '',
		horario_fim: t.horario_fim || '',
		total_alunos: Number(t.total_alunos || 0)
	}));

	// 3. Alunos sob tutela técnica direta do professor
	const sqlAlunos = `
		SELECT 
			u.id_usuario,
			u.nome,
			a.matricula,
			a.graduacao_atual,
			a.peso,
			a.categoria,
			a.status_federacao,
			EXISTS(SELECT 1 FROM Aluno_Treino at_sub WHERE at_sub.id_aluno = a.id_usuario) AS tem_turma
		FROM Aluno a
		INNER JOIN Usuario u ON u.id_usuario = a.id_usuario
		INNER JOIN Usuario_Academia ua ON ua.id_usuario = u.id_usuario
		WHERE a.id_professor_responsavel = ? AND ua.id_academia = ?
		ORDER BY u.nome ASC
	`;
	const [rowsAlunos] = await pool.execute<RowDataPacket[]>(sqlAlunos, [idUsuarioProfessor, idAcademia]);
	const alunosSobTutela: AlunoTutelaItem[] = rowsAlunos.map((a) => ({
		id_usuario: a.id_usuario,
		nome: a.nome,
		matricula: a.matricula,
		graduacao_atual: a.graduacao_atual,
		peso: a.peso !== null ? Number(a.peso) : null,
		categoria: a.categoria,
		status_federacao: a.status_federacao,
		tem_turma: Boolean(a.tem_turma)
	}));

	// 4. Pendências técnicas da tutela
	const pendenciasTecnicas = await obterPendenciasTecnicasDojo(idAcademia, idUsuarioProfessor);

	// 5. Total de alunos distintos nas turmas ministradas
	const sqlTotalAlunosTurmas = `
		SELECT COUNT(DISTINCT at.id_aluno) AS total
		FROM Professor_Treino pt
		INNER JOIN Aluno_Treino at ON at.id_treino = pt.id_treino
		INNER JOIN Treino_Turma tt ON tt.id_treino = pt.id_treino
		WHERE pt.id_professor = ? AND tt.id_academia = ?
	`;
	const [rowsTotalAlunosTurmas] = await pool.execute<RowDataPacket[]>(sqlTotalAlunosTurmas, [
		idUsuarioProfessor,
		idAcademia
	]);
	const totalAlunosTurmas = Number(rowsTotalAlunosTurmas[0]?.total || 0);

	// 6. Aniversariantes da semana
	const aniversariantes = await obterAniversariantesDaSemana(idAcademia);

	// 7. Próximos eventos gerais
	const metricasGerais = await obterMetricasDoDojo(idAcademia);

	return {
		professor: {
			id_usuario: prof.id_usuario,
			nome: prof.nome,
			email: prof.email,
			telefone: prof.telefone,
			n_federacao: prof.n_federacao,
			grau_faixa: prof.grau_faixa
		},
		turmas,
		totalTurmas: turmas.length,
		totalAlunosSobTutela: alunosSobTutela.length,
		totalAlunosTurmas,
		alunosSobTutela,
		pendenciasTecnicas,
		aniversariantes,
		proximosEventos: metricasGerais.proximosEventos
	};
}

/**
 * Retorna as pendências técnicas de conformidade dos alunos (pesagem, alocação em turmas e federação).
 * Pode ser filtrado por professor responsável (visão do sensei) ou abranger todo o dojo (visão admin/recepção).
 */
export async function obterPendenciasTecnicasDojo(
	idAcademia: number,
	idProfessorResponsavel?: number | null,
	idResponsavel?: number | null
): Promise<PendenciasTecnicasDojo> {
	const pool = getDbPool();
	let sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.genero,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			a.matricula,
			a.graduacao_atual,
			a.peso,
			a.categoria,
			a.status_federacao,
			prof_u.nome AS nome_professor_responsavel,
			EXISTS(SELECT 1 FROM Aluno_Treino at_sub WHERE at_sub.id_aluno = a.id_usuario) AS tem_turma
		FROM Aluno a
		INNER JOIN Usuario u ON u.id_usuario = a.id_usuario
		INNER JOIN Usuario_Academia ua ON ua.id_usuario = u.id_usuario
		LEFT JOIN Professor p ON p.id_usuario = a.id_professor_responsavel
		LEFT JOIN Usuario prof_u ON prof_u.id_usuario = p.id_usuario
	`;
	const params: any[] = [];

	if (idResponsavel) {
		sql += ` INNER JOIN Responsavel_Aluno ra ON ra.id_aluno = a.id_usuario`;
	}

	sql += ` WHERE ua.id_academia = ?`;
	params.push(idAcademia);

	if (idProfessorResponsavel) {
		sql += ` AND a.id_professor_responsavel = ?`;
		params.push(idProfessorResponsavel);
	}

	if (idResponsavel) {
		sql += ` AND ra.id_responsavel = ?`;
		params.push(idResponsavel);
	}

	sql += ` ORDER BY u.nome ASC`;

	const [rowsAlunos] = await pool.execute<RowDataPacket[]>(sql, params);
	const alunos: AlunoTutelaItem[] = rowsAlunos.map((a) => ({
		id_usuario: Number(a.id_usuario),
		nome: String(a.nome),
		matricula: a.matricula ? String(a.matricula) : null,
		graduacao_atual: a.graduacao_atual ? String(a.graduacao_atual) : 'Branca',
		peso: a.peso !== null ? Number(a.peso) : null,
		categoria: a.categoria ? String(a.categoria) : null,
		status_federacao: a.status_federacao ? String(a.status_federacao) : null,
		tem_turma: Boolean(a.tem_turma),
		nome_professor_responsavel: a.nome_professor_responsavel ? String(a.nome_professor_responsavel) : null
	}));

	// 2. Alerta de Virada de Temporada / Transição de Idade Civil (ex: 2026 -> 2027)
	const anoAtual = new Date().getFullYear();
	const alunosViradaTemporada: AlunoViradaTemporadaItem[] = [];

	for (const a of rowsAlunos) {
		if (!a.data_nascimento) continue;
		const classifEsperada = obterClassificacaoJudo({
			dataNascimento: String(a.data_nascimento),
			genero: a.genero === 'F' ? 'F' : 'M',
			peso: a.peso !== null ? Number(a.peso) : null,
			graduacao: a.graduacao_atual ? String(a.graduacao_atual) : 'Branca',
			anoVigente: anoAtual
		});

		// Se a categoria gravada difere da esperada para o ano vigente (especialmente classe de idade)
		if (a.categoria && a.categoria !== classifEsperada.categoriaCompleta) {
			alunosViradaTemporada.push({
				id_usuario: Number(a.id_usuario),
				nome: String(a.nome),
				graduacao_atual: String(a.graduacao_atual || 'Branca'),
				categoria_atual: String(a.categoria),
				categoria_esperada: classifEsperada.categoriaCompleta,
				classe_esperada: classifEsperada.classeCodigo
			});
		}
	}

	// 3. Campeonatos com inscrição de menores aguardando autorização do responsável legal
	let sqlCamp = `
		SELECT 
			ie.id_inscricao,
			ie.id_evento,
			e.nome AS nome_campeonato,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_campeonato,
			a.id_usuario AS id_aluno,
			u.nome AS nome_aluno,
			COALESCE(a.graduacao_atual, 'Branca') AS graduacao_atual,
			prof_u.nome AS nome_professor_responsavel
		FROM Inscricao_Evento ie
		INNER JOIN Evento e ON ie.id_evento = e.id_evento
		INNER JOIN Campeonato c ON e.id_evento = c.id_evento
		INNER JOIN Aluno a ON ie.id_aluno = a.id_usuario
		INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		LEFT JOIN Professor p ON p.id_usuario = a.id_professor_responsavel
		LEFT JOIN Usuario prof_u ON prof_u.id_usuario = p.id_usuario
	`;
	const paramsCamp: any[] = [];

	if (idResponsavel) {
		sqlCamp += ` INNER JOIN Responsavel_Aluno ra ON ra.id_aluno = a.id_usuario`;
	}

	sqlCamp += ` WHERE e.id_academia = ? AND ua.id_academia = ?`;
	paramsCamp.push(idAcademia, idAcademia);

	sqlCamp += ` AND COALESCE(ie.confirmado_responsavel, 0) = 0`;
	sqlCamp += ` AND ie.status_inscricao != 'Cancelada'`;
	sqlCamp += ` AND e.data_inicio >= CURDATE()`;
	sqlCamp += ` AND TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) < 18`;

	if (idProfessorResponsavel) {
		sqlCamp += ` AND a.id_professor_responsavel = ?`;
		paramsCamp.push(idProfessorResponsavel);
	}

	if (idResponsavel) {
		sqlCamp += ` AND ra.id_responsavel = ?`;
		paramsCamp.push(idResponsavel);
	}

	sqlCamp += ` ORDER BY e.data_inicio ASC, u.nome ASC`;

	const [rowsCamp] = await pool.execute<RowDataPacket[]>(sqlCamp, paramsCamp);
	const campeonatosPendentesAutorizacao: PendenciaCampeonatoAutorizacao[] = rowsCamp.map((r) => ({
		id_inscricao: Number(r.id_inscricao),
		id_evento: Number(r.id_evento),
		nome_campeonato: String(r.nome_campeonato),
		data_campeonato: r.data_campeonato ? String(r.data_campeonato) : null,
		id_aluno: Number(r.id_aluno),
		nome_aluno: String(r.nome_aluno),
		graduacao_atual: String(r.graduacao_atual),
		nome_professor_responsavel: r.nome_professor_responsavel ? String(r.nome_professor_responsavel) : null
	}));

	// 4. Alerta de Mudança Recente de Peso / Categoria (últimos 30 dias)
	let sqlLogs = `
		SELECT 
			l.id_log,
			l.id_entidade AS id_aluno,
			l.dados_antes,
			l.dados_depois,
			DATE_FORMAT(l.criado_em, '%d/%m/%Y às %H:%i') AS data_alteracao,
			u.nome AS nome_aluno,
			COALESCE(a.graduacao_atual, 'Branca') AS graduacao_atual,
			prof_u.nome AS nome_professor_responsavel
		FROM Log_Auditoria l
		INNER JOIN Aluno a ON a.id_usuario = CAST(l.id_entidade AS UNSIGNED)
		INNER JOIN Usuario u ON u.id_usuario = a.id_usuario
		INNER JOIN Usuario_Academia ua ON ua.id_usuario = u.id_usuario
		LEFT JOIN Professor p ON p.id_usuario = a.id_professor_responsavel
		LEFT JOIN Usuario prof_u ON prof_u.id_usuario = p.id_usuario
		WHERE l.id_academia = ? AND ua.id_academia = ? AND l.acao = 'MUDANCA_PESO_CATEGORIA'
		  AND l.criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY)
	`;
	const paramsLogs: any[] = [idAcademia, idAcademia];

	if (idProfessorResponsavel) {
		sqlLogs += ` AND a.id_professor_responsavel = ?`;
		paramsLogs.push(idProfessorResponsavel);
	}

	if (idResponsavel) {
		sqlLogs += ` AND EXISTS (SELECT 1 FROM Responsavel_Aluno ra_sub WHERE ra_sub.id_aluno = a.id_usuario AND ra_sub.id_responsavel = ?)`;
		paramsLogs.push(idResponsavel);
	}

	sqlLogs += ` ORDER BY l.criado_em DESC LIMIT 10`;

	const [rowsLogs] = await pool.execute<RowDataPacket[]>(sqlLogs, paramsLogs);
	const mudancasRecentesPeso: MudancaPesoItem[] = rowsLogs.map((r) => {
		let antes: any = {};
		let depois: any = {};
		try {
			antes = typeof r.dados_antes === 'string' ? JSON.parse(r.dados_antes) : r.dados_antes || {};
			depois = typeof r.dados_depois === 'string' ? JSON.parse(r.dados_depois) : r.dados_depois || {};
		} catch {}

		return {
			id_log: Number(r.id_log),
			id_aluno: Number(r.id_aluno),
			nome_aluno: String(r.nome_aluno),
			graduacao_atual: String(r.graduacao_atual),
			peso_anterior: antes.peso !== undefined && antes.peso !== null ? Number(antes.peso) : null,
			peso_novo: depois.peso !== undefined && depois.peso !== null ? Number(depois.peso) : null,
			categoria_anterior: antes.categoria || null,
			categoria_nova: depois.categoria || null,
			data_alteracao: String(r.data_alteracao),
			origem: depois.origem || 'Perfil / Balança',
			nome_professor_responsavel: r.nome_professor_responsavel ? String(r.nome_professor_responsavel) : null
		};
	});

	return {
		alunosSemPeso: alunos.filter((a) => a.peso === null),
		alunosSemTurma: alunos.filter((a) => !a.tem_turma),
		alunosFederacaoPendente: alunos.filter(
			(a) => a.status_federacao && a.status_federacao.trim().toLowerCase() === 'pendente'
		),
		campeonatosPendentesAutorizacao,
		mudancasRecentesPeso,
		viradaTemporada: alunosViradaTemporada.length > 0 ? {
			anoVigente: anoAtual,
			totalDesatualizados: alunosViradaTemporada.length,
			alunos: alunosViradaTemporada
		} : null
	};
}

/**
 * Consulta agregada exclusiva para o Painel do Responsável Legal.
 * Traz todos os judocas tutelados pelo responsável e seus respectivos painéis individuais,
 * consolidados com métricas familiares de turmas, medalhas e pendências.
 */
export async function obterPainelResponsavel(
	idAcademia: number,
	idUsuarioResponsavel: number
): Promise<PainelResponsavelDados | null> {
	const pool = getDbPool();

	// 1. Dados do Responsável
	const sqlResp = `
		SELECT u.id_usuario, u.nome, u.email, u.telefone
		FROM Usuario u
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		WHERE u.id_usuario = ? AND ua.id_academia = ?
	`;
	const [linhasResp] = await pool.execute<RowDataPacket[]>(sqlResp, [
		idUsuarioResponsavel,
		idAcademia
	]);
	if (linhasResp.length === 0) return null;
	const resp = linhasResp[0];

	// 2. Judocas/Dependentes vinculados na academia
	const sqlAlunos = `
		SELECT 
			ra.id_aluno,
			u_aluno.nome,
			DATE_FORMAT(u_aluno.data_nascimento, '%d/%m/%Y') AS data_nascimento_br,
			TIMESTAMPDIFF(YEAR, u_aluno.data_nascimento, CURDATE()) AS idade,
			COALESCE(ra.grau_parentesco, r.grau_parentesco, 'Responsável Legal') AS grau_parentesco,
			COALESCE(ra.financeiro, 0) AS financeiro
		FROM Responsavel_Aluno ra
		LEFT JOIN Responsavel r ON ra.id_responsavel = r.id_usuario
		INNER JOIN Usuario u_aluno ON ra.id_aluno = u_aluno.id_usuario
		INNER JOIN Usuario_Academia ua ON u_aluno.id_usuario = ua.id_usuario
		WHERE ra.id_responsavel = ? AND ua.id_academia = ?
		ORDER BY u_aluno.nome ASC
	`;
	const [linhasAlunos] = await pool.execute<RowDataPacket[]>(sqlAlunos, [
		idUsuarioResponsavel,
		idAcademia
	]);

	const dependentes: DependenteItemPainel[] = [];
	let totalTurmasAtivas = 0;
	let totalMedalhasFamilia = 0;
	let totalPendenciasFamilia = 0;

	for (const linha of linhasAlunos) {
		const idAluno = Number(linha.id_aluno);
		const painelJudoca = await obterPainelJudoca(idAcademia, idAluno);
		if (!painelJudoca) continue;

		totalTurmasAtivas += painelJudoca.treinosInscritos.length;
		totalMedalhasFamilia += painelJudoca.metricasJudoca.totalMedalhas;
		totalPendenciasFamilia += painelJudoca.pendencias.length;

		dependentes.push({
			aluno: {
				id_usuario: painelJudoca.judoca.id_usuario,
				nome: painelJudoca.judoca.nome,
				data_nascimento_br: String(linha.data_nascimento_br),
				idade: Number(linha.idade),
				menor_idade: Number(linha.idade) < 18,
				grau_parentesco: String(linha.grau_parentesco),
				financeiro: Boolean(linha.financeiro),
				matricula: painelJudoca.judoca.matricula,
				graduacao_atual: painelJudoca.judoca.graduacao_atual,
				peso: painelJudoca.judoca.peso,
				categoria: painelJudoca.judoca.categoria,
				nome_professor_responsavel: painelJudoca.judoca.nome_professor_responsavel
			},
			painelJudoca
		});
	}

	const metricasGerais = await obterMetricasDoDojo(idAcademia);
	const pendenciasTecnicas = await obterPendenciasTecnicasDojo(
		idAcademia,
		null,
		idUsuarioResponsavel
	);

	return {
		responsavel: {
			id_usuario: Number(resp.id_usuario),
			nome: String(resp.nome),
			email: String(resp.email),
			telefone: resp.telefone ? String(resp.telefone) : null
		},
		totalDependentes: dependentes.length,
		totalTurmasAtivas,
		totalMedalhasFamilia,
		totalPendenciasFamilia,
		dependentes,
		pendenciasTecnicas,
		proximosEventos: metricasGerais.proximosEventos
	};
}


