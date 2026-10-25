<script lang="ts">
	import CabecalhoDocumentoOficial from './CabecalhoDocumentoOficial.svelte';
	import type {
		InscritoGraduacaoItem,
		EventoGraduacaoDetalhado
	} from '#lib/server/repositorios/graduacao.repo';
	import type { ProfessorDojo } from '#lib/server/repositorios/professor.repo';
	import { obterProximaFaixaCliente } from '#lib/dominio/graduacao';

	interface Props {
		nomeAcademia?: string;
		evento: EventoGraduacaoDetalhado;
		inscricoes: InscritoGraduacaoItem[];
		professores: ProfessorDojo[];
		filtroStatus?: 'todos' | 'confirmadas' | 'homologadas';
		criterioOrdenacao?: 'nome' | 'faixa';
	}

	let {
		nomeAcademia = 'Judô Hinodê',
		evento,
		inscricoes,
		professores,
		filtroStatus = 'todos',
		criterioOrdenacao = 'nome'
	}: Props = $props();

	// Lista de candidatos filtrada e ordenada
	const candidatosFiltrados = $derived.by(() => {
		let lista = [...inscricoes];

		if (filtroStatus === 'confirmadas') {
			lista = lista.filter((i) => i.status_inscricao === 'Confirmada');
		} else if (filtroStatus === 'homologadas') {
			lista = lista.filter((i) => i.homologado);
		}

		lista.sort((a, b) => {
			if (criterioOrdenacao === 'faixa') {
				const cmpFaixa = a.faixa_atual.localeCompare(b.faixa_atual, 'pt-BR');
				if (cmpFaixa !== 0) return cmpFaixa;
			}
			return a.nome_aluno.localeCompare(b.nome_aluno, 'pt-BR');
		});

		return lista;
	});
</script>

