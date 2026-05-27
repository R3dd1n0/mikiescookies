// MIKIES COOKIES - BOT TELEGRAM (POLLING)

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    TELEGRAM_BOT_TOKEN: props.getProperty('TELEGRAM_BOT_TOKEN'),
    TELEGRAM_CHAT_ID:   props.getProperty('TELEGRAM_CHAT_ID'),
  };
}

function buscarUpdates() {
  const cfg    = getConfig();
  const props  = PropertiesService.getScriptProperties();
  const offset = parseInt(props.getProperty('TELEGRAM_OFFSET') || '0', 10);
  const url    = `https://api.telegram.org/bot${cfg.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=0&limit=10`;
  let response;
  try {
    response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  } catch(err) {
    Logger.log('Erro ao buscar updates: ' + err);
    return;
  }
  const data = JSON.parse(response.getContentText());
  if (!data.ok || !data.result.length) return;
  for (const update of data.result) {
    props.setProperty('TELEGRAM_OFFSET', String(update.update_id + 1));
    if (update.message) responderBot(update.message);
  }
}

function relatorioDiario() {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  _gerarRelatorio(ontem, null, null, true);
}

function relatorioHoje(chatId, messageId) {
  _gerarRelatorio(new Date(), chatId, messageId, false);
}

function _gerarRelatorio(data, chatId, messageId, automatico) {
  const cfg     = getConfig();
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
  const lastRow = sheet.getLastRow();
  const inicio  = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0);
  const fim     = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59);
  const dataFormatada = Utilities.formatDate(data, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  const titulo = automatico
    ? `📊 RELATÓRIO AUTOMÁTICO — ${dataFormatada}`
    : `📊 RELATÓRIO — ${dataFormatada}`;
  if (lastRow < 4) {
    _postTelegram(cfg, `${titulo}\n\nNenhum pedido encontrado.`, chatId, messageId);
    return;
  }
  const dados = sheet.getRange(4, 1, lastRow - 3, 16).getValues();
  let totalGeral = 0;
  let qtdPedidos = 0;
  const sabores = {
    choc_branco: { nome: 'Chocolate Branco',   qtd: 0 },
    choc_leite:  { nome: 'Chocolate ao Leite', qtd: 0 },
    dark:        { nome: 'Dark',               qtd: 0 },
    red_velvet:  { nome: 'Red Velvet',         qtd: 0 },
    berry:       { nome: 'Berry',              qtd: 0 },
  };
  for (const row of dados) {
    const dataPedido = row[1];
    if (!(dataPedido instanceof Date)) continue;
    if (dataPedido < inicio || dataPedido > fim) continue;
    if (row[15] === 'Cancelado') continue;  // col 16: Status Pedido
    qtdPedidos++;
    totalGeral              += Number(row[12]) || Number(row[10]) || 0;  // col 13 Total c/ Frete; fallback col 11
    sabores.choc_branco.qtd += Number(row[4])  || 0;
    sabores.choc_leite.qtd  += Number(row[5])  || 0;
    sabores.dark.qtd        += Number(row[6])  || 0;
    sabores.red_velvet.qtd  += Number(row[7])  || 0;
    sabores.berry.qtd       += Number(row[8])  || 0;
  }
  if (qtdPedidos === 0) {
    _postTelegram(cfg, `${titulo}\n\nNenhum pedido no período.`, chatId, messageId);
    return;
  }
  const linhasSabores = Object.values(sabores)
    .filter(s => s.qtd > 0)
    .map(s => `• ${s.nome}: ${s.qtd} un`)
    .join('\n');
  const totalFormatado = Number(totalGeral).toFixed(2).replace('.', ',');
  _postTelegram(cfg,
`${titulo}

🛒 Pedidos recebidos: ${qtdPedidos}

🍪 Cookies vendidos:
${linhasSabores}

💰 Total faturado: R$ ${totalFormatado}`,
    chatId, messageId
  );
}

