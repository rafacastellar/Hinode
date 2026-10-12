<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Trophy,
		Calendar,
		MapPin,
		Users,
		Award,
		ArrowLeft,
		UserPlus,
		CheckCircle2,
		XCircle,
		Clock,
		AlertCircle,
		Medal,
		Swords
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let abaAtiva = $state<'inscricoes' | 'resultados'>('inscricoes');
	let tipoParticipante = $state<'aluno' | 'professor'>('aluno');
	let participanteSelecionado = $state<number | ''>('');
	let carregandoInscricao = $state(false);
	let carregandoResultado = $state(false);

	// Filtra alunos que já estão inscritos para facilitar seleção
	const idsAlunosInscritos = $derived(
		new Set(
			data.inscricoes
				.filter((i) => i.tipo_participante === 'aluno')
				.map((i) => i.id_participante)
		)
	);

	const alunosInscritosDisponiveis = $derived(
		data.inscricoes.filter((i) => i.tipo_participante === 'aluno')
	);
</script>

<svelte:head>
	<title>{data.campeonato.nome} - Gestão do Torneio</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<a
			href="/dashboard/campeonatos"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para Campeonatos</span>
		</a>

		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-2xl">
			<div>
				<div class="flex items-center gap-2 mb-2">
					<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
						{data.campeonato.tipo_campeonato || 'Competição Oficial'}
					</span>
					<span class="text-xs text-zinc-600">•</span>
					<span class="text-xs text-zinc-400 font-mono">Evento #{data.campeonato.id_evento}</span>
				</div>

				<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
					{data.campeonato.nome}
				</h1>
				<p class="text-xs sm:text-sm text-zinc-400 mt-1">
					{data.campeonato.edicao ? `${data.campeonato.edicao} • ` : ''}
					{data.campeonato.logradouro}, {data.campeonato.cidade} - {data.campeonato.uf}
				</p>
			</div>

			<div class="flex items-center gap-3">
				<div class="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Data de Disputa</span>
					<span class="text-xs font-mono font-bold text-white">{data.campeonato.data_inicio}</span>
				</div>
				<div class="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Inscritos do Dojo</span>
					<span class="text-xs font-mono font-bold text-emerald-400">
						{data.inscricoes.length} competidores
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- NAVEGAÇÃO DE ABAS -->
	<div class="flex items-center gap-2 border-b border-zinc-900 pb-2">
		<button
			type="button"
			onclick={() => (abaAtiva = 'inscricoes')}
			class="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all {abaAtiva === 'inscricoes'
				? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm'
				: 'text-zinc-500 hover:text-zinc-300'}"
		>
			Inscrições de Atletas ({data.inscricoes.length})
		</button>

		<button
			type="button"
			onclick={() => (abaAtiva = 'resultados')}
			class="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all {abaAtiva === 'resultados'
				? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm'
				: 'text-zinc-500 hover:text-zinc-300'}"
		>
			Desempenho & Medalhas ({data.resultados.length})
		</button>
	</div>

	<!-- ========================================================================= -->
	<!-- ABA 1: INSCRIÇÕES DE COMPETIDORES -->
	<!-- ========================================================================= -->
	{#if abaAtiva === 'inscricoes'}
		<div class="space-y-6">
			<!-- Alerta de erro de inscrição -->
			{#if form?.erroInscricao}
				<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
					<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
					<span>{form.erroInscricao}</span>
				</div>
			{/if}

			<!-- Formulário de Inscrição Mista (Judoca ou Sensei) -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
				<h3 class="text-xs font-mono uppercase tracking-wider text-zinc-400">
					Inscrever Competidor no Torneio (Misto: Atletas & Professores)
				</h3>

				<form
					action="?/inscrever"
					method="POST"
					use:enhance={() => {
						carregandoInscricao = true;
						return async ({ update }) => {
							await update();
							carregandoInscricao = false;
							participanteSelecionado = '';
						};
					}}
					class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
				>
					<!-- Tipo de Competidor -->
					<div>
						<label for="tipoParticipante" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
							Categoria
						</label>
						<select
							id="tipoParticipante"
							name="tipoParticipante"
							bind:value={tipoParticipante}
							class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
						>
							<option value="aluno">Judoca / Aluno</option>
							<option value="professor">Sensei / Professor</option>
						</select>
					</div>

					<!-- Seleção do Competidor -->
					<div class="sm:col-span-2">
						<label for="idParticipante" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
							Competidor *
						</label>
						<select
							id="idParticipante"
							name="idParticipante"
							bind:value={participanteSelecionado}
							required
							class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
						>
							<option value="">Selecione o participante...</option>
							{#if tipoParticipante === 'aluno'}
								{#each data.alunos as aluno}
									<option value={aluno.id_usuario}>
										{aluno.nome} ({aluno.graduacao_atual}) - {aluno.idade} anos
									</option>
								{/each}
							{:else}
								{#each data.professores as prof}
									<option value={prof.id_usuario}>
										{prof.nome} ({prof.grau_faixa || 'Sensei'})
									</option>
								{/each}
							{/if}
						</select>
					</div>

					<!-- Botão de Inscrição -->
					<div>
						<button
							type="submit"
							disabled={carregandoInscricao || !participanteSelecionado}
							class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all disabled:opacity-50"
						>
							{#if carregandoInscricao}
								<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
								<span>Inscrevendo...</span>
							{:else}
								<UserPlus class="w-4 h-4" />
								<span>Confirmar Inscrição</span>
							{/if}
						</button>
					</div>
				</form>
			</div>

			<!-- TABELA DE INSCRIÇÕES -->
			{#if data.inscricoes.length > 0}
				<div class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
					<div class="overflow-x-auto">
						<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
							<thead class="bg-zinc-900/60 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-900">
								<tr>
									<th class="px-6 py-4">Competidor</th>
									<th class="px-6 py-4">Categoria / Faixa</th>
									<th class="px-6 py-4">Status da Inscrição</th>
									<th class="px-6 py-4 text-right">Gerenciar Status</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-900">
								{#each data.inscricoes as inscricao}
									<tr class="hover:bg-zinc-900/30 transition-colors">
										<td class="px-6 py-4">
											<div class="font-semibold text-white">
												{inscricao.nome_participante}
											</div>
											<span class="text-[10px] font-mono text-zinc-500 uppercase">
												{inscricao.tipo_participante === 'aluno' ? 'Judoca' : 'Professor Competidor'}
											</span>
										</td>

										<td class="px-6 py-4">
											<BadgeFaixa faixa={inscricao.faixa_participante} size="sm" />
										</td>

										<td class="px-6 py-4">
											{#if inscricao.status_inscricao === 'Confirmada'}
												<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-emerald-950/40 border border-emerald-800/80 text-emerald-300">
													<CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
													<span>Confirmada</span>
												</span>
											{:else if inscricao.status_inscricao === 'Pendente'}
												<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-amber-950/40 border border-amber-800/80 text-amber-300">
													<Clock class="w-3.5 h-3.5 text-amber-400" />
													<span>Pendente</span>
												</span>
											{:else}
												<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-zinc-900 border border-zinc-800 text-zinc-500">
													<XCircle class="w-3.5 h-3.5 text-zinc-500" />
													<span>Cancelada</span>
												</span>
											{/if}
										</td>

										<td class="px-6 py-4 text-right">
											<form action="?/alterarStatus" method="POST" use:enhance class="inline-flex items-center gap-1.5">
												<input type="hidden" name="idInscricao" value={inscricao.id_inscricao} />
												{#if inscricao.status_inscricao !== 'Confirmada'}
													<button
														type="submit"
														name="novoStatus"
														value="Confirmada"
														class="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-800 text-[11px] text-emerald-200 transition-colors"
													>
														Confirmar
													</button>
												{/if}
												{#if inscricao.status_inscricao !== 'Cancelada'}
													<button
														type="submit"
														name="novoStatus"
														value="Cancelada"
														class="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-400 transition-colors"
													>
														Cancelar
													</button>
												{/if}
											</form>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else}
				<div class="p-8 rounded-xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
					<Users class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
					<h4 class="text-sm font-bold text-white font-display">Nenhum competidor inscrito ainda</h4>
					<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
						Utilize o formulário acima para inscrever judocas ou professores neste campeonato.
					</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- ABA 2: DESEMPENHO & MEDALHAS (PÓS-CAMPEONATO) -->
	<!-- ========================================================================= -->
	{#if abaAtiva === 'resultados'}
		<div class="space-y-6">
			<!-- Alerta de erro de resultado -->
			{#if form?.erroResultado}
				<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
					<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
					<span>{form.erroResultado}</span>
				</div>
			{/if}

			<!-- Formulário de Lançamento de Resultado Pós-Campeonato -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
				<div class="flex items-center gap-2">
					<Medal class="w-4 h-4 text-amber-500" />
					<h3 class="text-xs font-mono uppercase tracking-wider text-zinc-400">
						Lançar Desempenho do Judoca (Pós-Torneio)
					</h3>
				</div>

				<form
					action="?/lancarResultado"
					method="POST"
					use:enhance={() => {
						carregandoResultado = true;
						return async ({ update }) => {
							await update();
							carregandoResultado = false;
						};
					}}
					class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
				>
					<div>
						<label for="idAlunoResultado" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
							Judoca Competidor *
						</label>
						<select
							id="idAlunoResultado"
							name="idAluno"
							required
							class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
						>
							<option value="">Selecione o atleta...</option>
							{#each alunosInscritosDisponiveis as inscr}
								<option value={inscr.id_participante}>
									{inscr.nome_participante} ({inscr.faixa_participante})
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="classificacaoAluno" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
							Classificação / Pódio *
						</label>
						<select
							id="classificacaoAluno"
							name="classificacaoAluno"
							required
							class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
						>
							<option value="Ouro / Campeão">🥇 Ouro / Campeão</option>
							<option value="Prata / Vice-Campeão">🥈 Prata / Vice-Campeão</option>
							<option value="Bronze (3º Lugar)">🥉 Bronze (3º Lugar)</option>
							<option value="5º Lugar">5º Lugar</option>
							<option value="Participação">Participação</option>
						</select>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div>
							<label for="qtdLutas" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
								Lutas *
							</label>
							<input
								type="number"
								id="qtdLutas"
								name="qtdLutas"
								required
								min="0"
								value="3"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-red-600"
							/>
						</div>
						<div>
							<label for="qtdVitorias" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
								Vitórias *
							</label>
							<input
								type="number"
								id="qtdVitorias"
								name="qtdVitorias"
								required
								min="0"
								value="2"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-red-600"
							/>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={carregandoResultado}
							class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all disabled:opacity-50"
						>
							{#if carregandoResultado}
								<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
								<span>Gravando...</span>
							{:else}
								<Medal class="w-4 h-4" />
								<span>Salvar Resultado</span>
							{/if}
						</button>
					</div>
				</form>
			</div>

			<!-- QUADRO DE MEDALHAS DO TORNEIO -->
			{#if data.resultados.length > 0}
				<div class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
					<div class="overflow-x-auto">
						<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
							<thead class="bg-zinc-900/60 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-900">
								<tr>
									<th class="px-6 py-4">Judoca</th>
									<th class="px-6 py-4">Faixa</th>
									<th class="px-6 py-4">Classificação / Medalha</th>
									<th class="px-6 py-4 font-mono text-center">Lutas Disputadas</th>
									<th class="px-6 py-4 font-mono text-center">Vitórias</th>
									<th class="px-6 py-4 font-mono text-right">Aproveitamento</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-900">
								{#each data.resultados as res}
									{@const aproveitamento = res.qtd_lutas > 0 ? Math.round((res.qtd_vitorias / res.qtd_lutas) * 100) : 0}
									<tr class="hover:bg-zinc-900/30 transition-colors">
										<td class="px-6 py-4 font-semibold text-white">
											{res.nome_aluno}
										</td>

										<td class="px-6 py-4">
											<BadgeFaixa faixa={res.faixa_aluno} size="sm" />
										</td>

										<td class="px-6 py-4">
											<span class="font-bold {res.classificacao_aluno.includes('Ouro') ? 'text-amber-400' : res.classificacao_aluno.includes('Prata') ? 'text-zinc-300' : res.classificacao_aluno.includes('Bronze') ? 'text-amber-600' : 'text-zinc-400'}">
												{res.classificacao_aluno}
											</span>
										</td>

										<td class="px-6 py-4 font-mono text-center text-zinc-300">
											{res.qtd_lutas}
										</td>

										<td class="px-6 py-4 font-mono text-center text-emerald-400 font-bold">
											{res.qtd_vitorias}
										</td>

										<td class="px-6 py-4 font-mono text-right text-zinc-300">
											{aproveitamento}%
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else}
				<div class="p-8 rounded-xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
					<Medal class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
					<h4 class="text-sm font-bold text-white font-display">Sem resultados lançados</h4>
					<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
						Após a realização dos combates, lance o desempenho dos atletas acima para alimentar o quadro de medalhas.
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
