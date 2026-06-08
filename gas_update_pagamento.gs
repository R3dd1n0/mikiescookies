/**
 * Mikies Cookies — Patch GAS: confirmação de pedido + botão "Já fiz o Pix"
 * Acompanha as mudanças do index.html (jun/2026).
 *
 * ────────────────────────────────────────────────────────────────────────────
 * LEIA ANTES DE COLAR
 * ────────────────────────────────────────────────────────────────────────────
 * Este arquivo foi reconstruído a partir da última versão do .gs que esteve no
 * Git (v1.0.0). A versão que roda HOJE na plataforma é mais nova (tem CRM /
 * consolidarClientes, /pendentes, consulta de status e avaliação por token).
 *
 *   ⚠️ NÃO substitua o arquivo inteiro. Aplique apenas os 4 deltas abaixo e
 *      MANTENHA suas funções de status / avaliação / CRM como estão.
 *
 * Os 4 deltas:
 *   (A) doGet           → passa a responder JSONP (callback) também para pedidos
 *                         e roteia o novo tipo:'pago'
 *   (B) salvarPedido    → retorna o NÚMERO do pedido (1 linha alterada)
 *   (C) avisarPagamento → NOVA função (notifica o Telegram no "Já fiz o Pix")
 *   (D) _jsonpOut       → NOVO helper (embrulha a resposta no callback)
 *
 * Depois de colar:
 *   1. Salvar
 *   2. Implantar → Gerenciar implantações → editar (lápis) → Versão: "Nova
 *      versão" → Implantar.  ⚠️ Use ESTE caminho para manter a MESMA URL
 *      (uma implantação nova geraria outra URL e quebraria o SHEETS_URL do site).
 *   3. Rodar criarTriggers() uma vez (não há trigger novo, mas mantém o hábito).
 */


// ════════════════════════════════════════════════════════════════════════════
// (D) HELPER NOVO — resposta JSONP quando há ?callback=, senão JSON puro
// ════════════════════════════════════════════════════════════════════════════
function _jsonpOut(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}


