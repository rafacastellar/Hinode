import type { RowDataPacket } from 'mysql2';
import { getDbPool } from '../db/pool';
import { buscarAlunoPorId } from './aluno.repo';
import { buscarHistoricoDoAluno, type HistoricoAlunoItem } from './graduacao.repo';
import { validarElegibilidadeGraduacao } from '../servicos/regras-graduacao';

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

