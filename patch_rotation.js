const fs = require('fs');
const path = require('path');

// Procura o index.html na pasta atual ou subpastas
function findFile(dir, name) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      const found = findFile(full, name);
      if (found) return found;
    } else if (item === name) {
      return full;
    }
  }
  return null;
}

const filePath = findFile(process.cwd(), 'index.html');
if (!filePath) { console.log('ERRO: index.html nao encontrado!'); process.exit(1); }

let code = fs.readFileSync(filePath, 'utf8');
console.log('Ficheiro encontrado: ' + filePath);

// CODIGO 1: Funcao findReplacementPair
const newFunction = `
/* ✅ SUBSTITUIÇÃO AUTOMÁTICA DE PARES EM QUARENTENA */
function findReplacementPair(quarantinedPair) {
    const standbyPairs = ALL_TRADING_PAIRS.filter(p =>
        p !== quarantinedPair &&
        pairStates[p] &&
        pairStates[p].status !== 'quarantine' &&
        pairStates[p].status !== 'active' &&
        pairStates[p].status !== 'recovering'
    );
    const watchingPairs = ALL_TRADING_PAIRS.filter(p =>
        p !== quarantinedPair &&
        pairStates[p] &&
        pairStates[p].status === 'watching' &&
        pairStates[p].score > 0
    );
    const candidates = standbyPairs.length > 0 ? standbyPairs : watchingPairs;
    if (candidates.length > 0) {
        let bestCandidate = candidates[0];
        let bestScore = pairStates[candidates[0]].score;
        for (let i = 1; i < candidates.length; i++) {
            if (pairStates[candidates[i]].score > bestScore) {
                bestScore = pairStates[candidates[i]].score;
                bestCandidate = candidates[i];
            }
        }
        const replacement = bestCandidate;
        pairStates[replacement].status = 'active';
        pairStates[replacement].entryPrice = pairStates[replacement].currentPrice;
        pairStates[replacement].peakPrice = pairStates[replacement].currentPrice;
        pairStates[replacement].lowPrice = pairStates[replacement].currentPrice;
        pairStates[replacement].score = 0;
        pairStates[replacement].statusChangedAt = Date.now();
        pairStates[replacement].lastRotationReason = 'Substituiu ' + quarantinedPair + ' (quarentena -2,5%)';
        showAlertPopup('rotation', '🔄 SUBSTITUIÇÃO AUTOMÁTICA', quarantinedPair + ' → QUARENTENA', replacement + ' entrou como novo par ativo', 'rotation');
        console.log('🔄 ROTAÇÃO AUTOMÁTICA: ' + quarantinedPair + ' saiu, ' + replacement + ' entrou');
        return replacement;
    }
    console.warn('⚠️ Nenhum par disponível para substituir ' + quarantinedPair);
    return null;
}
`;

// Verifica se ja existe
if (code.includes('findReplacementPair')) {
    console.log('⚠️ A função findReplacementPair já existe! Não foi duplicada.');
} else {
    // Insere antes de showRotationAlert
    const target = 'function showRotationAlert(pair, newStatus, score) {';
    if (code.includes(target)) {
        code = code.replace(target, newFunction + '\n' + target);
        console.log('✅ Função findReplacementPair inserida com sucesso!');
    } else {
        console.log('ERRO: Não encontrei showRotationAlert para inserir a função!');
        process.exit(1);
    }
}

// CODIGO 2: Adicionar chamada findReplacementPair na linha de quarentena
const oldLine = "showRotationAlert(pair, 'quarantine', state.score);";
const newLine = "showRotationAlert(pair, 'quarantine', state.score); findReplacementPair(pair);";

if (code.includes('findReplacementPair(pair)')) {
    console.log('⚠️ A chamada findReplacementPair(pair) já existe! Não foi duplicada.');
} else {
    if (code.includes(oldLine)) {
        code = code.replace(oldLine, newLine);
        console.log('✅ Chamada findReplacementPair(pair) inserida na quarentena!');
    } else {
        console.log('ERRO: Não encontrei a linha de quarentena!');
        process.exit(1);
    }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('');
console.log('🎉 TUDO FEITO! Ficheiro guardado com sucesso.');
console.log('📁 Ficheiro: ' + filePath);
