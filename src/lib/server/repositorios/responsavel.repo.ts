import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDbPool } from '../db/pool';
import { gerarHashSenha } from '../auth/criptografia';
import { mascararCpf } from './usuario.repo';
import { calcularIdadeServidor, buscarAlunoPorId } from './aluno.repo';
import { buscarHistoricoDoAluno, type HistoricoAlunoItem } from './graduacao.repo';
import { obterProximaFaixa } from '../servicos/regras-graduacao';
import { obterClassificacaoJudo } from '../../dominio/regras-categoria-peso';

export interface ResponsavelAluno {
	id_usuario: number;
	nome: string;
	cpf: string;
	email: string;
	telefone: string | null;
	grau_parentesco: string | null;
	financeiro: boolean;
}

export interface DadosResponsavelInput {
	nome: string;
	cpf: string;
	email: string;
	telefone: string | null;
	grauParentesco: string;
	financeiro: boolean;
}

/**
 * Busca o id_perfil correspondente a uma role no MySQL.
 */
async function obterIdPerfil(conn: PoolConnection, role: string): Promise<number> {
	const [linhas] = await conn.execute<RowDataPacket[]>(
		'SELECT id_perfil FROM Perfil WHERE role = ? LIMIT 1',
		[role]
	);
	if (linhas.length > 0) {
		return Number(linhas[0].id_perfil);
	}
	// Fallback padrão se não encontrar
	return role.toLowerCase() === 'responsável' ? 5 : 4;
}

/**
 * Busca ou cadastra o Responsável Legal e vincula ao aluno dentro de uma transação.
 * MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function registrarOuVincularResponsavelEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	idAluno: number,
	dados: DadosResponsavelInput
): Promise<number> {
	// 1. Verifica se já existe um usuário com este CPF
	const [usuariosExistentes] = await conn.execute<RowDataPacket[]>(
		'SELECT id_usuario FROM Usuario WHERE cpf = ? LIMIT 1',
		[dados.cpf]
	);

	let idResponsavel: number;

	if (usuariosExistentes.length > 0) {
		idResponsavel = Number(usuariosExistentes[0].id_usuario);
		// Atualiza dados cadastrais se necessário
		await conn.execute(
			`UPDATE Usuario 
			 SET nome = ?, email = COALESCE(NULLIF(?, ''), email), telefone = COALESCE(?, telefone)
			 WHERE id_usuario = ?`,
			[dados.nome, dados.email, dados.telefone, idResponsavel]
		);
	} else {
		// Gera senha provisória aleatória com hash seguro
		const hashProvisorio = await gerarHashSenha(Math.random().toString(36).slice(-10));
		const dataPadrao = '1980-01-01'; // Data para responsável caso não informada

		const [resInsert] = await conn.execute<ResultSetHeader>(
			`INSERT INTO Usuario (nome, cpf, data_nascimento, email, senha_hash, telefone)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[dados.nome, dados.cpf, dataPadrao, dados.email, hashProvisorio, dados.telefone]
		);
		idResponsavel = resInsert.insertId;
	}

	// 2. Garante vínculo multi-tenant com a academia
	await conn.execute(
		'INSERT IGNORE INTO Usuario_Academia (id_usuario, id_academia) VALUES (?, ?)',
		[idResponsavel, idAcademia]
	);

	// 3. Garante papel de Responsável no tenant
	const idPerfilResponsavel = await obterIdPerfil(conn, 'Responsável');
	await conn.execute(
		'INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)',
		[idResponsavel, idAcademia, idPerfilResponsavel]
	);

	// 4. Cadastra/Atualiza na tabela específica de Responsável
	await conn.execute(
		`INSERT INTO Responsavel (id_usuario, grau_parentesco, financeiro)
		 VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE grau_parentesco = VALUES(grau_parentesco), financeiro = VALUES(financeiro)`,
		[idResponsavel, dados.grauParentesco || 'Outro', dados.financeiro ? 1 : 0]
	);

	// 5. Vincula o Responsável ao Aluno
	await conn.execute(
		'INSERT IGNORE INTO Responsavel_Aluno (id_responsavel, id_aluno) VALUES (?, ?)',
		[idResponsavel, idAluno]
	);

	return idResponsavel;
}

/**
 * Consulta o responsável legal vinculado ao judoca em determinada academia.
 */
