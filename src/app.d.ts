// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			usuario: {
				id: number;
				nome: string;
				email: string;
			} | null;
			idAcademia: number | null;
			nomeAcademia: string | null;
			perfis: string[];
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