<div class="documento-graduacao-container">
	<CabecalhoDocumentoOficial
		{nomeAcademia}
		titulo="Ficha de Avaliação da Banca Examinadora"
		subtitulo="Exame Oficial de Graduação & Avaliação Técnica • Troca de Faixas"
		codigoDoc={`EX-GRA-${evento.id_evento}`}
	/>

	<!-- Bloco de Informações do Exame -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 mb-5 rounded-lg border border-zinc-300 bg-zinc-50 text-[11px]">
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Exame / Evento</span>
			<span class="font-bold text-zinc-900 text-xs">
				{evento.nome} {#if evento.edicao}({evento.edicao}){/if}
			</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Data & Local</span>
			<span class="font-bold text-zinc-900">
				{evento.data_inicio} • {evento.cidade || 'São Paulo'} / {evento.uf || 'SP'}
			</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Escopo de Faixas</span>
			<span class="font-bold text-zinc-900">
				{evento.faixa_inicio || 'Branca'} até {evento.faixa_fim || 'Marrom'}
			</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Banca Examinadora</span>
			<span class="font-bold text-zinc-900 truncate block">
				{#if professores.length > 0}
					{professores.map((p) => p.nome).join(', ')}
				{:else}
					Senseis Credenciados
				{/if}
			</span>
		</div>
	</div>

	<!-- Tabela de Avaliação Técnica dos Candidatos -->
	<div class="mb-6 overflow-x-auto">
		<table class="w-full border-collapse text-left border border-zinc-300 text-[10px]">
			<thead>
				<tr class="bg-zinc-100 text-zinc-800 border-b border-zinc-300 font-semibold uppercase text-[9px] tracking-wider">
					<th class="py-2 px-1.5 w-7 text-center border-r border-zinc-300">#</th>
					<th class="py-2 px-2 border-r border-zinc-300">Candidato (Judoca)</th>
					<th class="py-2 px-2 w-20 border-r border-zinc-300">Faixa Atual</th>
					<th class="py-2 px-2 w-20 border-r border-zinc-300 font-bold text-red-700">Nova Faixa</th>
					<th class="py-2 px-2 w-24 border-r border-zinc-300 text-center">Nage-Waza (Pé)</th>
					<th class="py-2 px-2 w-24 border-r border-zinc-300 text-center">Katame-Waza (Solo)</th>
					<th class="py-2 px-2 w-20 border-r border-zinc-300 text-center">Kata / Teoria</th>
					<th class="py-2 px-2 w-28 text-center">Parecer da Banca</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-200">
				{#each candidatosFiltrados as cand, index}
					<tr class="hover:bg-zinc-50 transition-colors">
						<td class="py-2 px-1 text-center border-r border-zinc-200 font-mono text-[9px] text-zinc-500">
							{String(index + 1).padStart(2, '0')}
						</td>
						<td class="py-2 px-2 border-r border-zinc-200 font-medium text-zinc-900">
							<span class="block font-semibold">{cand.nome_aluno}</span>
							{#if cand.matricula_aluno}
								<span class="text-[8px] font-mono text-zinc-500 block">Matr: {cand.matricula_aluno}</span>
							{/if}
						</td>
						<td class="py-2 px-2 border-r border-zinc-200 text-zinc-800">
							{cand.faixa_atual}
						</td>
						<td class="py-2 px-2 border-r border-zinc-200 font-bold text-red-900">
							{cand.nova_faixa_homologada || obterProximaFaixaCliente(cand.faixa_atual)}
						</td>
						<!-- Avaliação Nage-Waza -->
						<td class="py-2 px-1 border-r border-zinc-200 text-center">
							<div class="flex items-center justify-center gap-1.5 text-[8px] text-zinc-700">
								<span>[ &nbsp; ] Apto</span>
								<span>[ &nbsp; ] R</span>
							</div>
						</td>
						<!-- Avaliação Katame-Waza -->
						<td class="py-2 px-1 border-r border-zinc-200 text-center">
							<div class="flex items-center justify-center gap-1.5 text-[8px] text-zinc-700">
								<span>[ &nbsp; ] Apto</span>
								<span>[ &nbsp; ] R</span>
							</div>
						</td>
						<!-- Avaliação Kata / Teoria -->
						<td class="py-2 px-1 border-r border-zinc-200 text-center">
							<div class="flex items-center justify-center gap-1.5 text-[8px] text-zinc-700">
								<span>[ &nbsp; ] Apto</span>
								<span>[ &nbsp; ] R</span>
							</div>
						</td>
						<!-- Parecer da Banca -->
						<td class="py-2 px-1.5 text-center">
							{#if cand.homologado}
								<span class="font-bold text-emerald-800 uppercase text-[9px] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-300">
									✓ APROVADO
								</span>
							{:else}
								<div class="flex items-center justify-center gap-1 text-[8px] text-zinc-700">
									<span>[ &nbsp; ] Aprov</span>
									<span>[ &nbsp; ] Reteste</span>
								</div>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="8" class="py-6 text-center text-zinc-500 italic">
							Nenhum candidato inscrito ou encontrado com os filtros selecionados.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Critérios Oficiais e Metodologia -->
	<div class="evitar-quebra mb-6 p-2.5 rounded border border-zinc-200 bg-zinc-50/70 text-[9px] text-zinc-600">
		<span class="font-bold text-zinc-800 block mb-0.5 uppercase tracking-wide">Diretrizes da Banca Avaliadora:</span>
		<p class="leading-relaxed">
			O exame técnico fundamenta-se nos preceitos do Kodokan e regulamento da CBJ/FPJ. O judoca deve demonstrar postura (Shisei), equilíbrio (Kuzushi), técnica apropriada (Tsukuri e Kake), controle das quedas (Ukemi), respeito recíproco (Reigi) e conduta ética condizente com a nova graduação.
		</p>
	</div>

	<!-- Bloco de Assinaturas da Banca Examinadora -->
	<div class="evitar-quebra mt-8 pt-4 border-t-2 border-zinc-300">
		<div class="text-center mb-6">
			<span class="font-bold text-[10px] text-zinc-700 uppercase tracking-wider">
				Homologação da Banca Examinadora Oficial
			</span>
		</div>

		<div class="grid grid-cols-3 gap-6 text-center">
			<div>
				<div class="h-9 border-b border-zinc-800 mb-1"></div>
				<span class="font-bold text-[10px] text-zinc-900 block leading-tight">
					Sensei Presidente da Banca
				</span>
				<span class="text-[8px] text-zinc-500 block">
					Graduação / Reg. Federação
				</span>
			</div>
			<div>
				<div class="h-9 border-b border-zinc-800 mb-1"></div>
				<span class="font-bold text-[10px] text-zinc-900 block leading-tight">
					Sensei Examinador 1
				</span>
				<span class="text-[8px] text-zinc-500 block">
					Graduação / Reg. Federação
				</span>
			</div>
			<div>
				<div class="h-9 border-b border-zinc-800 mb-1"></div>
				<span class="font-bold text-[10px] text-zinc-900 block leading-tight">
					Sensei Examinador 2
				</span>
				<span class="text-[8px] text-zinc-500 block">
					Graduação / Reg. Federação
				</span>
			</div>
		</div>

		<div class="text-right text-[8px] font-mono text-zinc-400 mt-6">
			Total de candidatos avaliados: {candidatosFiltrados.length} • Registrado eletronicamente no Sistema Hinodê
		</div>
	</div>
</div>
