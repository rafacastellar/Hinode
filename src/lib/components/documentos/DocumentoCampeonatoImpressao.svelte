<script lang="ts">
	import CabecalhoDocumentoOficial from './CabecalhoDocumentoOficial.svelte';
	import type {
		CampeonatoDetalhado,
		InscricaoItem
	} from '#lib/server/repositorios/campeonato.repo';

	interface Props {
		nomeAcademia?: string;
		campeonato: CampeonatoDetalhado;
		inscricoes: InscricaoItem[];
		filtroStatus?: 'todos' | 'confirmadas' | 'pendentes';
		criterioOrdenacao?: 'nome' | 'categoria_peso' | 'faixa' | 'status';
		nomeSenseiResponsavel?: string;
	}

	let {
		nomeAcademia = 'Judô Hinodê',
		campeonato,
		inscricoes,
		filtroStatus = 'todos',
		criterioOrdenacao = 'nome',
		nomeSenseiResponsavel = ''
	}: Props = $props();

	// Lista de competidores filtrada e ordenada conforme preferência do Sensei
	const atletasFiltrados = $derived.by(() => {
		let lista = [...inscricoes];

		// Filtro de status da inscrição
		if (filtroStatus === 'confirmadas') {
			lista = lista.filter((i) => i.status_inscricao === 'Confirmada');
		} else if (filtroStatus === 'pendentes') {
			lista = lista.filter((i) => i.status_inscricao === 'Pendente');
		}

		// Ordenação dinâmica
		lista.sort((a, b) => {
			if (criterioOrdenacao === 'categoria_peso') {
				const catA = a.categoria_participante || '';
				const catB = b.categoria_participante || '';
				const cmpCat = catA.localeCompare(catB, 'pt-BR');
				if (cmpCat !== 0) return cmpCat;

				const pesoA = a.peso_participante || 0;
				const pesoB = b.peso_participante || 0;
				if (pesoA !== pesoB) return pesoA - pesoB;
			} else if (criterioOrdenacao === 'faixa') {
				const cmpFaixa = a.faixa_participante.localeCompare(b.faixa_participante, 'pt-BR');
				if (cmpFaixa !== 0) return cmpFaixa;
			} else if (criterioOrdenacao === 'status') {
				const cmpStatus = a.status_inscricao.localeCompare(b.status_inscricao, 'pt-BR');
				if (cmpStatus !== 0) return cmpStatus;
			}

			// Desempate ou ordenação principal por nome (A-Z)
			return a.nome_participante.localeCompare(b.nome_participante, 'pt-BR');
		});

		return lista;
	});

	function rotuloFiltro(filtro: string): string {
		if (filtro === 'confirmadas') return 'Apenas Inscrições Confirmadas';
		if (filtro === 'pendentes') return 'Apenas Inscrições Pendentes';
		return 'Todos os Atletas Inscritos';
	}

	function rotuloOrdenacao(criterio: string): string {
		if (criterio === 'categoria_peso') return 'Categoria & Peso';
		if (criterio === 'faixa') return 'Graduação / Faixa';
		if (criterio === 'status') return 'Status de Confirmação';
		return 'Nome do Judoca (A-Z)';
	}
</script>

