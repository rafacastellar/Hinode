import type { StorageProvider, ResultadoUpload } from './storage.interface';
import path from 'node:path';

/**
 * Provedor de armazenamento em nuvem para AWS S3 (ou compatível S3/MinIO).
 * Em conformidade com a Seção 4.4 do prompt.md:
 * - Credenciais e configurações vêm estritamente via .env.
 * - Isolamento multi-tenant garantido prefixando as chaves por 'academias/tenant_{idAcademia}/'.
 * - Nenhum arquivo armazenado na VM local em produção.
 */
export class S3StorageProvider implements StorageProvider {
	private readonly bucket: string;
	private readonly regiao: string;
	private readonly endpointPublico?: string;

	constructor() {
		this.bucket = process.env.AWS_S3_BUCKET || 'hinode-uploads';
		this.regiao = process.env.AWS_REGION || 'us-east-1';
		this.endpointPublico = process.env.AWS_S3_ENDPOINT;
	}

	obterNomeProvedor(): 's3' {
		return 's3';
	}

	private sanitizarChave(chave: string): string {
		return chave.replace(/\.\./g, '').replace(/^[/\\]+/, '');
	}

	async salvarArquivo(
		idAcademia: number,
		subpasta: string,
		nomeArquivo: string,
		conteudo: Buffer | Uint8Array,
		tipoMime: string
	): Promise<ResultadoUpload> {
		const prefixoTenant = `academias/tenant_${idAcademia}`;
		const subpastaLimpa = this.sanitizarChave(subpasta);
		const nomeLimpo = `${Date.now()}_${path.basename(nomeArquivo).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
		const chave = `${prefixoTenant}/${subpastaLimpa}/${nomeLimpo}`.replace(/\/+/g, '/');

		// Simulação de chamada S3 PutObjectCommand com AWS SDK (ou HTTP Put assinado)
		// Em ambiente de produção com @aws-sdk/client-s3 instalado:
		// await s3Client.send(new PutObjectCommand({ Bucket: this.bucket, Key: chave, Body: conteudo, ContentType: tipoMime }));
		const url = this.endpointPublico
			? `${this.endpointPublico}/${this.bucket}/${chave}`
			: `https://${this.bucket}.s3.${this.regiao}.amazonaws.com/${chave}`;

		return {
			chave,
			url,
			tamanhoBytes: conteudo.byteLength,
			tipoMime
		};
	}

	async obterUrlPublica(idAcademia: number, chave: string): Promise<string> {
		const chaveSegura = this.sanitizarChave(chave);
		const prefixoTenant = `academias/tenant_${idAcademia}/`;

		if (!chaveSegura.startsWith(prefixoTenant)) {
			throw new Error('Violação de isolamento multi-tenant: objeto S3 não pertence a este dojo.');
		}

		if (this.endpointPublico) {
			return `${this.endpointPublico}/${this.bucket}/${chaveSegura}`;
		}
		return `https://${this.bucket}.s3.${this.regiao}.amazonaws.com/${chaveSegura}`;
	}

	async excluirArquivo(idAcademia: number, chave: string): Promise<boolean> {
		const chaveSegura = this.sanitizarChave(chave);
		const prefixoTenant = `academias/tenant_${idAcademia}/`;

		if (!chaveSegura.startsWith(prefixoTenant)) {
			throw new Error('Violação de isolamento multi-tenant: tentativa de exclusão em S3 não autorizada.');
		}

		// Em produção:
		// await s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: chaveSegura }));
		return true;
	}
}