export async function buscarResponsavelDoAluno(
	idAcademia: number,
	idAluno: number
): Promise<ResponsavelAluno | null> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.cpf,
			u.email,
			u.telefone,
			r.grau_parentesco,
			r.financeiro
		FROM Responsavel_Aluno ra
		INNER JOIN Responsavel r ON ra.id_responsavel = r.id_usuario
		INNER JOIN Usuario u ON r.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		WHERE ra.id_aluno = ? AND ua.id_academia = ?
		LIMIT 1
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAluno, idAcademia]);
	if (linhas.length === 0) return null;

	const linha = linhas[0];
	return {
		id_usuario: Number(linha.id_usuario),
		nome: String(linha.nome),
		cpf: String(linha.cpf),
		email: String(linha.email),
		telefone: linha.telefone ? String(linha.telefone) : null,
		grau_parentesco: linha.grau_parentesco ? String(linha.grau_parentesco) : null,
		financeiro: Boolean(linha.financeiro)
	};
}

export interface ResponsavelOpcao {
	id_usuario: number;
	nome: string;
	cpf: string;
	cpf_mascarado: string;
	email: string;
	telefone: string | null;
	grau_parentesco: string | null;
	financeiro: boolean;
	total_menores: number;
	nomes_menores: string | null;
}

/**
 * Lista todos os responsáveis já cadastrados no dojo (tenant), incluindo a contagem
 * e nomes dos menores aos quais já estão vinculados.
 */