// ════════════════════════════════════════════════════════════════════════════
// (A) doGet — callback-aware + rota tipo:'pago'
//
//     ⟵ AJUSTE: troque consultarStatus / registrarAvaliacao pelos nomes reais
//        das suas funções de status e avaliação.
//     ⟵ SE as suas já devolvem um ContentService pronto (com o callback embutido),
//        retorne-as direto:  return consultarStatus(data);
//        Use o _jsonpOut só se elas retornarem um OBJETO simples.
// ════════════════════════════════════════════════════════════════════════════
function doGet(e) {
  const callback = e.parameter && e.parameter.callback;

  if (!e.parameter || !e.parameter.data) {
    return _jsonpOut({ status: 'ok', message: 'Mikies Cookies API funcionando!' }, callback);
  }

  let data;
  try {
    data = JSON.parse(e.parameter.data);
  } catch (err) {
    return _jsonpOut({ ok: false, error: 'JSON invalido' }, callback);
  }

  try {
    switch (data.tipo) {
      case 'status':
        return _jsonpOut(consultarStatus(data), callback);      // ⟵ ajuste o nome
      case 'avaliacao':
        return _jsonpOut(registrarAvaliacao(data), callback);   // ⟵ ajuste o nome
      case 'pago':
        avisarPagamento(data);
        return _jsonpOut({ ok: true }, callback);
      default: {
        // pedido normal (sem 'tipo'): grava e devolve o número
        const numero = salvarPedido(data);
        return _jsonpOut({ ok: true, pedido: numero }, callback);
      }
    }
  } catch (err) {
    return _jsonpOut({ ok: false, error: String(err) }, callback);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// (B) salvarPedido — ÚNICA mudança necessária: RETORNAR o número do pedido.
//
//     Na sua função atual, troque o final:
//         return ContentService.createTextOutput(...);   // ❌ antigo
//     por:
//         return numeroPedido;                           // ✅ novo
//
//     O doGet acima é quem monta a resposta HTTP/JSONP agora.
//     (Se a sua variável tiver outro nome, retorne o nº do pedido equivalente.)
//
//     Versão de referência completa — confira se a SUA já grava ocasião (Q=17),
//     mensagem do cartão (R=18) e quando (S=19); se não gravar, inclua estas 3:
// ════════════════════════════════════════════════════════════════════════════
function salvarPedido(data) {
  const sheet        = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
  const lastRow      = Math.max(ultimaLinhaColunaA(sheet), 3);
  const newRow       = lastRow + 1;
  const numeroPedido = newRow - 3;

  sheet.getRange(newRow, 2, 1, 8).setValues([[
    new Date(),             // B  Data
    data.nome        || '', // C  Nome
    data.whatsapp    || '', // D  WhatsApp
    data.choc_branco || 0,  // E  Choc. Branco
    data.choc_leite  || 0,  // F  Choc. Leite
    data.dark        || 0,  // G  Dark
    data.red_velvet  || 0,  // H  Red Velvet
    data.berry       || 0,  // I  Berry
  ]]);
  // J, K, M são fórmulas — não tocar
  sheet.getRange(newRow, 12).setValue(Number(data.frete) || 0);    // L  Frete
  sheet.getRange(newRow, 15).setValue('Aguardando');               // O  Status Pix
  sheet.getRange(newRow, 16).setValue('Pix ainda não confirmado'); // P  Status Pedido
  sheet.getRange(newRow, 17).setValue(data.ocasiao        || '');  // Q  Ocasião
  sheet.getRange(newRow, 18).setValue(data.mensagemCartao || '');  // R  Mensagem Cartão
  sheet.getRange(newRow, 19).setValue(data.quando         || '');  // S  Quando
  sheet.getRange(newRow, 1).setValue(numeroPedido);                // A  # Pedido

  sheet.getRange(newRow, 2).setNumberFormat('dd/MM/yyyy HH:mm');
  sheet.getRange(newRow, 12).setNumberFormat('"R$ "#.##0,00');

  enviarTelegram({
    numero: numeroPedido, nome: data.nome, whatsapp: data.whatsapp,
    entrega: data.entrega, frete: data.frete, subtotal: data.subtotal, total: data.total,
    quando: data.quando, ocasiao: data.ocasiao,
    choc_branco: data.choc_branco, choc_leite: data.choc_leite,
    dark: data.dark, red_velvet: data.red_velvet, berry: data.berry,
  });

  return numeroPedido; // ✅ o doGet usa isto para responder { ok:true, pedido:N }
}


// ════════════════════════════════════════════════════════════════════════════
// (C) NOVA — aviso no Telegram quando o cliente clica em "Já fiz o Pix".
//     Autossuficiente: lê token/chat/tópico direto das Propriedades do script,
//     então não depende da assinatura do seu _postTelegram.
// ════════════════════════════════════════════════════════════════════════════
function avisarPagamento(data) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_BOT_TOKEN');
  const chat  = props.getProperty('TELEGRAM_CHAT_ID');
  const topic = props.getProperty('TELEGRAM_TOPIC_STATUS'); // tópico Status (opcional)
  if (!token || !chat) return;

  const wa    = String(data.whatsapp || '').replace(/\D/g, '');
  const total = Number(data.total || 0).toFixed(2).replace('.', ',');
  const ref   = data.pedido ? ('Pedido #' + data.pedido) : (data.nome || 'Cliente');

  const texto =
    '💸 Cliente avisou que FEZ O PIX\n\n' +
    '🆔 ' + ref + '\n' +
    '👤 ' + (data.nome || '—') + '\n' +
    '📞 ' + (wa || '—') + '\n' +
    '💰 Total: R$ ' + total + '\n\n' +
    '⚠️ Confirme o comprovante antes de marcar como Pago.';

  const payload = { chat_id: chat, text: texto };
  if (topic) payload.message_thread_id = Number(topic);

  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}