<div class="documento-campeonato-container">
	<CabecalhoDocumentoOficial
		{nomeAcademia}
		titulo="Súmula Oficial de Delegação de Atletas"
		subtitulo="Relação de competidores inscritos para pesagem, chaveamento e competição"
		codigoDoc={`CAMP-${campeonato.id_evento}`}
	/>

	<!-- Bloco de Informações do Campeonato & Metadados do Relatório -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 mb-5 rounded-lg border border-zinc-300 bg-zinc-50 text-[11px]">
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Competição / Torneio</span>
			<span class="font-bold text-zinc-900 text-xs">
				{campeonato.nome} {#if campeonato.edicao}({campeonato.edicao}){/if}
			</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Data & Praça Esportiva</span>
			<span class="font-bold text-zinc-900">
				{campeonato.data_inicio} • {campeonato.cidade} / {campeonato.uf}
			</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Filtro de Impressão</span>
			<span class="font-bold text-zinc-900">
				{rotuloFiltro(filtroStatus)}
			</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Critério de Ordenação</span>
			<span class="font-bold text-zinc-900">
				{rotuloOrdenacao(criterioOrdenacao)}
			</span>
		</div>
	</div>

	<!-- Tabela de Competidores da Delegação -->
	<div class="mb-6 overflow-x-auto">
		<table class="w-full border-collapse text-left border border-zinc-300 text-[10px]">
			<thead>
				<tr class="bg-zinc-100 text-zinc-800 border-b border-zinc-300 font-semibold uppercase text-[9px] tracking-wider">
					<th class="py-2 px-1.5 w-7 text-center border-r border-zinc-300">#</th>
					<th class="py-2 px-2.5 border-r border-zinc-300">Competidor (Judoca)</th>
					<th class="py-2 px-2 w-16 border-r border-zinc-300 text-center">Idade</th>
					<th class="py-2 px-2 w-20 border-r border-zinc-300">Faixa</th>
					<th class="py-2 px-2.5 w-36 border-r border-zinc-300">Categoria & Peso</th>
					<th class="py-2 px-2 w-24 border-r border-zinc-300 text-center">Status</th>
					<th class="py-2 px-2.5 w-32 text-center">Pesagem / Visto</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-200">
				{#each atletasFiltrados as atleta, index}
					<tr class="hover:bg-zinc-50 transition-colors">
						<td class="py-2 px-1 text-center border-r border-zinc-200 font-mono text-[9px] text-zinc-500">
							{String(index + 1).padStart(2, '0')}
						</td>
						<td class="py-2 px-2.5 border-r border-zinc-200 font-medium text-zinc-900">
							<span class="font-semibold block">{atleta.nome_participante}</span>
							{#if atleta.menor_idade && atleta.nome_responsavel}
								<span class="text-[8px] text-zinc-500 block">
									Menor • Resp: {atleta.nome_responsavel}
								</span>
							{/if}
						</td>
						<td class="py-2 px-2 border-r border-zinc-200 text-center text-zinc-600 font-mono">
							{atleta.idade} anos
						</td>
						<td class="py-2 px-2 border-r border-zinc-200 font-semibold text-zinc-800">
							{atleta.faixa_participante}
						</td>
						<td class="py-2 px-2.5 border-r border-zinc-200 text-zinc-800">
							{#if atleta.categoria_participante}
								<span class="font-medium block">{atleta.categoria_participante}</span>
							{:else}
								<span class="text-zinc-400 italic">Geral</span>
							{/if}
							{#if atleta.peso_participante}
								<span class="text-[9px] font-mono text-zinc-500">
									Peso ref: {atleta.peso_participante} kg
								</span>
							{/if}
						</td>
						<td class="py-2 px-2 border-r border-zinc-200 text-center">
							{#if atleta.status_inscricao === 'Confirmada'}
								<span class="font-bold text-[9px] text-emerald-800 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
									Confirmada
								</span>
							{:else if atleta.status_inscricao === 'Pendente'}
								<span class="font-bold text-[9px] text-amber-800 uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300">
									Pendente
								</span>
							{:else}
								<span class="font-bold text-[9px] text-zinc-600 uppercase bg-zinc-100 px-1.5 py-0.5 rounded">
									{atleta.status_inscricao}
								</span>
							{/if}
						</td>
						<td class="py-2 px-2 text-center">
							<div class="text-[8px] text-zinc-600 flex items-center justify-center gap-1 font-mono">
								<span>[ &nbsp; ] OK</span>
								<span>_____ kg</span>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="py-6 text-center text-zinc-500 italic">
							Nenhum atleta encontrado na delegação com os filtros selecionados.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Termo de Responsabilidade Técnica e Médica -->
	<div class="evitar-quebra mb-6 p-2.5 rounded border border-zinc-200 bg-zinc-50/70 text-[9px] text-zinc-600">
		<span class="font-bold text-zinc-800 block mb-0.5 uppercase tracking-wide">Declaração da Entidade / Dojo:</span>
		<p class="leading-relaxed">
			Atestamos que todos os atletas relacionados nesta súmula estão regularmente matriculados, em dia com o atestado médico de aptidão física para competição e devidamente autorizados por seus responsáveis legais (quando menores de 18 anos), isentando os organizadores de responsabilidades extracontratuais de acidentes inerentes à prática esportiva competitiva do Judô.
		</p>
	</div>

	<!-- Rodapé: Resumo Numérico e Assinatura Técnica -->
	<div class="evitar-quebra mt-8 pt-4 border-t-2 border-zinc-300">
		<div class="flex items-start justify-between gap-8">
			<!-- Resumo da Delegação -->
			<div class="text-[10px] text-zinc-600 space-y-1">
				<div><strong>Total de Atletas na Lista:</strong> {atletasFiltrados.length}</div>
				<div>
					<strong>Inscrições Confirmadas:</strong> {atletasFiltrados.filter((a) => a.status_inscricao === 'Confirmada').length} &nbsp;&nbsp;|&nbsp;&nbsp;
					<strong>Pendentes:</strong> {atletasFiltrados.filter((a) => a.status_inscricao === 'Pendente').length}
				</div>
				<div class="text-zinc-500 text-[9px] mt-2">
					* Documento gerado eletronicamente pelo Sistema de Gestão Judô Hinodê.
				</div>
			</div>

			<!-- Assinatura do Sensei Responsável pela Delegação -->
			<div class="w-72 text-center shrink-0">
				<div class="h-10 border-b border-zinc-800 mb-1.5"></div>
				<span class="font-bold text-[11px] text-zinc-900 block leading-tight">
					{#if nomeSenseiResponsavel}
						Sensei {nomeSenseiResponsavel}
					{:else}
						Sensei Técnico Responsável
					{/if}
				</span>
				<span class="text-[9px] text-zinc-500 block">
					Chefe de Delegação • Judô Hinodê
				</span>
			</div>
		</div>
	</div>
</div>