export async function listarResponsaveisDoDojo(idAcademia: number): Promise<ResponsavelOpcao[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.cpf,
			u.email,
			u.telefone,
			COALESCE(r.grau_parentesco, 'Responsável Legal') AS grau_parentesco,
			COALESCE(r.financeiro, 0) AS financeiro,
			COUNT(DISTINCT ra.id_aluno) AS total_menores,
			GROUP_CONCAT(DISTINCT menor_u.nome ORDER BY menor_u.nome SEPARATOR ', ') AS nomes_menores
		FROM Usuario u
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		LEFT JOIN Responsavel r ON u.id_usuario = r.id_usuario
		LEFT JOIN Responsavel_Aluno ra ON u.id_usuario = ra.id_responsavel
		LEFT JOIN Usuario menor_u ON ra.id_aluno = menor_u.id_usuario
		WHERE ua.id_academia = ? 
		  AND (
		    r.id_usuario IS NOT NULL
		    OR EXISTS (
		      SELECT 1 FROM Usuario_Academia_Perfil uap
		      INNER JOIN Perfil p ON uap.id_perfil = p.id_perfil
		      WHERE uap.id_usuario = u.id_usuario 
		        AND uap.id_academia = ua.id_academia 
		        AND p.role = 'Responsável'
		    )
		  )
		GROUP BY u.id_usuario, u.nome, u.cpf, u.email, u.telefone, r.grau_parentesco, r.financeiro
		ORDER BY u.nome ASC
	`;

	const [linhas] = await pool.query<RowDataPacket[]>(sql, [idAcademia]);
	return linhas.map((linha) => ({
		id_usuario: Number(linha.id_usuario),
		nome: String(linha.nome),
		cpf: String(linha.cpf),
		cpf_mascarado: mascararCpf(String(linha.cpf)),
		email: String(linha.email),
		telefone: linha.telefone ? String(linha.telefone) : null,
		grau_parentesco: linha.grau_parentesco ? String(linha.grau_parentesco) : null,
		financeiro: Boolean(linha.financeiro),
		total_menores: Number(linha.total_menores || 0),
		nomes_menores: linha.nomes_menores ? String(linha.nomes_menores) : null
	}));
}

/**
 * Vincula um responsável já existente a um aluno dentro de uma transação.
 * Permite associar o mesmo responsável a múltiplos menores (irmãos/dependentes).
 */
export async function vincularResponsavelExistenteEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	idResponsavel: number,
	idAluno: number,
	dados: {
		grauParentesco: string;
		financeiro: boolean;
	}
): Promise<void> {
	// 1. Garante vínculo com a academia
	await conn.execute(
		'INSERT IGNORE INTO Usuario_Academia (id_usuario, id_academia) VALUES (?, ?)',
		[idResponsavel, idAcademia]
	);

	// 2. Garante perfil de Responsável no tenant
	const idPerfilResponsavel = await obterIdPerfil(conn, 'Responsável');
	await conn.execute(
		'INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)',
		[idResponsavel, idAcademia, idPerfilResponsavel]
	);

	// 3. Cadastra/Atualiza registro na tabela Responsavel
	await conn.execute(
		`INSERT INTO Responsavel (id_usuario, grau_parentesco, financeiro)
		 VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE 
		   grau_parentesco = COALESCE(VALUES(grau_parentesco), grau_parentesco),
		   financeiro = COALESCE(VALUES(financeiro), financeiro)`,
		[idResponsavel, dados.grauParentesco || 'Responsável Legal', dados.financeiro ? 1 : 0]
	);

	// 4. Vincula o Responsável ao novo Aluno na tabela associativa Responsavel_Aluno com grau e financeiro específicos
	await conn.execute(
		`INSERT INTO Responsavel_Aluno (id_responsavel, id_aluno, grau_parentesco, financeiro) 
		 VALUES (?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE
		   grau_parentesco = VALUES(grau_parentesco),
		   financeiro = VALUES(financeiro)`,
		[idResponsavel, idAluno, dados.grauParentesco || 'Responsável Legal', dados.financeiro ? 1 : 0]
	);
}

export interface DependenteResponsavel {
	id_usuario: number;
	nome: string;
	cpf: string;
	data_nascimento: string;
	idade: number;
	menor_idade: boolean;
	matricula: string | null;
	graduacao_atual: string;
	peso: number | null;
	categoria: string | null;
	status_federacao: string | null;
	grupo_especial_aspirante: string | null;
	grau_parentesco: string;
}

/**
 * Lista todos os alunos/dependentes vinculados ao responsável legal na academia.
 */
export async function listarAlunosDoResponsavel(
	idAcademia: number,
	idResponsavel: number
): Promise<DependenteResponsavel[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			a.id_usuario,
			u.nome,
			u.cpf,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			a.matricula,
			COALESCE(a.graduacao_atual, 'Branca') AS graduacao_atual,
			a.peso,
			a.categoria,
			a.status_federacao,
			a.grupo_especial_aspirante,
			COALESCE(ra.grau_parentesco, r.grau_parentesco, 'Responsável Legal') AS grau_parentesco
		FROM Responsavel_Aluno ra
		INNER JOIN Aluno a ON ra.id_aluno = a.id_usuario
		INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		LEFT JOIN Responsavel r ON ra.id_responsavel = r.id_usuario
		WHERE ua.id_academia = ? AND ra.id_responsavel = ?
		ORDER BY u.nome ASC
	`;
	const [linhas] = await pool.query<RowDataPacket[]>(sql, [idAcademia, idResponsavel]);
	return linhas.map((linha) => {
		const dataNasc = String(linha.data_nascimento);
		const idade = calcularIdadeServidor(dataNasc);
		return {
			id_usuario: Number(linha.id_usuario),
			nome: String(linha.nome),
			cpf: String(linha.cpf),
			data_nascimento: dataNasc,
			idade,
			menor_idade: idade < 18,
			matricula: linha.matricula ? String(linha.matricula) : null,
			graduacao_atual: String(linha.graduacao_atual),
			peso: linha.peso !== null ? Number(linha.peso) : null,
			categoria: linha.categoria ? String(linha.categoria) : null,
			status_federacao: linha.status_federacao ? String(linha.status_federacao) : null,
			grupo_especial_aspirante: linha.grupo_especial_aspirante
				? String(linha.grupo_especial_aspirante)
				: null,
			grau_parentesco: String(linha.grau_parentesco)
		};
	});
}

/**
 * Conta quantos judocas/dependentes estão vinculados ao responsável na academia.
 * Utilizado para controle de visibilidade da aba 'Perfil do Responsável'.
 */
export async function contarAlunosDoResponsavel(
	idAcademia: number,
	idResponsavel: number
): Promise<number> {
	const pool = getDbPool();
	const sql = `
		SELECT COUNT(DISTINCT ra.id_aluno) AS total
		FROM Responsavel_Aluno ra
		INNER JOIN Aluno a ON ra.id_aluno = a.id_usuario
		INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario
		WHERE ua.id_academia = ? AND ra.id_responsavel = ?
	`;
	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia, idResponsavel]);
	return Number(linhas[0]?.total || 0);
}