function responderBot(message) {
  const cfg       = getConfig();
  const chatId    = message.chat.id;
  const messageId = message.message_id;
  if (message.from && message.from.is_bot) return;
  const texto = (message.text || '').trim();
  if (!texto.startsWith('/')) return;
  if (String(chatId) !== String(cfg.TELEGRAM_CHAT_ID)) {
    _postTelegram(cfg, '⛔ Acesso não autorizado.', chatId, messageId);
    return;
  }
  if (/^\/relatorio(?:@\S+)?$/i.test(texto)) {
    relatorioHoje(chatId, messageId);
    return;
  }
  if (/^\/consultarpedido(?:@\S+)?$/i.test(texto)) {
    _postTelegram(cfg,
      '❌ Número do pedido não informado.\nExemplo: /consultarpedido 42',
      chatId, messageId
    );
    return;
  }
  const match = texto.match(/^\/consultarpedido(?:@\S+)?\s+(\d+)$/i);
  if (match) {
    const numero = parseInt(match[1], 10);
    if (isNaN(numero) || numero <= 0) {
      _postTelegram(cfg, '❌ Número inválido.\nExemplo: /consultarpedido 42', chatId, messageId);
      return;
    }
    const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
    const pedido = buscarPedido(sheet, numero);
    if (!pedido) {
      _postTelegram(cfg, `❌ Pedido #${numero} não encontrado.`, chatId, messageId);
      return;
    }
    const itens = [
      pedido.choc_branco > 0 && `• Chocolate Branco: ${pedido.choc_branco}`,
      pedido.choc_leite  > 0 && `• Chocolate ao Leite: ${pedido.choc_leite}`,
      pedido.dark        > 0 && `• Dark: ${pedido.dark}`,
      pedido.red_velvet  > 0 && `• Red Velvet: ${pedido.red_velvet}`,
      pedido.berry       > 0 && `• Berry: ${pedido.berry}`,
    ].filter(Boolean).join('\n');
    const frete    = Number(pedido.frete    || 0).toFixed(2).replace('.', ',');
    const subtotal = Number(pedido.subtotal || 0).toFixed(2).replace('.', ',');
    const total    = Number(pedido.total    || 0).toFixed(2).replace('.', ',');
    const statusPix  = STATUS_PIX[pedido.statusPix]    || { emoji: '❓', descricao: pedido.statusPix };
    const statusProd = STATUS_PEDIDO[pedido.statusProd] || { emoji: '❓', descricao: pedido.statusProd };
    _postTelegram(cfg,
`🍪 PEDIDO #${numero}

👤 ${pedido.nome}
📞 ${pedido.whatsapp}

🛒 Itens:
${itens}

💵 Subtotal: R$ ${subtotal}
🚀 Frete: R$ ${frete}
💰 Total: R$ ${total}

💳 Pagamento: ${statusPix.emoji} ${statusPix.descricao}
📦 Produção: ${statusProd.emoji} ${statusProd.descricao}`,
      chatId, messageId
    );
  }
}

const STATUS_PIX = {
  'Aguardando': { emoji: '⏳', descricao: 'Pix ainda não confirmado' },
  'Pago':       { emoji: '✅', descricao: 'Comprovante recebido'          },
  'Cancelado':  { emoji: '🚫', descricao: 'Pedido cancelado'        },
};

const STATUS_PEDIDO = {
  'Pix ainda não confirmado': { emoji: '⏳', descricao: 'Aguardando confirmação do pagamento' },
  'Em produção':         { emoji: '👩‍🍳', descricao: 'Recebido, sendo produzido' },
  'Pronto':                        { emoji: '📦', descricao: 'Pronto p/ entrega/retirada'               },
  'Entregue':                      { emoji: '🎉', descricao: 'Pedido finalizado'                         },
  'Cancelado':                     { emoji: '🚫', descricao: 'Pedido cancelado'                          },
};

// Silencio entre 22h e 7h (horario de Fortaleza)
function _emHorarioSilencioso() {
  const hora = parseInt(Utilities.formatDate(new Date(), 'America/Fortaleza', 'H'), 10);
  return hora >= 22 || hora < 7;
}

