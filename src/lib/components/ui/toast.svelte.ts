export type TipoToast = 'sucesso' | 'erro' | 'aviso' | 'info';

export interface ItemToast {
	id: string;
	tipo: TipoToast;
	titulo: string;
	mensagem?: string;
	duracaoMs?: number;
}

class GerenciadorToast {
	itens = $state<ItemToast[]>([]);

	adicionar(dados: Omit<ItemToast, 'id'>): string {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		const duracao = dados.duracaoMs ?? 4500;
		const novo: ItemToast = { ...dados, id, duracaoMs: duracao };

		this.itens = [...this.itens, novo];

		if (duracao > 0 && typeof window !== 'undefined') {
			setTimeout(() => {
				this.remover(id);
			}, duracao);
		}

		return id;
	}

	sucesso(titulo: string, mensagem?: string, duracaoMs = 4500) {
		return this.adicionar({ tipo: 'sucesso', titulo, mensagem, duracaoMs });
	}

	erro(titulo: string, mensagem?: string, duracaoMs = 6000) {
		return this.adicionar({ tipo: 'erro', titulo, mensagem, duracaoMs });
	}

	aviso(titulo: string, mensagem?: string, duracaoMs = 5000) {
		return this.adicionar({ tipo: 'aviso', titulo, mensagem, duracaoMs });
	}

	info(titulo: string, mensagem?: string, duracaoMs = 4000) {
		return this.adicionar({ tipo: 'info', titulo, mensagem, duracaoMs });
	}

	remover(id: string) {
		this.itens = this.itens.filter((t) => t.id !== id);
	}
}

export const toast = new GerenciadorToast();

