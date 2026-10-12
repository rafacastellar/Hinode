/**
 * Contrato de abstração para armazenamento em nuvem (Cloud-Ready).
 * Garante que rotinas de upload (ex: fotos de atletas, comprovantes) nunca salvem
 * arquivos diretamente no disco da VM de forma acoplada, permitindo migração
 * instantânea para AWS S3 sem alteração de rotas ou regras de negócio.
 * 
 * DIRETRIZ MULTI-TENANT: Toda operação exige idAcademia para garantir que
 * os arquivos fiquem isolados no namespace de cada dojo.
 */

export interface ArquivoUpload {
	nomeOriginal: string;
	conteudo: Buffer | Uint8Array;
	tipoMime: string;
	tamanhoBytes: number;
}

export interface ResultadoUpload {
	chave: string;
	url: string;
	tamanhoBytes: number;
	tipoMime: string;
}

export interface StorageProvider {
	/**
	 * Nome identificador do provedor ativo ('local' | 's3')
	 */
	obterNomeProvedor(): 'local' | 's3';

	/**
	 * Faz upload do arquivo isolando-o pelo id da academia.
	 */
	salvarArquivo(
		idAcademia: number,
		subpasta: string,
		nomeArquivo: string,
		conteudo: Buffer | Uint8Array,
		tipoMime: string
	): Promise<ResultadoUpload>;

	/**
	 * Obtém a URL pública ou assinada para acesso ao arquivo.
	 */
	obterUrlPublica(idAcademia: number, chave: string): Promise<string>;

	/**
	 * Exclui o arquivo do armazenamento com verificação de isolamento.
	 */
	excluirArquivo(idAcademia: number, chave: string): Promise<boolean>;
}
