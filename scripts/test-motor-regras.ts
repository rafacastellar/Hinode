import { obterClassificacaoJudo, calcularDivisao, calcularIdadeCivil } from '../src/lib/dominio/regras-categoria-peso';

function assertEqual(actual: any, expected: any, msg: string) {
	if (actual !== expected) {
		console.error(`❌ FAIL: ${msg}\n   Expected: "${expected}"\n   Actual:   "${actual}"`);
		process.exit(1);
	} else {
		console.log(`✅ PASS: ${msg} => "${actual}"`);
	}
}

console.log('--- TESTANDO MOTOR DE REGRAS DE JUDÔ (CBJ / FPJ) ---\n');

// 1. Teste de idade civil
// Ano corrente para os testes = 2026
const anoVigente = 2026;
assertEqual(calcularIdadeCivil('2018-05-15', anoVigente), 8, 'Idade civil 2018 em 2026 deve ser 8');
assertEqual(calcularIdadeCivil('2011-12-31', anoVigente), 15, 'Idade civil 2011 em 2026 deve ser 15');
assertEqual(calcularIdadeCivil('1990-01-01', anoVigente), 36, 'Idade civil 1990 em 2026 deve ser 36');

// 2. Menor de 7 anos -> Festival
const resFestival = obterClassificacaoJudo({
	dataNascimento: '2021-03-10', // 5 anos
	genero: 'M',
	peso: 20.0,
	graduacao: 'Branca',
	anoVigente
});
assertEqual(resFestival.categoriaCompleta, 'Festival / Pré-Judô', 'Menor de 7 anos deve ser Festival');
assertEqual(resFestival.divisao, 'Aspirante', 'Festival deve ser Aspirante');

// 3. Sub-9 Masculino
// Pesos: Extra-Ligeiro <= 23, Super-Ligeiro <= 26, Ligeiro <= 29, Meio-Leve <= 32, Leve <= 36, Meio-Médio <= 40, Médio <= 45, Meio-Pesado <= 50, Pesado > 50
const resSub9_1 = obterClassificacaoJudo({
	dataNascimento: '2018-06-01', // 8 anos -> Sub-9
	genero: 'M',
	peso: 23.0,
	graduacao: 'Cinza',
	anoVigente
});
assertEqual(resSub9_1.categoriaCompleta, 'Sub-9 Extra-Ligeiro (-23kg)', 'Sub-9 M 23.0kg deve ser Extra-Ligeiro');
assertEqual(resSub9_1.divisao, 'Aspirante', 'Faixa Cinza deve ser Aspirante');

const resSub9_2 = obterClassificacaoJudo({
	dataNascimento: '2018-06-01',
	genero: 'M',
	peso: 51.5,
	graduacao: 'Amarela',
	anoVigente
});
assertEqual(resSub9_2.categoriaCompleta, 'Sub-9 Pesado (+50kg)', 'Sub-9 M 51.5kg deve ser Pesado');

// 4. Sub-15 Feminino
// Pesos: Super-Ligeiro <= 32, Ligeiro <= 36, Meio-Leve <= 40, Leve <= 44, Meio-Médio <= 48, Médio <= 53, Meio-Pesado <= 58, Pesado <= 64, Super-Pesado > 64
const resSub15_F = obterClassificacaoJudo({
	dataNascimento: '2012-08-10', // 14 anos -> Sub-15
	genero: 'F',
	peso: 43.5,
	graduacao: 'Verde',
	anoVigente
});
assertEqual(resSub15_F.categoriaCompleta, 'Sub-15 Leve (-44kg)', 'Sub-15 F 43.5kg deve ser Leve');
assertEqual(resSub15_F.divisao, 'Aspirante', 'Faixa Verde deve ser Aspirante');

// 5. Sub-18 Masculino
// Pesos: Super-Ligeiro <= 50, Ligeiro <= 55, Meio-Leve <= 60, Leve <= 66, Meio-Médio <= 73, Médio <= 81, Meio-Pesado <= 90, Pesado > 90
const resSub18_M = obterClassificacaoJudo({
	dataNascimento: '2010-02-14', // 16 anos -> Sub-18
	genero: 'M',
	peso: 65.8,
	graduacao: 'Roxa',
	anoVigente
});
assertEqual(resSub18_M.categoriaCompleta, 'Sub-18 Leve (-66kg)', 'Sub-18 M 65.8kg deve ser Leve');
assertEqual(resSub18_M.divisao, 'Especial', 'Faixa Roxa deve ser Especial');

// 6. Sênior Masculino
const resSenior_M = obterClassificacaoJudo({
	dataNascimento: '2001-09-20', // 25 anos -> Sênior
	genero: 'M',
	peso: 79.5,
	graduacao: 'Preta 1º Dan',
	anoVigente
});
assertEqual(resSenior_M.categoriaCompleta, 'Sênior Meio-Médio (-81kg)', 'Sênior M 79.5kg deve ser Meio-Médio');
assertEqual(resSenior_M.divisao, 'Especial', 'Faixa Preta deve ser Especial');

// 7. Master 2 Masculino (35 a 39 anos)
const resMaster2_M = obterClassificacaoJudo({
	dataNascimento: '1989-04-12', // 37 anos -> Master 2
	genero: 'M',
	peso: 89.0,
	graduacao: 'Marrom',
	anoVigente
});
assertEqual(resMaster2_M.categoriaCompleta, 'Master 2 Médio (-90kg)', 'Master 2 M 89.0kg deve ser Médio');
assertEqual(resMaster2_M.divisao, 'Especial', 'Faixa Marrom deve ser Especial');

console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