export interface AlunoDoResponsavelDetalhado {
	id_usuario: number;
	nome: string;
	cpf: string;
	cpf_mascarado: string;
	email: string | null;
	telefone: string | null;
	data_nascimento: string;
	data_nascimento_br: string;
	idade: number;
	menor_idade: boolean;
	genero: 'M' | 'F';
	meu_grau_parentesco: string;
	sou_financeiro: boolean;
	responsaveis: Array<{
		id_responsavel: number;
		nome: string;
		grau_parentesco: string;
		financeiro: boolean;
	}>;
	endereco: {
		logradouro: string;
		numero: string | null;
		complemento: string | null;
		bairro: string | null;
		cidade: string;
		uf: string;
		cep: string;
	} | null;
	matricula: string | null;
	graduacao_atual: string;
	proxima_faixa: string;
	peso: number | null;
	categoria: string | null;
	divisao: string | null;
	n_federacao: string | null;
	status_federacao: string | null;
	data_inicio: string | null;
	data_inicio_br: string | null;
	data_primeira_graduacao: string | null;
	data_primeira_graduacao_br: string | null;
	id_professor_responsavel: number;
	nome_professor_responsavel: string;
	treinosInscritos: Array<{
		id_treino: number;
		descricao: string;
		dia_semana: string;
		horario_inicio: string;
		horario_fim: string;
		professores: string;
	}>;
	graduacoes: HistoricoAlunoItem[];
}

/**
 * Busca a ficha cadastral e técnica completa de todos os judocas vinculados
 * ao responsável na academia especificada.
 */
