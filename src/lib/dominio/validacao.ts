/**
 * Módulo de Validações de Domínio e Segurança - Sistema Hinodê
 * Utilizável de forma isomórfica (tanto no navegador quanto no Node.js / SvelteKit).
 */

/**
 * Validação oficial de CPF de acordo com o algoritmo da Receita Federal do Brasil (Módulo 11).
 * Elimina sequências com dígitos repetidos (ex: 111.111.111-11) e valida os 2 dígitos verificadores.
 */
export function validarCpfOficial(cpfBruto: string | null | undefined): boolean {
	if (!cpfBruto) return false;

	// 1. Extrai apenas dígitos numéricos
	const cpf = cpfBruto.replace(/\D/g, '');

	// 2. CPF deve ter exatamente 11 dígitos
	if (cpf.length !== 11) return false;

	// 3. Rejeita números com todos os dígitos iguais conhecidos
	if (/^(\d)\1{10}$/.test(cpf)) return false;

	// 4. Validação do 1º dígito verificador
	let soma = 0;
	for (let i = 0; i < 9; i++) {
		soma += parseInt(cpf.charAt(i), 10) * (10 - i);
	}
	let primeiroDigito = (soma * 10) % 11;
	if (primeiroDigito === 10 || primeiroDigito === 11) {
		primeiroDigito = 0;
	}
	if (primeiroDigito !== parseInt(cpf.charAt(9), 10)) {
		return false;
	}

	// 5. Validação do 2º dígito verificador
	soma = 0;
	for (let i = 0; i < 10; i++) {
		soma += parseInt(cpf.charAt(i), 10) * (11 - i);
	}
	let segundoDigito = (soma * 10) % 11;
	if (segundoDigito === 10 || segundoDigito === 11) {
		segundoDigito = 0;
	}
	if (segundoDigito !== parseInt(cpf.charAt(10), 10)) {
		return false;
	}

	return true;
}

/**
 * Aplica máscara de formatação padrão em CPFs brasileiros: 000.000.000-00
 */
export function formatarCpf(valor: string | null | undefined): string {
	if (!valor) return '';
	const digitos = valor.replace(/\D/g, '').slice(0, 11);
	if (digitos.length <= 3) return digitos;
	if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
	if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
	return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`;
}

/**
 * Validação de documento de estrangeiro (Passaporte internacional, CRNM ou Tax ID).
 * Deve conter de 4 a 30 caracteres alfanuméricos (letras, números, hifens ou pontos).
 */
export function validarDocumentoEstrangeiro(docBruto: string | null | undefined): boolean {
	if (!docBruto) return false;
	const limpo = docBruto.trim();
	if (limpo.length < 4 || limpo.length > 30) return false;
	// Permite letras, números, hífens, pontos e barras
	return /^[A-Za-z0-9\-_./]+$/.test(limpo);
}

/**
 * Mascara documento pessoal para proteção à privacidade e LGPD.
 * Para CPF (11 dígitos): exibe os 3 primeiros e 2 últimos (ex: 123.***.***-89).
 * Para Estrangeiro: exibe os 2 primeiros e 2 últimos caracteres (ex: PA****56).
 */
export function mascararDocumento(docPuro: string | null | undefined, tipo: 'CPF' | 'ESTRANGEIRO' = 'CPF'): string {
	if (!docPuro) return '***';
	const limpo = docPuro.trim();

	if (tipo === 'CPF' || /^\d{11}$/.test(limpo.replace(/\D/g, ''))) {
		const digitos = limpo.replace(/\D/g, '');
		if (digitos.length === 11) {
			return `${digitos.slice(0, 3)}.***.***-${digitos.slice(9, 11)}`;
		}
	}

	// Documento estrangeiro ou formato livre
	if (limpo.length <= 4) {
		return '***';
	}
	const inicio = limpo.slice(0, 2);
	const fim = limpo.slice(-2);
	const miolo = '*'.repeat(Math.max(3, limpo.length - 4));
	return `${inicio}${miolo}${fim}`;
}

/**
 * Critérios e métricas de segurança para criação e validação de senhas fortes.
 * Baseado nas diretrizes NIST SP 800-63B e OWASP.
 */
export interface ResultadoAnaliseSenha {
	valida: boolean;
	pontuacao: number; // 0 a 4
	forca: 'fraca' | 'media' | 'boa' | 'forte';
	temTamanhoMinimo: boolean;
	temMinuscula: boolean;
	temMaiuscula: boolean;
	temNumero: boolean;
	temSimbolo: boolean;
	criterios: {
		comprimentoMinimo: boolean;
		minuscula: boolean;
		maiuscula: boolean;
		numero: boolean;
		especial: boolean;
	};
	erros: string[];
}

export const REGEX_SENHA_FORTE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export function analisarForcaSenha(senha: string | null | undefined): ResultadoAnaliseSenha {
	const s = senha || '';
	const temTamanhoMinimo = s.length >= 8;
	const temMinuscula = /[a-z]/.test(s);
	const temMaiuscula = /[A-Z]/.test(s);
	const temNumero = /\d/.test(s);
	const temSimbolo = /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s);

	let pontuacao = 0;
	if (temTamanhoMinimo) pontuacao++;
	if (temMinuscula && temMaiuscula) pontuacao++;
	if (temNumero) pontuacao++;
	if (temSimbolo) pontuacao++;

	// Penalidade para senhas muito curtas
	if (s.length < 6) {
		pontuacao = 0;
	}

	let forca: 'fraca' | 'media' | 'boa' | 'forte' = 'fraca';
	if (pontuacao >= 4 && s.length >= 10) {
		forca = 'forte';
	} else if (pontuacao >= 3) {
		forca = 'boa';
	} else if (pontuacao >= 2) {
		forca = 'media';
	}

	const erros: string[] = [];
	if (!temTamanhoMinimo) erros.push('Mínimo de 8 caracteres');
	if (!temMinuscula) erros.push('Ao menos 1 letra minúscula');
	if (!temMaiuscula) erros.push('Ao menos 1 letra maiúscula');
	if (!temNumero) erros.push('Ao menos 1 número');
	if (!temSimbolo) erros.push('Ao menos 1 caractere especial (@$!%*?&#)');

	return {
		valida: temTamanhoMinimo && temMinuscula && temMaiuscula && temNumero && temSimbolo,
		pontuacao,
		forca,
		temTamanhoMinimo,
		temMinuscula,
		temMaiuscula,
		temNumero,
		temSimbolo,
		criterios: {
			comprimentoMinimo: temTamanhoMinimo,
			minuscula: temMinuscula,
			maiuscula: temMaiuscula,
			numero: temNumero,
			especial: temSimbolo
		},
		erros
	};
}