function onEditInstalavel(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== 'Pedidos') return;
  const col = e.range.getColumn();
  const row = e.range.getRow();
  if (row < 4 || (col !== 15 && col !== 16)) return;
  const novoValor = e.value;
  if (!novoValor || novoValor.trim() === '') return;
  const numeroPedido = sheet.getRange(row, 1).getValue();
  const nomeCliente  = sheet.getRange(row, 3).getValue();
  if (!numeroPedido || !nomeCliente) return;
  const mapa = col === 13 ? STATUS_PIX : STATUS_PEDIDO;
  if (!mapa[novoValor]) return;
  const cfg   = getConfig();
  const label = col === 13 ? 'Pagamento' : 'Produção';
  const info  = mapa[novoValor];
  _postTelegram(cfg,
`${info.emoji} PEDIDO #${numeroPedido} — ${label} atualizado

👤 ${nomeCliente}
📋 ${label}: ${info.descricao}`
  );
}

function doGet(e) {
  if (e.parameter && e.parameter.data) {
    try {
      return salvarPedido(JSON.parse(e.parameter.data));
    } catch(err) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'JSON invalido: ' + err }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Mikies Cookies API funcionando!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    return salvarPedido(JSON.parse(e.postData.contents));
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ultimaLinhaColunaA(sheet) {
  const ultimaLinhaTotal = sheet.getLastRow();
  if (ultimaLinhaTotal === 0) return 0;
  const valores = sheet.getRange(1, 1, ultimaLinhaTotal, 1).getValues();
  for (let i = valores.length - 1; i >= 0; i--) {
    if (valores[i][0] !== '') return i + 1;
  }
  return 0;
}

function salvarPedido(data) {
  try {
    const sheet        = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
    const lastRow      = Math.max(ultimaLinhaColunaA(sheet), 3);
    const newRow       = lastRow + 1;
    const numeroPedido = newRow - 3;
    const rowData = [
      new Date(),             // col 2: data
      data.nome        || '', // col 3: nome
      data.whatsapp    || '', // col 4: whatsapp
      data.choc_branco || 0,  // col 5: choc branco
      data.choc_leite  || 0,  // col 6: choc leite
      data.dark        || 0,  // col 7: dark
      data.red_velvet  || 0,  // col 8: red velvet
      data.berry       || 0,  // col 9: berry
      // cols 10-11: formula (nao tocar)
    ];
    sheet.getRange(newRow, 2, 1, 8).setValues([rowData]);
    sheet.getRange(newRow, 12).setValue(Number(data.frete)    || 0);  // Frete
    sheet.getRange(newRow, 13).setValue(Number(data.total)    || 0);  // Total c/ Frete
    // col 14 (Valor Confirmado) — deixar em branco; preenchimento manual apos confirmar pagamento
    sheet.getRange(newRow, 15).setValue('Aguardando');
    sheet.getRange(newRow, 16).setValue('Pix ainda não confirmado');
    sheet.getRange(newRow, 2).setNumberFormat('DD/MM/YYYY');
    sheet.getRange(newRow, 12).setNumberFormat('"R$ "#.##0,00');
    sheet.getRange(newRow, 13).setNumberFormat('"R$ "#.##0,00');
    sheet.getRange(newRow, 1).setValue(numeroPedido);
    enviarTelegram({
      numero:      numeroPedido,
      nome:        data.nome,
      whatsapp:    data.whatsapp,
      entrega:     data.entrega,
      frete:       data.frete,
      subtotal:    data.subtotal,
      total:       data.total,
      choc_branco: data.choc_branco,
      choc_leite:  data.choc_leite,
      dark:        data.dark,
      red_velvet:  data.red_velvet,
      berry:       data.berry,
    });
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', row: newRow }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function enviarTelegram(pedido) {
  const cfg = getConfig();
  const itens = [
    pedido.choc_branco > 0 && `• Chocolate Branco: ${pedido.choc_branco}`,
    pedido.choc_leite  > 0 && `• Chocolate ao Leite: ${pedido.choc_leite}`,
    pedido.dark        > 0 && `• Dark: ${pedido.dark}`,
    pedido.red_velvet  > 0 && `• Red Velvet: ${pedido.red_velvet}`,
    pedido.berry       > 0 && `• Berry: ${pedido.berry}`,
  ].filter(Boolean).join('\n');
  const frete    = Number(pedido.frete    || 0).toFixed(2).replace('.', ',');
  const subtotal = Number(pedido.subtotal || 0).toFixed(2).replace('.', ',');
  const total    = Number(pedido.total    || 0).toFixed(2).replace('.', ',');
  const entrega  = pedido.entrega || 'Não informado';
  _postTelegram(cfg,
`🍪 NOVO PEDIDO NO SITE

🆔 Pedido #${pedido.numero}
👤 ${pedido.nome}
📞 ${pedido.whatsapp}

🛒 Itens:
${itens}

🚚 Entrega: ${entrega}
💵 Subtotal: R$ ${subtotal}
🚀 Frete: R$ ${frete}
💰 Total: R$ ${total}

⚠️ Aguardando contato via WhatsApp.`
  );
}

function buscarPedido(sheet, numero) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 4) return null;
  const dados = sheet.getRange(4, 1, lastRow - 3, 16).getValues();
  for (const row of dados) {
    if (row[0] === numero) {
      return {
        nome:        row[2],
        whatsapp:    row[3],
        choc_branco: row[4],
        choc_leite:  row[5],
        dark:        row[6],
        red_velvet:  row[7],
        berry:       row[8],
        subtotal:    row[10],  // col 11: Total Produtos (formula)
        frete:       row[11],  // col 12: Frete
        total:       row[12],  // col 13: Total c/ Frete
        statusPix:   row[14],  // col 15: Status Pix
        statusProd:  row[15],  // col 16: Status Pedido
      };
    }
  }
  return null;
}