export async function buscarPerfilCompletoAlunosDoResponsavel(
	idAcademia: number,
	idResponsavel: number
): Promise<AlunoDoResponsavelDetalhado[]> {
	const pool = getDbPool();

	const sqlVinculos = `
		SELECT 
			ra.id_aluno,
			COALESCE(ra.grau_parentesco, r.grau_parentesco, 'Responsável Legal') AS meu_grau_parentesco,
			COALESCE(ra.financeiro, r.financeiro, 0) AS sou_financeiro
		FROM Responsavel_Aluno ra
		INNER JOIN Aluno a ON ra.id_aluno = a.id_usuario
		INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario
		LEFT JOIN Responsavel r ON ra.id_responsavel = r.id_usuario
		WHERE ua.id_academia = ? AND ra.id_responsavel = ?
		ORDER BY u.nome ASC
	`;
	const [vinculos] = await pool.query<RowDataPacket[]>(sqlVinculos, [idAcademia, idResponsavel]);
	if (vinculos.length === 0) return [];

	const resultados: AlunoDoResponsavelDetalhado[] = [];

	for (const v of vinculos) {
		const idAluno = Number(v.id_aluno);
		const alunoDetalhes = await buscarAlunoPorId(idAcademia, idAluno);
		if (!alunoDetalhes) continue;

		// 1. Endereço do aluno
		const [enderecos] = await pool.query<RowDataPacket[]>(
			`SELECT logradouro, numero, complemento, bairro, cidade, uf, cep 
			 FROM Endereco_Usuario 
			 WHERE id_usuario = ? LIMIT 1`,
			[idAluno]
		);
		const endereco =
			enderecos.length > 0
				? {
						logradouro: String(enderecos[0].logradouro),
						numero: enderecos[0].numero ? String(enderecos[0].numero) : null,
						complemento: enderecos[0].complemento ? String(enderecos[0].complemento) : null,
						bairro: enderecos[0].bairro ? String(enderecos[0].bairro) : null,
						cidade: String(enderecos[0].cidade),
						uf: String(enderecos[0].uf),
						cep: String(enderecos[0].cep)
				  }
				: null;

		// 2. Turmas em que o aluno está inscrito
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
		const [linhasTreinos] = await pool.execute<RowDataPacket[]>(sqlTreinos, [idAcademia, idAluno]);
		const treinosInscritos = linhasTreinos.map((t) => ({
			id_treino: Number(t.id_treino),
			descricao: String(t.descricao),
			dia_semana: String(t.dia_semana),
			horario_inicio: String(t.horario_inicio || ''),
			horario_fim: String(t.horario_fim || ''),
			professores: String(t.professores)
		}));

		// 3. Trilha cronológica de graduações homologadas
		const graduacoes = await buscarHistoricoDoAluno(idAcademia, idAluno);

		// 4. Próxima faixa de progressão no Judô
		const proximaFaixa = obterProximaFaixa(alunoDetalhes.graduacao_atual);

		// 5. Formatação das datas em padrão brasileiro
		const partesNasc = alunoDetalhes.data_nascimento.split('-');
		const dataNascBr =
			partesNasc.length === 3
				? `${partesNasc[2]}/${partesNasc[1]}/${partesNasc[0]}`
				: alunoDetalhes.data_nascimento;

		let dataInicioBr: string | null = null;
		if (alunoDetalhes.data_inicio) {
			const p = alunoDetalhes.data_inicio.split('-');
			dataInicioBr = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : alunoDetalhes.data_inicio;
		}

		let dataPrimeiraGraduacaoBr: string | null = null;
		if (alunoDetalhes.data_primeira_graduacao) {
			const p = alunoDetalhes.data_primeira_graduacao.split('-');
			dataPrimeiraGraduacaoBr =
				p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : alunoDetalhes.data_primeira_graduacao;
		}

		resultados.push({
			id_usuario: alunoDetalhes.id_usuario,
			nome: alunoDetalhes.nome,
			cpf: alunoDetalhes.cpf,
			cpf_mascarado: mascararCpf(alunoDetalhes.cpf),
			email: alunoDetalhes.email || null,
			telefone: alunoDetalhes.telefone || null,
			data_nascimento: alunoDetalhes.data_nascimento,
			data_nascimento_br: dataNascBr,
			idade: alunoDetalhes.idade,
			menor_idade: alunoDetalhes.menor_idade,
			genero: alunoDetalhes.genero,
			meu_grau_parentesco: String(v.meu_grau_parentesco),
			sou_financeiro: Boolean(v.sou_financeiro),
			responsaveis: alunoDetalhes.responsaveis || [],
			endereco,
			matricula: alunoDetalhes.matricula,
			graduacao_atual: alunoDetalhes.graduacao_atual,
			proxima_faixa: proximaFaixa,
			peso: alunoDetalhes.peso,
			categoria: alunoDetalhes.categoria,
			divisao: alunoDetalhes.grupo_especial_aspirante,
			n_federacao: alunoDetalhes.n_federacao,
			status_federacao: alunoDetalhes.status_federacao,
			data_inicio: alunoDetalhes.data_inicio,
			data_inicio_br: dataInicioBr,
			data_primeira_graduacao: alunoDetalhes.data_primeira_graduacao,
			data_primeira_graduacao_br: dataPrimeiraGraduacaoBr,
			id_professor_responsavel: alunoDetalhes.id_professor_responsavel,
			nome_professor_responsavel: alunoDetalhes.nome_professor_responsavel,
			treinosInscritos,
			graduacoes
		});
	}

	return resultados;
}

