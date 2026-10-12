import type { StorageProvider, ResultadoUpload } from './storage.interface';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Provedor de armazenamento local para ambiente de desenvolvimento e testes.
 * Isola rigorosamente os arquivos por diretório de academia (academias/tenant_{idAcademia}/).
 */
export class LocalStorageProvider implements StorageProvider {
	private readonly pastaBase: string;

	constructor(pastaBase?: string) {
		// Define pasta base segura no projeto (ex: .uploads ou static/uploads)
		this.pastaBase = pastaBase || path.resolve(process.cwd(), '.uploads');
	}

	obterNomeProvedor(): 'local' {
		return 'local';
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
		const destinoAbsoluto = path.join(this.pastaBase, chave);

		// Cria as pastas necessárias de forma assíncrona
		await fs.mkdir(path.dirname(destinoAbsoluto), { recursive: true });
		await fs.writeFile(destinoAbsoluto, conteudo);

		return {
			chave,
			url: `/api/storage/${chave}`,
			tamanhoBytes: conteudo.byteLength,
			tipoMime
		};
	}

	async obterUrlPublica(idAcademia: number, chave: string): Promise<string> {
		const chaveSegura = this.sanitizarChave(chave);
		const prefixoTenant = `academias/tenant_${idAcademia}/`;

		if (!chaveSegura.startsWith(prefixoTenant)) {
			throw new Error('Violação de isolamento multi-tenant: arquivo não pertence a este dojo.');
		}

		return `/api/storage/${chaveSegura}`;
	}

	async excluirArquivo(idAcademia: number, chave: string): Promise<boolean> {
		const chaveSegura = this.sanitizarChave(chave);
		const prefixoTenant = `academias/tenant_${idAcademia}/`;

		if (!chaveSegura.startsWith(prefixoTenant)) {
			throw new Error('Violação de isolamento multi-tenant: tentativa de exclusão não autorizada.');
		}

		const caminhoAbsoluto = path.join(this.pastaBase, chaveSegura);
		try {
			await fs.unlink(caminhoAbsoluto);
			return true;
		} catch {
			return false;
		}
	}
}
