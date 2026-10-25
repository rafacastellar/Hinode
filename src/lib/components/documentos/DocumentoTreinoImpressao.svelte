<script lang="ts">
	import CabecalhoDocumentoOficial from './CabecalhoDocumentoOficial.svelte';
	import type { TurmaDetalhada } from '#lib/server/repositorios/turma.repo';

	interface Props {
		nomeAcademia?: string;
		turma: TurmaDetalhada;
	}

	let { nomeAcademia = 'Judô Hinodê', turma }: Props = $props();
</script>

<div class="documento-treino-container">
	<CabecalhoDocumentoOficial
		{nomeAcademia}
		titulo="Lista de Chamada & Controle de Treino"
		subtitulo="Relação oficial de alunos matriculados para instrução no tatame"
		codigoDoc={`TR-${turma.id_treino}`}
	/>

	<!-- Bloco de Informações do Treino -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 mb-5 rounded-lg border border-zinc-300 bg-zinc-50 text-[11px]">
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Turma / Descrição</span>
			<span class="font-bold text-zinc-900 text-xs">{turma.descricao}</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Dia & Horário</span>
			<span class="font-bold text-zinc-900">{turma.dia_semana} • {turma.horario_inicio} às {turma.horario_fim}</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Professores / Senseis</span>
			<span class="font-bold text-zinc-900">
				{#if turma.professores.length > 0}
					{turma.professores.map((p) => p.nome).join(', ')}
				{:else}
					A definir
				{/if}
			</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Data da Aula / Sessão</span>
			<span class="font-bold text-zinc-900 font-mono">____ / ____ / 2026</span>
		</div>
	</div>

	<!-- Tabela de Chamada dos Alunos -->
	<div class="mb-6">
		<table class="w-full border-collapse text-left border border-zinc-300 text-[11px]">
			<thead>
				<tr class="bg-zinc-100 text-zinc-800 border-b border-zinc-300 font-semibold uppercase text-[10px] tracking-wider">
					<th class="py-2 px-2.5 w-8 text-center border-r border-zinc-300">#</th>
					<th class="py-2 px-2.5 w-20 border-r border-zinc-300 font-mono">Matrícula</th>
					<th class="py-2 px-2.5 border-r border-zinc-300">Nome do Judoca</th>
					<th class="py-2 px-2.5 w-24 border-r border-zinc-300">Faixa</th>
					<th class="py-2 px-2.5 w-20 border-r border-zinc-300 text-center">Idade</th>
					<th class="py-2 px-2.5 w-28 border-r border-zinc-300">Categoria / Peso</th>
					<th class="py-2 px-2.5 w-36 text-center">Visto / Assinatura</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-200">
				{#each turma.alunos_matriculados as aluno, index}
					<tr class="hover:bg-zinc-50 transition-colors">
						<td class="py-2 px-2 text-center border-r border-zinc-200 font-mono text-[10px] text-zinc-500">
							{String(index + 1).padStart(2, '0')}
						</td>
						<td class="py-2 px-2.5 border-r border-zinc-200 font-mono text-[10px] text-zinc-700">
							{aluno.matricula || '—'}
						</td>
						<td class="py-2 px-2.5 border-r border-zinc-200 font-medium text-zinc-900">
							{aluno.nome}
						</td>
						<td class="py-2 px-2.5 border-r border-zinc-200 font-semibold text-zinc-800">
							{aluno.graduacao_atual}
						</td>
						<td class="py-2 px-2.5 border-r border-zinc-200 text-center text-zinc-600">
							{aluno.idade ? `${aluno.idade} anos` : '—'}
						</td>
						<td class="py-2 px-2.5 border-r border-zinc-200 text-zinc-700">
							{aluno.categoria || '—'}
							{#if aluno.peso}
								<span class="text-[9px] text-zinc-500 font-mono block">({aluno.peso} kg)</span>
							{/if}
						</td>
						<td class="py-2 px-2.5 border-b border-zinc-200 text-center">
							<!-- Linha de assinatura/presença -->
							<div class="h-5 border-b border-dashed border-zinc-400 mx-2"></div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="py-6 text-center text-zinc-500 italic">
							Nenhum aluno matriculado nesta turma até o momento.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Bloco de Rodapé: Resumo e Assinatura -->
	<div class="evitar-quebra mt-8 pt-4 border-t-2 border-zinc-300">
		<div class="flex items-start justify-between gap-8">
			<!-- Resumo da Chamada -->
			<div class="text-[10px] text-zinc-600 space-y-1">
				<div><strong>Total de Alunos Matriculados:</strong> {turma.alunos_matriculados.length}</div>
				<div><strong>Presentes:</strong> [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] &nbsp;&nbsp; <strong>Ausentes:</strong> [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</div>
				<div class="text-zinc-500 text-[9px] mt-2">
					* Lista gerada automaticamente pelo Sistema Hinodê para controle pedagógico e frequência de treinos.
				</div>
			</div>

			<!-- Campo de Assinatura do Sensei -->
			<div class="w-64 text-center shrink-0">
				<div class="h-10 border-b border-zinc-800 mb-1.5"></div>
				<span class="font-bold text-[11px] text-zinc-900 block leading-tight">
					Assinatura do Sensei / Professor
				</span>
				<span class="text-[9px] text-zinc-500">
					Responsável Técnico da Sessão
				</span>
			</div>
		</div>
	</div>
</div>