function _postTelegram(cfg, text, chatId, replyToMessageId) {
  try {
    const payload = { chat_id: chatId || cfg.TELEGRAM_CHAT_ID, text };
    if (replyToMessageId) payload.reply_to_message_id = replyToMessageId;
    UrlFetchApp.fetch(
      `https://api.telegram.org/bot${cfg.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      }
    );
  } catch(err) {
    Logger.log('Erro Telegram: ' + err);
  }
}

// Trigger recomendado: a cada 30 minutos
const LIMITE_MINUTOS = 60;

const STATUS_ALERTAR = [
  'Pix ainda não confirmado',
  'Em produção',
];

function verificarPedidosParados() {
  if (_emHorarioSilencioso()) return;
  const cfg     = getConfig();
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
  const lastRow = sheet.getLastRow();
  if (lastRow < 4) return;
  const agora  = new Date();
  const dados  = sheet.getRange(4, 1, lastRow - 3, 16).getValues();
  const alertas = [];
  for (const row of dados) {
    const numeroPedido = row[0];
    const nomeCliente  = row[2];
    const dataPedido   = row[1];
    const statusPix    = row[14];  // col 15
    const statusProd   = row[15];  // col 16
    if (!numeroPedido || !nomeCliente) continue;
    if (statusProd === 'Entregue' || statusProd === 'Cancelado' || statusPix === 'Cancelado') continue;
    const statusEmAlerta = [];
    if (STATUS_ALERTAR.includes(statusPix))  statusEmAlerta.push(`Pix: ${statusPix}`);
    if (STATUS_ALERTAR.includes(statusProd)) statusEmAlerta.push(`Produção: ${statusProd}`);
    if (statusEmAlerta.length === 0) continue;
    if (!(dataPedido instanceof Date)) continue;
    const minutosParado = (agora - dataPedido) / 60000;
    if (minutosParado < LIMITE_MINUTOS) continue;
    const horas = Math.floor(minutosParado / 60);
    const mins  = Math.floor(minutosParado % 60);
    const tempoStr = horas > 0 ? `${horas}h${mins > 0 ? mins + 'min' : ''}` : `${mins}min`;
    alertas.push({ numeroPedido, nomeCliente, tempoStr, statusEmAlerta });
  }
  if (alertas.length === 0) return;
  const linhas = alertas.map(a =>
`⚠️ Pedido #${a.numeroPedido} — ${a.nomeCliente}
⏱ Parado ha ${a.tempoStr}
📋 ${a.statusEmAlerta.join(' | ')}`
  ).join('\n\n');
  _postTelegram(cfg, `🔔 ALERTA — Pedidos sem atualizacao\n\n${linhas}`);
}

// --- Testes manuais ---

function testeTelegram()        { _postTelegram(getConfig(), 'Teste Mikies Cookies 🍪'); }
function testeRelatorioDiario() { relatorioDiario(); }
function testeRelatorioHoje()   { relatorioHoje(null, null); }
function testeMonitoramento()   { verificarPedidosParados(); }
function testePolling()         { buscarUpdates(); }

// --- CHANGELOG ---
//
// [5.0.0] - 2026-05-27
//   REQUER: inserir 2 colunas apos K na planilha (ver instrucoes de migracao).
//   Nova estrutura de colunas:
//     L (12): Frete  |  M (13): Total c/ Frete  |  N (14): Valor Confirmado
//     O (15): Status Pix  |  P (16): Status Pedido  |  Q (17): Link WhatsApp
//   - salvarPedido: grava frete (col 12) e total c/ frete (col 13); status em cols 15-16.
//   - enviarTelegram: exibe entrega, frete, subtotal e total.
//   - buscarPedido, _gerarRelatorio, verificarPedidosParados: leem ate col 16.
//   - onEditInstalavel: dispara em cols 15-16 (Status Pix / Status Pedido).
//   - _gerarRelatorio: usa Total c/ Frete (col 13) no faturamento; fallback col 11.
//   - /consultarpedido: exibe subtotal, frete e total.
//
// [4.2.0] - 2026-05-27
//   - salvarPedido: data.total forcado para Number() antes de setValue()
//     para garantir que seja armazenado como numero (nao string).
//   - Corrigido formato "R$ " no setNumberFormat (espaco apos simbolo).
//
// [4.1.0] - 2026-05-27
//   - Titulo do relatorio automatico diferenciado: "RELATORIO AUTOMATICO - dd/MM/yyyy"
//   - Adicionado parametro `automatico` em _gerarRelatorio() para controlar o titulo.
//
// [4.0.0] - 2026-05-26
//   - Adicionada verificarPedidosParados(): alerta pedidos parados apos LIMITE_MINUTOS.
//   - Alertas agrupados em uma unica mensagem. Ignora Entregue e Cancelado.
//   - Trigger necessario: a cada 30 minutos.
//
// [3.2.0] - 2026-05-26
//   - Corrigida comparacao de chatId para String(chatId) !== String(cfg.TELEGRAM_CHAT_ID).
//
// [3.1.0] - 2026-05-26
//   - /relatorio manual mostra o dia atual; automatico mostra o dia anterior.
//   - Criadas relatorioHoje() e helper _gerarRelatorio() compartilhado.
//   - Corrigida citacao da mensagem no /relatorio.
//
// [3.0.0] - 2026-05-26
//   - Respostas citam a mensagem original (reply_to_message_id).
//   - /consultarpedido sem numero retorna erro imediato.
//   - Mensagens sem / e comandos desconhecidos ignorados silenciosamente.
//   - Adicionado /relatorio para relatorio sob demanda.
//
// [2.0.0] - 2026-05-26
//   - Migracao de webhook para polling (getUpdates).
//     Motivo: GAS retorna HTTP 302 para POST externos; Telegram nao segue redirect.
//   - buscarUpdates() com offset persistente via TELEGRAM_OFFSET.
//   - Relatorio diario automatico as 8h (relatorioDiario).
//   - Triggers: buscarUpdates (1min), relatorioDiario (diario 8h).
//
// [1.1.0] - 2026-05-26
//   - Regex atualizado para /consultarpedido@NomeDoBot 42 (uso em grupos).
//   - Adicionado is_bot check para quebrar loop infinito.
//
// [1.0.0] - 2026-05-26
//   - Versao inicial com webhook.
//   - /consultarpedido, enviarTelegram, onEditInstalavel, doGet/doPost.