/**
 * Atualiza o peso de um aluno tutelado diretamente pelo responsável legal,
 * recalculando automaticamente a categoria e divisão oficial de Judô (CBJ/FPJ).
 */
export async function atualizarPesoAlunoDoResponsavel(
	idAcademia: number,
	idResponsavel: number,
	idAluno: number,
	novoPeso: number
): Promise<{ sucesso: boolean; mensagem: string; novaCategoria?: string }> {
	const pool = getDbPool();

	// Validação de segurança: o aluno deve ser tutelado pelo responsável logado nesta academia
	const [check] = await pool.query<RowDataPacket[]>(
		`SELECT ra.id_aluno, u.nome, u.genero, DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento, a.graduacao_atual
		 FROM Responsavel_Aluno ra
		 INNER JOIN Aluno a ON ra.id_aluno = a.id_usuario
		 INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		 INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario
		 WHERE ua.id_academia = ? AND ra.id_responsavel = ? AND ra.id_aluno = ?
		 LIMIT 1`,
		[idAcademia, idResponsavel, idAluno]
	);

	if (check.length === 0) {
		throw new Error('Acesso negado: você não possui tutela legal sobre este judoca no dojo atual.');
	}

	const row = check[0];
	let novaCategoria: string | null = null;
	let novaDivisao: string | null = null;

	if (row.data_nascimento) {
		const classif = obterClassificacaoJudo({
			dataNascimento: String(row.data_nascimento),
			genero: (row.genero === 'F' ? 'F' : 'M') as 'M' | 'F',
			peso: novoPeso,
			graduacao: String(row.graduacao_atual || 'Branca')
		});
		novaCategoria = classif.categoriaCompleta;
		novaDivisao = classif.divisao;
	}

	await pool.execute(
		`UPDATE Aluno 
		 SET peso = ?, 
		     categoria = COALESCE(?, categoria), 
		     grupo_especial_aspirante = COALESCE(?, grupo_especial_aspirante)
		 WHERE id_usuario = ?`,
		[novoPeso, novaCategoria, novaDivisao, idAluno]
	);

	return {
		sucesso: true,
		mensagem: `Peso de ${row.nome} atualizado para ${novoPeso.toFixed(2)} kg!${novaCategoria ? ` Categoria recalculada: ${novaCategoria}.` : ''}`,
		novaCategoria: novaCategoria || undefined
	};
}

/**
 * Atualiza canais de contato direto do aluno tutelado (telefone/WhatsApp ou e-mail).
 */
export async function atualizarContatoAlunoDoResponsavel(
	idAcademia: number,
	idResponsavel: number,
	idAluno: number,
	dados: { telefone?: string | null; email?: string | null }
): Promise<{ sucesso: boolean; mensagem: string }> {
	const pool = getDbPool();

	const [check] = await pool.query<RowDataPacket[]>(
		`SELECT ra.id_aluno, u.nome
		 FROM Responsavel_Aluno ra
		 INNER JOIN Usuario_Academia ua ON ra.id_aluno = ua.id_usuario
		 INNER JOIN Usuario u ON ra.id_aluno = u.id_usuario
		 WHERE ua.id_academia = ? AND ra.id_responsavel = ? AND ra.id_aluno = ?
		 LIMIT 1`,
		[idAcademia, idResponsavel, idAluno]
	);

	if (check.length === 0) {
		throw new Error('Acesso negado: você não possui tutela legal sobre este judoca no dojo atual.');
	}

	await pool.execute(
		`UPDATE Usuario 
		 SET telefone = ?, email = COALESCE(NULLIF(?, ''), email)
		 WHERE id_usuario = ?`,
		[dados.telefone || null, dados.email || null, idAluno]
	);

	return {
		sucesso: true,
		mensagem: `Contatos de ${check[0].nome} atualizados com sucesso.`
	};
}


