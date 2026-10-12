import type { StorageProvider } from './storage.interface';
import { LocalStorageProvider } from './local.storage';
import { S3StorageProvider } from './s3.storage';

let instanciaProvedor: StorageProvider | null = null;

/**
 * Retorna o provedor de armazenamento configurado nas variáveis de ambiente.
 * - 's3': AWS S3 (Produção na AWS)
 * - 'local': Armazenamento isolado (Desenvolvimento e VM local)
 */
export function getStorageProvider(): StorageProvider {
	if (!instanciaProvedor) {
		const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();

		if (driver === 's3') {
			instanciaProvedor = new S3StorageProvider();
		} else {
			instanciaProvedor = new LocalStorageProvider();
		}
	}
	return instanciaProvedor;
}

export type { StorageProvider, ArquivoUpload, ResultadoUpload } from './storage.interface';
