// Mikies Cookies Bot — v1.1.0 (2026-05-28)
// Google Apps Script · Web App + Telegram polling
// Timezone do projeto: America/Fortaleza

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────

function getConfig() {
  const p = PropertiesService.getScriptProperties();
  return {
    TELEGRAM_BOT_TOKEN: p.getProperty('TELEGRAM_BOT_TOKEN'),
    TELEGRAM_CHAT_ID:   p.getProperty('TELEGRAM_CHAT_ID'),
  };
}

function getTopics() {
  const p = PropertiesService.getScriptProperties();
  return {
    PEDIDOS:    p.getProperty('TELEGRAM_TOPIC_PEDIDOS')    || null,
    STATUS:     p.getProperty('TELEGRAM_TOPIC_STATUS')     || null,
    ALERTAS:    p.getProperty('TELEGRAM_TOPIC_ALERTAS')    || null,
    RELATORIOS: p.getProperty('TELEGRAM_TOPIC_RELATORIOS') || null,
  };
}

// Execute UMA vez após atualizar o script para recriar todos os triggers
function criarTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('buscarUpdates').timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger('consolidarClientes').timeBased().atHour(6).everyDays(1).create();
  ScriptApp.newTrigger('relatorioDiario').timeBased().atHour(8).everyDays(1).create();
  ScriptApp.newTrigger('relatorioSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  ScriptApp.newTrigger('relatorioMensal').timeBased().onMonthDay(1).atHour(8).create();
  ScriptApp.newTrigger('verificarPedidosParados').timeBased().everyMinutes(30).create();
  ScriptApp.newTrigger('onEditInstalavel').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  Logger.log('Triggers criados com sucesso.');
}

// Execute UMA vez para preparar a aba "Pedidos" no layout novo (A–W) e
// zerar os dados de teste de "Avaliações".
// ⚠️ APAGA todo o conteúdo de "Pedidos" e os dados de "Avaliações" —
// use apenas enquanto os dados forem de teste.
// Cria título, cabeçalho, formatos, dropdowns de status e esconde a coluna JSON.
function prepararAbaPedidos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('Pedidos') || ss.insertSheet('Pedidos');

  const full = sh.getRange(1, 1, sh.getMaxRows(), Math.max(sh.getMaxColumns(), COL.JSON));
  full.clearContent();
  full.clearFormat();
  full.clearDataValidations();
  sh.setFrozenRows(0);
  for (let c = 1; c <= sh.getMaxColumns(); c++) sh.showColumns(c);

  const headers = [
    '# Pedido', 'Data', 'Nome', 'WhatsApp', 'Itens',
    'Mikies Mimo', 'Mikies Dip', 'Mikies Jewel', 'Mikies to Share', 'Mikies Pocket',
    'Total Cookies', 'Peso (g)', 'Subtotal', 'Frete', 'Total',
    'Valor Confirmado', 'Status Pix', 'Status Pedido',
    'Ocasião', 'Mensagem Cartão', 'Quando', 'Token Avaliação', 'Pedido (JSON)',
  ];

  // Linha 1: título · Linha 3: cabeçalho · dados a partir da linha 4
  sh.getRange(1, 1).setValue('PEDIDOS — Mikies Cookies').setFontWeight('bold').setFontSize(12);
  sh.getRange(3, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#6B0F2A').setFontColor('#FFFFFF');
  sh.setFrozenRows(3);

  sh.setColumnWidth(COL.ITENS, 320);
  sh.setColumnWidth(COL.CARTAO, 220);
  sh.hideColumns(COL.JSON); // coluna técnica (alimenta relatórios/CRM)

  const rows = sh.getMaxRows() - 3;
  sh.getRange(4, COL.DATA, rows, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sh.getRange(4, COL.PESO, rows, 1).setNumberFormat('#,##0" g"');
  sh.getRange(4, COL.SUBTOTAL, rows, 4).setNumberFormat('"R$ "#,##0.00'); // M:P

  const vPix = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Aguardando', 'Pago', 'Cancelado'], true).build();
  const vProd = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pix ainda não confirmado', 'Em produção', 'Pronto', 'Entregue', 'Cancelado'], true).build();
  sh.getRange(4, COL.STATUS_PIX, rows, 1).setDataValidation(vPix);
  sh.getRange(4, COL.STATUS_PROD, rows, 1).setDataValidation(vProd);

  // Zera os dados de teste da aba "Avaliações" (mantém o cabeçalho), se existir
  const shAval = ss.getSheetByName('Avaliações');
  let avalLimpas = 0;
  if (shAval && shAval.getLastRow() > 1) {
    avalLimpas = shAval.getLastRow() - 1;
    shAval.getRange(2, 1, avalLimpas, shAval.getLastColumn()).clearContent();
  }

  SpreadsheetApp.flush();
  Logger.log(`Pronto: "Pedidos" preparada no layout A–W e ${avalLimpas} avaliação(ões) de teste removida(s).`);
}

// Execute UMA vez para fechar os tópicos do grupo Telegram para membros comuns
function fecharTopicos() {
  const cfg    = getConfig();
  const topics = getTopics();
  [topics.PEDIDOS, topics.STATUS, topics.ALERTAS, topics.RELATORIOS]
    .filter(Boolean)
    .forEach(tid => UrlFetchApp.fetch(
      `https://api.telegram.org/bot${cfg.TELEGRAM_BOT_TOKEN}/closeForumTopic`,
      { method:'post', contentType:'application/json', muteHttpExceptions:true,
        payload: JSON.stringify({ chat_id: cfg.TELEGRAM_CHAT_ID, message_thread_id: parseInt(tid,10) }) }
    ));
}

// ─── POLLING ─────────────────────────────────────────────────────────────────

function buscarUpdates() {
  const cfg   = getConfig();
  const props = PropertiesService.getScriptProperties();
  const offset = parseInt(props.getProperty('TELEGRAM_OFFSET') || '0', 10);
  let resp;
  try {
    resp = UrlFetchApp.fetch(
      `https://api.telegram.org/bot${cfg.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=0&limit=10`,
      { muteHttpExceptions: true }
    );
  } catch(e) { Logger.log('Erro buscarUpdates: ' + e); return; }
  const data = JSON.parse(resp.getContentText());
  if (!data.ok || !data.result.length) return;
  for (const update of data.result) {
    props.setProperty('TELEGRAM_OFFSET', String(update.update_id + 1));
    if (update.message) responderBot(update.message);
  }
}

// ─── COMANDOS DO BOT ─────────────────────────────────────────────────────────

const STATUS_PIX = {
  'Aguardando': { emoji:'⏳', descricao:'Pix ainda não confirmado' },
  'Pago':       { emoji:'✅', descricao:'Comprovante recebido'     },
  'Cancelado':  { emoji:'🚫', descricao:'Pedido cancelado'         },
};

const STATUS_PEDIDO = {
  'Pix ainda não confirmado': { emoji:'⏳', descricao:'Aguardando pagamento'       },
  'Em produção':              { emoji:'👩‍🍳', descricao:'Sendo produzido'           },
  'Pronto':                   { emoji:'📦', descricao:'Pronto p/ entrega/retirada' },
  'Entregue':                 { emoji:'🎉', descricao:'Finalizado'                 },
  'Cancelado':                { emoji:'🚫', descricao:'Cancelado'                  },
};

// Embalagens (ordem das colunas F–J na aba Pedidos) e sabores disponíveis.
// Mantém paridade com os arrays `embalagens` e `SABORES` do index.html.
const EMBALAGENS = [
  { id:'mimo',    nome:'Mikies Mimo'     },
  { id:'dip',     nome:'Mikies Dip'      },
  { id:'jewel',   nome:'Mikies Jewel'    },
  { id:'toshare', nome:'Mikies to Share' },
  { id:'pocket',  nome:'Mikies Pocket'   },
];
const SABORES_LISTA = ['Chocolate ao Leite', 'Ninho', 'Red Velvet', 'Black', 'Morango', 'Matcha'];

// Mapa de colunas da aba "Pedidos" (1-indexado). Linha de dados começa em 4.
const COL = {
  NUM:1, DATA:2, NOME:3, WA:4, ITENS:5,
  MIMO:6, DIP:7, JEWEL:8, TOSHARE:9, POCKET:10,
  COOKIES:11, PESO:12, SUBTOTAL:13, FRETE:14, TOTAL:15,
  CONFIRMADO:16, STATUS_PIX:17, STATUS_PROD:18,
  OCASIAO:19, CARTAO:20, QUANDO:21, TOKEN:22, JSON:23,
};

function responderBot(message) {
  const cfg       = getConfig();
  const topics    = getTopics();
  const chatId    = message.chat.id;
  const messageId = message.message_id;
  const threadId  = message.message_thread_id || null;
  if (message.from && message.from.is_bot) return;
  const texto = (message.text || '').trim();
  if (!texto.startsWith('/')) return;
  if (String(chatId) !== String(cfg.TELEGRAM_CHAT_ID)) {
    _postTelegram(cfg, '⛔ Acesso não autorizado.', chatId, messageId, null, threadId);
    return;
  }

  // /relatorio → sempre vai ao tópico RELATORIOS
  if (/^\/relatorio(?:@\S+)?$/i.test(texto)) {
    relatorioHoje(null, null, topics.RELATORIOS);
    if (threadId !== parseInt(topics.RELATORIOS) && !(threadId === null && !topics.RELATORIOS)) {
      const link = _linkTopico(chatId, topics.RELATORIOS);
      _postTelegram(cfg, '📊 Relatório enviado no tópico Relatórios.',
        chatId, messageId, link ? [[{ text:'📊 Ver em Relatórios', url:link }]] : null, threadId);
    }
    return;
  }

  // /pendentes → lista pedidos não concluídos ordenados por urgência
  if (/^\/pendentes(?:@\S+)?$/i.test(texto)) {
    _listarPendentes(cfg, chatId, messageId, threadId);
    return;
  }

  // /consultarpedido sem número
  if (/^\/consultarpedido(?:@\S+)?$/i.test(texto)) {
    _postTelegram(cfg, '❌ Informe o número.\nEx: /consultarpedido 42', chatId, messageId, null, threadId);
    return;
  }

  // /consultarpedido N
  const match = texto.match(/^\/consultarpedido(?:@\S+)?\s+(\d+)$/i);
  if (!match) return;
  const numero = parseInt(match[1], 10);
  if (isNaN(numero) || numero <= 0) {
    _postTelegram(cfg, '❌ Número inválido.\nEx: /consultarpedido 42', chatId, messageId, null, threadId);
    return;
  }
  const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
  const pedido = buscarPedido(sheet, numero);
  if (!pedido) {
    _postTelegram(cfg, `❌ Pedido #${numero} não encontrado.`, chatId, messageId, null, threadId);
    return;
  }
  const spix  = STATUS_PIX[pedido.statusPix]    || { emoji:'❓', descricao: pedido.statusPix };
  const sprod = STATUS_PEDIDO[pedido.statusProd] || { emoji:'❓', descricao: pedido.statusProd };
  const waUrl = pedido.whatsapp
    ? _gerarWALink(pedido.whatsapp, `Olá ${pedido.nome}! Tudo certo com o seu pedido #${numero}?`) : null;
  _postTelegram(cfg,
`🍪 PEDIDO #${numero}

👤 ${pedido.nome} · 📞 ${pedido.whatsapp}
${pedido.ocasiao && pedido.ocasiao !== 'Sem motivo especial' ? `🎊 ${pedido.ocasiao}\n` : ''}${pedido.mensagemCartao ? `✉️ "${pedido.mensagemCartao}"\n` : ''}
🛒 Itens:
${_itensTexto(pedido)}

💵 Subtotal: R$ ${_fmt(pedido.subtotal)} · 🚀 Frete: R$ ${_fmt(pedido.frete)} · 💰 Total: R$ ${_fmt(pedido.total)}

💳 ${spix.emoji} ${spix.descricao}
📦 ${sprod.emoji} ${sprod.descricao}`,
    null, messageId, waUrl ? [[{ text:`📲 Falar com ${pedido.nome}`, url:waUrl }]] : null, topics.STATUS
  );
}

// ─── WEB APP / PEDIDOS ───────────────────────────────────────────────────────

function doGet(e) {
  const callback = e.parameter && e.parameter.callback;

  function _respond(obj) {
    const json = JSON.stringify(obj);
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + json + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  if (e.parameter && e.parameter.data) {
    try {
      const body = JSON.parse(e.parameter.data);
      if (body.tipo === 'avaliacao') return salvarAvaliacao(body);
      if (body.tipo === 'status')    return _respond(consultarStatus(body));
      if (body.tipo === 'pago')    { avisarPagamento(body); return _respond({ ok:true }); }
      return _respond(salvarPedido(body));
    } catch(err) { return _errJson('JSON inválido: ' + err); }
  }
  return _respond({ status:'ok', message:'Mikies Cookies API' });
}

function doPost(e) {
  try {
    const r = salvarPedido(JSON.parse(e.postData.contents));
    return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
  } catch(err) { return _errJson(err.toString()); }
}

function _errJson(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status:'error', message:msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function salvarAvaliacao(data) {
  // Valida token de uso único armazenado na col T (20) da aba Pedidos
  if (!data.token) return _errJson('Token ausente');
  const token   = String(data.token).replace(/[^a-z0-9]/gi, '').slice(0, 32);
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const shPed   = ss.getSheetByName('Pedidos');
  if (!shPed) return _errJson('Planilha não encontrada');

  const lastPed = shPed.getLastRow();
  if (lastPed < 4) return _errJson('Token inválido');
  const tokens = shPed.getRange(4, COL.TOKEN, lastPed - 3, 1).getValues();
  let foundRow = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (String(tokens[i][0]) === token) { foundRow = i + 4; break; }
  }
  if (foundRow === -1) return _errJson('Token inválido ou já utilizado');

  const rd          = shPed.getRange(foundRow, 1, 1, 3).getValues()[0];
  const numeroPedido = rd[0];
  const nomeCliente  = rd[2];
  shPed.getRange(foundRow, COL.TOKEN).setValue('USADO'); // invalida o token

  let sh = ss.getSheetByName('Avaliações');
  if (!sh) {
    sh = ss.insertSheet('Avaliações');
    const hdrs = ['Data/Hora', '# Pedido', 'Nome', 'Nota', 'Comentário'];
    sh.getRange(1, 1, 1, hdrs.length).setValues([hdrs]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 140);
    sh.setColumnWidth(5, 320);
  }
  const nota = parseInt(data.nota, 10);
  sh.appendRow([
    new Date(),
    numeroPedido || '',
    nomeCliente  || '',
    (nota >= 1 && nota <= 5) ? nota : '',
    String(data.comentario || '').slice(0, 300)
  ]);
  sh.getRange(sh.getLastRow(), 1).setNumberFormat('dd/MM/yyyy HH:mm');
  return ContentService
    .createTextOutput(JSON.stringify({ status:'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function consultarStatus(data) {
  const numeroPedido = parseInt(data.pedido, 10);
  const whatsapp     = _normalizarTelefone(data.whatsapp);
  if (!numeroPedido || !whatsapp) return { error:'incomplete' };

  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
  if (!sh) return { error:'internal' };
  const lastRow = sh.getLastRow();
  if (lastRow < 4) return { error:'not_found' };

  const dados = sh.getRange(4, 1, lastRow - 3, COL.QUANDO).getValues();
  for (const row of dados) {
    if (row[0] !== numeroPedido) continue;
    if (_normalizarTelefone(row[3]) !== whatsapp) return { error:'not_found' };
    return {
      ok:         true,
      statusPix:  row[COL.STATUS_PIX  - 1] || '',
      statusProd: row[COL.STATUS_PROD - 1] || '',
      quando:     row[COL.QUANDO      - 1] || '',
      data:       row[1] instanceof Date
                    ? Utilities.formatDate(row[1], 'America/Fortaleza', 'dd/MM/yyyy')
                    : ''
    };
  }
  return { error:'not_found' };
}

function ultimaLinhaColunaA(sheet) {
  const n = sheet.getLastRow();
  if (!n) return 0;
  const vals = sheet.getRange(1, 1, n, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) if (vals[i][0] !== '') return i + 1;
  return 0;
}

function _isDuplicado(sheet, data) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 4) return false;
  const numWA    = _normalizarTelefone(data.whatsapp);
  const itensTxt = String(data.itensTexto || '');
  const agora    = new Date();
  const dados    = sheet.getRange(4, 1, lastRow - 3, COL.ITENS).getValues();
  for (let i = dados.length - 1; i >= 0; i--) {
    const dp = dados[i][COL.DATA - 1];
    if (!(dp instanceof Date)) continue;
    if (agora - dp > 5 * 60000) break;
    if (_normalizarTelefone(dados[i][COL.WA - 1]) !== numWA) continue;
    if (String(dados[i][COL.ITENS - 1]) === itensTxt) return true;
  }
  return false;
}

// Retorna objeto simples ({ ok, pedido } | { ok:false, status }); o doGet/doPost
// é quem embrulha em JSONP/JSON. O site lê { ok:true, pedido:N } para confirmar.
function salvarPedido(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
    if (_isDuplicado(sheet, data)) {
      return { ok:false, status:'duplicate' };
    }
    const lastRow      = Math.max(ultimaLinhaColunaA(sheet), 3);
    const newRow       = lastRow + 1;
    const numeroPedido = newRow - 3;
    const counts       = data.counts || {};
    // B–U em uma escrita (Token V e JSON W são gravados à parte)
    sheet.getRange(newRow, 2, 1, COL.QUANDO - 1).setValues([[
      new Date(),                                   // B Data
      data.nome                          || '',     // C Nome
      _normalizarTelefone(data.whatsapp) || '',     // D WhatsApp
      data.itensTexto                    || '',     // E Itens (texto)
      Number(counts.mimo)    || 0,                  // F Mikies Mimo
      Number(counts.dip)     || 0,                  // G Mikies Dip
      Number(counts.jewel)   || 0,                  // H Mikies Jewel
      Number(counts.toshare) || 0,                  // I Mikies to Share
      Number(counts.pocket)  || 0,                  // J Mikies Pocket
      Number(data.cookies)   || 0,                  // K Total Cookies
      Number(data.peso)      || 0,                  // L Peso (g)
      Number(data.subtotal)  || 0,                  // M Subtotal
      Number(data.frete)     || 0,                  // N Frete
      Number(data.total)     || 0,                  // O Total
      '',                                           // P Valor Confirmado (manual)
      'Aguardando',                                 // Q Status Pix
      'Pix ainda não confirmado',                   // R Status Pedido
      data.ocasiao        || 'Sem motivo especial', // S Ocasião
      data.mensagemCartao || '',                    // T Mensagem Cartão
      data.quando         || 'Não informado',       // U Quando
    ]]);
    // W: estrutura completa do pedido (usada por relatórios e CRM)
    sheet.getRange(newRow, COL.JSON).setValue(JSON.stringify({
      itens:       data.itens       || [],
      saboresFreq: data.saboresFreq || {},
      counts,
      cookies: Number(data.cookies) || 0,
      peso:    Number(data.peso)    || 0,
    }));
    sheet.getRange(newRow, COL.DATA).setNumberFormat('dd/MM/yyyy HH:mm');
    sheet.getRange(newRow, COL.SUBTOTAL, 1, 3).setNumberFormat('"R$ "#,##0.00'); // M:O
    sheet.getRange(newRow, COL.CONFIRMADO).setNumberFormat('"R$ "#,##0.00');     // P
    sheet.getRange(newRow, COL.PESO).setNumberFormat('#,##0" g"');               // L
    sheet.getRange(newRow, COL.NUM).setValue(numeroPedido);
    enviarTelegram({
      numero:         numeroPedido,
      nome:           data.nome,
      whatsapp:       data.whatsapp,
      entrega:        data.entrega,
      frete:          data.frete,
      subtotal:       data.subtotal,
      total:          data.total,
      cookies:        data.cookies,
      peso:           data.peso,
      quando:         data.quando         || 'Não informado',
      ocasiao:        data.ocasiao        || 'Sem motivo especial',
      mensagemCartao: data.mensagemCartao || '',
      itensTexto:     data.itensTexto     || '',
      pedidosAnteriores: _contarPedidosAnteriores(sheet, data.whatsapp, newRow),
    });
    return { ok:true, pedido:numeroPedido };
  } catch(err) {
    return { ok:false, status:'error', message:err.toString() };
  }
}

// Cliente clicou em "Já fiz o Pix" na tela de sucesso do site. Apenas avisa o
// grupo (tópico Status) — NÃO altera a planilha. A confirmação real continua
// sendo o operador marcar "Pago" depois de conferir o comprovante.
function avisarPagamento(data) {
  const cfg    = getConfig();
  const topics = getTopics();
  const nome   = data.nome || 'Cliente';
  const wa     = _normalizarTelefone(data.whatsapp);
  const ref    = data.pedido ? `#${data.pedido}` : 's/ nº';
  const waUrl  = wa
    ? _gerarWALink(wa, `Olá ${nome}! Recebemos o aviso do Pix do pedido ${ref}. Pode nos enviar o comprovante?`)
    : null;
  _postTelegram(cfg,
`💸 CLIENTE AVISOU PAGAMENTO

🆔 Pedido ${ref}
👤 ${nome} · 📞 ${data.whatsapp || '—'}
💰 Total: R$ ${_fmt(data.total)}

⚠️ Confira o comprovante antes de marcar "Pago".`,
    null, null, waUrl ? [[{ text:`📲 Pedir comprovante a ${nome}`, url:waUrl }]] : null, topics.STATUS
  );
}

function buscarPedido(sheet, numero) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 4) return null;
  const dados = sheet.getRange(4, 1, lastRow - 3, COL.JSON).getValues();
  for (const row of dados) {
    if (row[0] !== numero) continue;
    return {
      numero:         row[COL.NUM       - 1],
      nome:           row[COL.NOME      - 1],
      whatsapp:       row[COL.WA        - 1],
      itensTexto:     row[COL.ITENS     - 1] || '',
      cookies:        row[COL.COOKIES   - 1],
      peso:           row[COL.PESO      - 1],
      subtotal:       row[COL.SUBTOTAL  - 1],
      frete:          row[COL.FRETE     - 1],
      total:          row[COL.TOTAL     - 1],
      statusPix:      row[COL.STATUS_PIX  - 1],
      statusProd:     row[COL.STATUS_PROD - 1],
      ocasiao:        row[COL.OCASIAO   - 1] || '',
      mensagemCartao: row[COL.CARTAO    - 1] || '',
      quando:         row[COL.QUANDO    - 1] || '',
    };
  }
  return null;
}

// ─── NOTIFICAÇÕES TELEGRAM ───────────────────────────────────────────────────

function enviarTelegram(pedido) {
  const cfg    = getConfig();
  const topics = getTopics();
  if (_enviarImagemPedido(cfg, pedido, topics.PEDIDOS)) return;

  // Fallback texto puro (sem template Slides configurado)
  const recorrente  = pedido.pedidosAnteriores > 0 ? `\n🔁 ${pedido.pedidosAnteriores+1}º pedido` : '';
  const foraHorario = _foraDoHorario() ? '\n⚠️ Fora do horário — processar no próximo dia útil' : '';
  const urgente     = (pedido.quando||'').startsWith('O quanto antes') ? '🔴 ' : '';
  const ocasiaoStr  = pedido.ocasiao !== 'Sem motivo especial' ? `\n🎊 ${pedido.ocasiao}` : '';
  const cartaoStr   = pedido.mensagemCartao ? `\n✉️ "${pedido.mensagemCartao}"` : '';
  const msgWA = `Olá ${pedido.nome}! Recebemos seu pedido #${pedido.numero}.\n\n${_itensTexto(pedido, '-')}\n\nTotal: R$ ${_fmt(pedido.total)}\n\nEnvie o comprovante do Pix para confirmar!`;
  _postTelegram(cfg,
`🍪 NOVO PEDIDO${recorrente}${foraHorario}

🆔 #${pedido.numero} · 👤 ${pedido.nome} · 📞 ${pedido.whatsapp}${ocasiaoStr}${cartaoStr}

🛒 ${_itensTexto(pedido)}

🚚 ${pedido.entrega||'—'} · ${urgente}⏰ ${pedido.quando||'Não informado'}
💵 Sub R$ ${_fmt(pedido.subtotal)} · 🚀 Frete R$ ${_fmt(pedido.frete)} · 💰 Total R$ ${_fmt(pedido.total)}`,
    null, null,
    pedido.whatsapp ? [[{ text:'📲 Confirmar com cliente', url:_gerarWALink(pedido.whatsapp, msgWA) }]] : null,
    topics.PEDIDOS
  );
}

function _enviarImagemPedido(cfg, pedido, threadId) {
  const templateId = PropertiesService.getScriptProperties().getProperty('SLIDE_TEMPLATE_ID');
  if (!templateId) return false;
  let copiaId = null;
  try {
    copiaId = DriveApp.getFileById(templateId).makeCopy(`tmp_pedido_${pedido.numero}`).getId();
    const ap   = SlidesApp.openById(copiaId);
    const data = Utilities.formatDate(new Date(), 'America/Fortaleza', 'dd/MM/yyyy');
    ap.replaceAllText('{{numero}}',          String(pedido.numero));
    ap.replaceAllText('{{nome}}',            pedido.nome           || '');
    ap.replaceAllText('{{entrega}}',         pedido.entrega        || 'Não informado');
    ap.replaceAllText('{{quando}}',          pedido.quando         || 'Não informado');
    ap.replaceAllText('{{data}}',            data);
    ap.replaceAllText('{{itens}}',           _itensTexto(pedido));
    ap.replaceAllText('{{subtotal}}',        _fmt(pedido.subtotal));
    ap.replaceAllText('{{frete}}',           _fmt(pedido.frete));
    ap.replaceAllText('{{total}}',           _fmt(pedido.total));
    ap.replaceAllText('{{ocasiao}}',         pedido.ocasiao        || 'Sem motivo especial');
    ap.replaceAllText('{{mensagem_cartao}}', pedido.mensagemCartao || '');
    ap.saveAndClose();
    const resp = UrlFetchApp.fetch(
      `https://docs.google.com/presentation/d/${copiaId}/export/png`,
      { headers:{ Authorization:`Bearer ${ScriptApp.getOAuthToken()}` }, muteHttpExceptions:true }
    );
    if (resp.getResponseCode() !== 200) return false;
    const recorrente  = pedido.pedidosAnteriores > 0 ? `\n🔁 ${pedido.pedidosAnteriores+1}º pedido` : '';
    const foraHorario = _foraDoHorario() ? '\n⚠️ Fora do horário' : '';
    const urgente     = (pedido.quando||'').startsWith('O quanto antes') ? '🔴 ' : '';
    const caption = [
      `🆔 Pedido #${pedido.numero} · ${data}${recorrente}${foraHorario}`,
      `👤 ${pedido.nome} · 📞 ${pedido.whatsapp||'—'}`,
      `🚚 ${pedido.entrega||'—'} · ${urgente}⏰ ${pedido.quando||'—'}`,
      '', _itensTexto(pedido), '',
      `💵 Sub R$ ${_fmt(pedido.subtotal)} · 🚀 Frete R$ ${_fmt(pedido.frete)} · 💰 Total R$ ${_fmt(pedido.total)}`,
    ].join('\n');
    const msgWA = `Olá ${pedido.nome}! Recebemos seu pedido #${pedido.numero}.\n\n${_itensTexto(pedido, '-')}\n\nTotal: R$ ${_fmt(pedido.total)}\n\nEnvie o comprovante do Pix para confirmar!`;
    const pp = {
      chat_id: String(cfg.TELEGRAM_CHAT_ID),
      photo:   resp.getBlob().setName(`pedido_${pedido.numero}.png`),
      caption: caption.length > 1024 ? caption.substring(0, 1020) + '...' : caption,
    };
    if (pedido.whatsapp) pp.reply_markup      = JSON.stringify({ inline_keyboard:[[{ text:'📲 Enviar confirmação ao cliente', url:_gerarWALink(pedido.whatsapp, msgWA) }]] });
    if (threadId)        pp.message_thread_id = String(threadId);
    UrlFetchApp.fetch(`https://api.telegram.org/bot${cfg.TELEGRAM_BOT_TOKEN}/sendPhoto`,
      { method:'post', payload:pp, muteHttpExceptions:true });
    return true;
  } catch(e) {
    Logger.log('Erro _enviarImagemPedido: ' + e);
    return false;
  } finally {
    if (copiaId) { try { DriveApp.getFileById(copiaId).setTrashed(true); } catch(e) {} }
  }
}

// Gerada ao marcar status = Entregue. Requer SLIDE_THANK_YOU_ID no PropertiesService.
// Template deve conter placeholders: {{nome}}, {{numero}}, {{itens}}, {{form_url}}
function _enviarImagemAgradecimento(cfg, pedido, threadId) {
  const templateId = PropertiesService.getScriptProperties().getProperty('SLIDE_THANK_YOU_ID');
  if (!templateId) return;
  let copiaId = null;
  try {
    copiaId = DriveApp.getFileById(templateId).makeCopy(`tmp_obrigado_${pedido.numeroPedido}`).getId();
    const ap      = SlidesApp.openById(copiaId);
    const _site   = 'https://r3dd1n0.github.io/mikiescookies/';
    const formUrl = pedido.avalToken
      ? `${_site}?avaliacao&t=${pedido.avalToken}&p=${pedido.numeroPedido}&n=${encodeURIComponent(pedido.nomeCliente||'')}`
      : `${_site}?avaliacao&p=${pedido.numeroPedido}&n=${encodeURIComponent(pedido.nomeCliente||'')}`;
    ap.replaceAllText('{{nome}}',     pedido.nomeCliente   || '');
    ap.replaceAllText('{{numero}}',   String(pedido.numeroPedido));
    ap.replaceAllText('{{itens}}',    _itensTexto(pedido));
    ap.replaceAllText('{{form_url}}', formUrl);
    ap.saveAndClose();
    const resp = UrlFetchApp.fetch(
      `https://docs.google.com/presentation/d/${copiaId}/export/png`,
      { headers:{ Authorization:`Bearer ${ScriptApp.getOAuthToken()}` }, muteHttpExceptions:true }
    );
    if (resp.getResponseCode() !== 200) return;
    const caption = `\u{1F49B} Muito obrigada, ${pedido.nomeCliente}!\nSeu pedido #${pedido.numeroPedido} foi entregue com carinho.${formUrl ? '\n\nConte como foi: ' + formUrl : ''}`;
    const msgWA   = `Muito obrigada, ${pedido.nomeCliente}! Seu pedido #${pedido.numeroPedido} foi entregue com carinho.${formUrl ? ' Conta como foi: ' + formUrl : ''}`;
    const pp = {
      chat_id: String(cfg.TELEGRAM_CHAT_ID),
      photo:   resp.getBlob().setName(`obrigado_${pedido.numeroPedido}.png`),
      caption: caption.length > 1024 ? caption.substring(0, 1020) + '...' : caption,
    };
    if (pedido.whatsapp) pp.reply_markup      = JSON.stringify({ inline_keyboard:[[{ text:`\u{1F49B} Enviar para ${pedido.nomeCliente}`, url:_gerarWALink(pedido.whatsapp, msgWA) }]] });
    if (threadId)        pp.message_thread_id = String(threadId);
    UrlFetchApp.fetch(`https://api.telegram.org/bot${cfg.TELEGRAM_BOT_TOKEN}/sendPhoto`,
      { method:'post', payload:pp, muteHttpExceptions:true });
  } catch(e) {
    Logger.log('Erro _enviarImagemAgradecimento: ' + e);
  } finally {
    if (copiaId) { try { DriveApp.getFileById(copiaId).setTrashed(true); } catch(e) {} }
  }
}

// ─── STATUS E MONITORAMENTO ──────────────────────────────────────────────────

function onEditInstalavel(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== 'Pedidos') return;
  const col = e.range.getColumn();
  const row = e.range.getRow();
  if (row < 4 || (col !== COL.STATUS_PIX && col !== COL.STATUS_PROD)) return;
  const novoValor = e.value;
  if (!novoValor || novoValor.trim() === '') return;
  const numeroPedido = sheet.getRange(row, COL.NUM).getValue();
  const nomeCliente  = sheet.getRange(row, COL.NOME).getValue();
  const whatsapp     = sheet.getRange(row, COL.WA).getValue();
  if (!numeroPedido || !nomeCliente) return;
  const mapa = col === COL.STATUS_PIX ? STATUS_PIX : STATUS_PEDIDO;
  if (!mapa[novoValor]) return;

  // Limpa alerta existente para permitir re-alerta se o pedido ficar parado de novo
  const alertados = _getAlertasEnviados();
  if (alertados[numeroPedido]) { delete alertados[numeroPedido]; _setAlertasEnviados(alertados); }

  const cfg    = getConfig();
  const topics = getTopics();
  const label  = col === COL.STATUS_PIX ? 'Pagamento' : 'Produção';
  const info   = mapa[novoValor];

  // Gera token de avaliação antes de montar a mensagem WA (necessário para Entregue)
  let avalToken = null;
  if (col === COL.STATUS_PROD && novoValor === 'Entregue') {
    avalToken = Utilities.getUuid().replace(/-/g, '').slice(0, 14);
    sheet.getRange(row, COL.TOKEN).setValue(avalToken); // col V
  }

  const msgWA = _msgWAStatus(novoValor, numeroPedido, nomeCliente, avalToken);
  const waUrl = (msgWA && whatsapp) ? _gerarWALink(whatsapp, msgWA) : null;
  _postTelegram(cfg,
`${info.emoji} PEDIDO #${numeroPedido} — ${label} atualizado

👤 ${nomeCliente}
📋 ${info.descricao}`,
    null, null, waUrl ? [[{ text:`📲 Avisar ${nomeCliente}`, url:waUrl }]] : null, topics.STATUS
  );

  if (col === COL.STATUS_PROD && novoValor === 'Entregue') {
    const itensTexto = sheet.getRange(row, COL.ITENS).getValue();
    _enviarImagemAgradecimento(cfg, {
      numeroPedido, nomeCliente, whatsapp, avalToken, itensTexto,
    }, topics.STATUS);
  }
}

const LIMITE_MINUTOS = 60;
const STATUS_ALERTAR = ['Pix ainda não confirmado', 'Em produção'];
const ALERTAS_PROP   = 'ALERTAS_ENVIADOS';

function _getAlertasEnviados() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(ALERTAS_PROP) || '{}'); }
  catch(e) { return {}; }
}
function _setAlertasEnviados(obj) {
  PropertiesService.getScriptProperties().setProperty(ALERTAS_PROP, JSON.stringify(obj));
}

function verificarPedidosParados() {
  if (_emHorarioSilencioso()) return;
  const cfg    = getConfig();
  const topics = getTopics();
  const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
  const lastRow = sheet.getLastRow();
  if (lastRow < 4) return;
  const agora           = new Date();
  const dados           = sheet.getRange(4, 1, lastRow - 3, COL.QUANDO).getValues();
  const alertasEnviados = _getAlertasEnviados();
  const alertasNovos    = [];
  for (const row of dados) {
    const numeroPedido = row[COL.NUM  - 1];
    const dataPedido   = row[COL.DATA - 1];
    const nomeCliente  = row[COL.NOME - 1];
    const whatsapp     = row[COL.WA   - 1];
    const statusPix    = row[COL.STATUS_PIX  - 1];
    const statusProd   = row[COL.STATUS_PROD - 1];
    if (!numeroPedido || !nomeCliente) continue;
    if (statusProd === 'Entregue' || statusProd === 'Cancelado' || statusPix === 'Cancelado') continue;
    const statusEmAlerta = [];
    if (STATUS_ALERTAR.includes(statusPix))  statusEmAlerta.push(`Pix: ${statusPix}`);
    if (STATUS_ALERTAR.includes(statusProd)) statusEmAlerta.push(`Produção: ${statusProd}`);
    if (!statusEmAlerta.length || !(dataPedido instanceof Date)) continue;
    const mins = (agora - dataPedido) / 60000;
    if (mins < LIMITE_MINUTOS) continue;
    const statusKey = `${statusPix}|${statusProd}`;
    if (alertasEnviados[numeroPedido] === statusKey) continue;
    const h = Math.floor(mins / 60), m = Math.floor(mins % 60);
    const quando = row[COL.QUANDO - 1] || '';
    alertasNovos.push({
      numeroPedido, nomeCliente, statusEmAlerta, statusKey, quando,
      prioridade: _prioridadeQuando(quando),
      tempoStr: h > 0 ? `${h}h${m > 0 ? m+'min':''}` : `${Math.floor(mins)}min`,
      waUrl: whatsapp ? _gerarWALink(whatsapp, `Olá ${nomeCliente}! Tudo certo com o pedido #${numeroPedido}?`) : null,
    });
  }
  if (!alertasNovos.length) return;
  alertasNovos.sort((a, b) => a.prioridade - b.prioridade);
  const linhas = alertasNovos.map(a =>
    `⚠️ Pedido #${a.numeroPedido} — ${a.nomeCliente}\n⏱ Parado há ${a.tempoStr}${a.quando ? ' · ⏰ ' + a.quando : ''}\n📋 ${a.statusEmAlerta.join(' | ')}`
  ).join('\n\n');
  const buttons = alertasNovos.filter(a => a.waUrl).map(a => [{ text:`📲 ${a.nomeCliente} (#${a.numeroPedido})`, url:a.waUrl }]);
  _postTelegram(cfg, `🔔 ALERTA — Pedidos sem atualização\n\n${linhas}`,
    null, null, buttons.length ? buttons : null, topics.ALERTAS);
  alertasNovos.forEach(a => { alertasEnviados[a.numeroPedido] = a.statusKey; });
  _setAlertasEnviados(alertasEnviados);
}

// ─── RELATÓRIOS ──────────────────────────────────────────────────────────────

function relatorioDiario() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  _relatorio(
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
    'RELATÓRIO DIÁRIO — ' + Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
    null, null, null
  );
}

function relatorioHoje(chatId, messageId, threadId) {
  const d = new Date();
  _relatorio(
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
    'RELATÓRIO — ' + Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
    chatId, messageId, threadId
  );
}

function relatorioSemanal() {
  const hoje = new Date();
  const dow  = hoje.getDay();
  const seg  = new Date(hoje); seg.setDate(hoje.getDate() - (dow === 0 ? 7 : dow + 6));
  const dom  = new Date(seg);  dom.setDate(seg.getDate() + 6);
  _relatorio(
    new Date(seg.getFullYear(), seg.getMonth(), seg.getDate(), 0, 0, 0),
    new Date(dom.getFullYear(), dom.getMonth(), dom.getDate(), 23, 59, 59),
    'RELATÓRIO SEMANAL — '
      + Utilities.formatDate(seg, Session.getScriptTimeZone(), 'dd/MM')
      + ' a '
      + Utilities.formatDate(dom, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
    null, null, null
  );
}

function relatorioMensal() {
  const hoje   = new Date();
  const mesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  _relatorio(
    new Date(mesAnt.getFullYear(), mesAnt.getMonth(), 1, 0, 0, 0),
    new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59),
    'RELATÓRIO MENSAL — ' + Utilities.formatDate(mesAnt, Session.getScriptTimeZone(), 'MMMM yyyy'),
    null, null, null
  );
}

function _relatorio(inicio, fim, titulo, chatId, messageId, threadId) {
  const cfg    = getConfig();
  const topics = getTopics();
  const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
  const lastRow = sheet.getLastRow();
  const thread  = chatId ? (threadId || null) : topics.RELATORIOS;
  if (lastRow < 4) {
    _postTelegram(cfg, `📊 ${titulo}\n\nNenhum pedido.`, chatId, messageId, null, thread);
    return;
  }
  const dados   = sheet.getRange(4, 1, lastRow - 3, COL.JSON).getValues();
  const embTot  = {}; EMBALAGENS.forEach(e => embTot[e.id] = 0);
  const sabores = {}; SABORES_LISTA.forEach(s => sabores[s] = 0);
  let totalGeral = 0, qtd = 0, totalCookies = 0;
  for (const row of dados) {
    const dp = row[COL.DATA - 1];
    if (!(dp instanceof Date) || dp < inicio || dp > fim || row[COL.STATUS_PROD - 1] === 'Cancelado') continue;
    qtd++;
    totalGeral   += Number(row[COL.TOTAL - 1]) || Number(row[COL.SUBTOTAL - 1]) || 0;
    totalCookies += Number(row[COL.COOKIES - 1]) || 0;
    EMBALAGENS.forEach((e, i) => { embTot[e.id] += Number(row[COL.MIMO - 1 + i]) || 0; });
    try {
      const j = JSON.parse(row[COL.JSON - 1] || '{}');
      if (j.saboresFreq) Object.entries(j.saboresFreq).forEach(([s, n]) => {
        if (sabores[s] != null) sabores[s] += Number(n) || 0;
      });
    } catch (_) {}
  }
  if (!qtd) {
    _postTelegram(cfg, `📊 ${titulo}\n\nNenhum pedido no período.`, chatId, messageId, null, thread);
    return;
  }
  const linhasEmb = EMBALAGENS.filter(e => embTot[e.id] > 0)
    .map(e => `• ${e.nome}: ${embTot[e.id]}`).join('\n') || '—';
  const linhasSab = SABORES_LISTA.filter(s => sabores[s] > 0)
    .sort((a, b) => sabores[b] - sabores[a])
    .map(s => `• ${s}: ${sabores[s]}`).join('\n') || '—';
  _postTelegram(cfg,
`📊 ${titulo}

🛒 Pedidos: ${qtd} · 🍪 ${totalCookies} cookies

📦 Embalagens vendidas:
${linhasEmb}

🎯 Sabores (frequência de escolha):
${linhasSab}

💰 Total: R$ ${Number(totalGeral).toFixed(2).replace('.', ',')}`,
    chatId, messageId, null, thread
  );
}

// ─── CRM — CLIENTES ──────────────────────────────────────────────────────────

const CABECALHOS_CLIENTES = [
  'Telefone', 'Nome', 'Pedidos', 'Total Gasto', 'Ticket Médio',
  'Primeiro Pedido', 'Último Pedido', 'Sabor Favorito', 'Sabores',
  'Ocasiões Usadas', 'Aniversário', 'Instagram', 'Notas',
];

// Consolida aba "Clientes" a partir dos pedidos. Roda diariamente às 6h.
// Campos manuais (Aniversário, Instagram, Notas) nunca são sobrescritos.
function consolidarClientes() {
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const shPedidos  = ss.getSheetByName('Pedidos');
  const shClientes = ss.getSheetByName('Clientes') || ss.insertSheet('Clientes');
  _garantirCabecalhos(shClientes, CABECALHOS_CLIENTES);

  const lastRowP = shPedidos.getLastRow();
  if (lastRowP < 4) return;

  const pedidos = shPedidos.getRange(4, 1, lastRowP - 3, COL.JSON).getValues();
  const mapa    = {};

  for (const r of pedidos) {
    if (!r[COL.NUM - 1] || !r[COL.NOME - 1] || !r[COL.WA - 1]) continue;
    if (r[COL.STATUS_PROD - 1] === 'Cancelado' || r[COL.STATUS_PIX - 1] === 'Cancelado') continue;
    const tel = _normalizarTelefone(r[COL.WA - 1]);
    if (tel.length < 10) continue;
    if (!mapa[tel]) {
      mapa[tel] = {
        tel, nome: r[COL.NOME - 1], count: 0, total: 0, primeira: null, ultima: null,
        sabores: {}, ocasioes: new Set(),
      };
    }
    const c = mapa[tel];
    c.nome  = r[COL.NOME - 1];
    c.count++;
    c.total += Number(r[COL.TOTAL - 1]) || Number(r[COL.SUBTOTAL - 1]) || 0;
    const dp = r[COL.DATA - 1];
    if (dp instanceof Date) {
      if (!c.primeira || dp < c.primeira) c.primeira = dp;
      if (!c.ultima   || dp > c.ultima)   c.ultima   = dp;
    }
    try {
      const j = JSON.parse(r[COL.JSON - 1] || '{}');
      if (j.saboresFreq) Object.entries(j.saboresFreq).forEach(([s, n]) => {
        c.sabores[s] = (c.sabores[s] || 0) + (Number(n) || 0);
      });
    } catch (_) {}
    const ocas = r[COL.OCASIAO - 1];
    if (ocas && ocas !== 'Sem motivo especial') c.ocasioes.add(ocas);
  }

  // Índice dos clientes já existentes na aba (para upsert)
  const lastRowC  = shClientes.getLastRow();
  const existentes = {};
  if (lastRowC >= 2) {
    shClientes.getRange(2, 1, lastRowC - 1, 1).getValues().forEach((row, i) => {
      const tel = _normalizarTelefone(row[0]);
      if (tel) existentes[tel] = i + 2;
    });
  }

  for (const c of Object.values(mapa)) {
    const entries    = Object.entries(c.sabores).filter(([,v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const saborFav   = entries.length ? entries[0][0] : '—';
    const saborDetalhe = entries.map(([k,v]) => `${k}×${v}`).join(', ') || '—';
    const ticket   = c.count > 0 ? c.total / c.count : 0;
    const ocasioes = [...c.ocasioes].join(', ') || '—';

    const rowCalc = [
      c.tel, c.nome, c.count, c.total, ticket,
      c.primeira || '', c.ultima || '',
      saborFav, saborDetalhe, ocasioes,
    ];

    if (existentes[c.tel]) {
      // Atualiza apenas colunas calculadas (A–J); preserva K–M (campos manuais)
      shClientes.getRange(existentes[c.tel], 1, 1, 10).setValues([rowCalc]);
    } else {
      shClientes.appendRow([...rowCalc, '', '', '']);
    }
  }

  // Formatação das colunas calculadas
  const nRows = shClientes.getLastRow() - 1;
  if (nRows > 0) {
    shClientes.getRange(2, 4, nRows, 2).setNumberFormat('"R$ "#,##0.00'); // D:E
    shClientes.getRange(2, 6, nRows, 2).setNumberFormat('dd/MM/yyyy');    // F:G
  }
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function _postTelegram(cfg, text, chatId, replyToMessageId, buttons, threadId) {
  try {
    const safe = text.length > 4096 ? text.substring(0, 4090) + '\n[...]' : text;
    const pl   = { chat_id: chatId || cfg.TELEGRAM_CHAT_ID, text: safe };
    if (replyToMessageId)     pl.reply_to_message_id = replyToMessageId;
    if (buttons && buttons.length) pl.reply_markup   = { inline_keyboard: buttons };
    if (threadId)             pl.message_thread_id   = parseInt(threadId, 10);
    UrlFetchApp.fetch(
      `https://api.telegram.org/bot${cfg.TELEGRAM_BOT_TOKEN}/sendMessage`,
      { method:'post', contentType:'application/json', payload:JSON.stringify(pl), muteHttpExceptions:true }
    );
  } catch(e) { Logger.log('Erro _postTelegram: ' + e); }
}

function _prioridadeQuando(quando) {
  if (!quando || quando === 'Não informado') return 99999999;
  if (quando.startsWith('O quanto antes')) return 0;
  if (quando.startsWith('Hoje · tarde'))   return 1;
  if (quando.startsWith('Hoje · noite'))   return 2;
  if (quando.startsWith('Agendado')) {
    const m = quando.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) {
      const dataAgendada = parseInt(m[3] + m[2] + m[1], 10); // YYYYMMDD
      const hojeInt      = parseInt(Utilities.formatDate(new Date(), 'America/Fortaleza', 'yyyyMMdd'), 10);
      if (dataAgendada < hojeInt)   return -2; // data já passou — pedido atrasado, urgência máxima
      if (dataAgendada === hojeInt) return -1; // entrega hoje — acima de "O quanto antes"
      return dataAgendada;                     // futuro — ordenado por data crescente
    }
  }
  return 99999998;
}

function _listarPendentes(cfg, chatId, messageId, originThreadId) {
  const topics  = getTopics();
  const destThread = topics.STATUS;
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pedidos');
  const lastRow = sheet.getLastRow();
  const dados     = lastRow >= 4 ? sheet.getRange(4, 1, lastRow - 3, COL.QUANDO).getValues() : [];
  const P = COL.STATUS_PROD - 1, X = COL.STATUS_PIX - 1, Q = COL.QUANDO - 1;
  const pendentes = dados
    .filter(row => row[0] && row[2] && row[P] !== 'Entregue' && row[P] !== 'Cancelado' && row[X] !== 'Cancelado')
    .sort((a, b) => _prioridadeQuando(a[Q]) - _prioridadeQuando(b[Q]));
  const texto = pendentes.length === 0
    ? '✅ Nenhum pedido pendente.'
    : `📋 PEDIDOS PENDENTES (${pendentes.length})\n\n` + pendentes.map(row => {
        const urgente = (row[Q]||'').startsWith('O quanto antes') ? '🔴 ' : '';
        const spix    = STATUS_PIX[row[X]]    || { emoji:'❓' };
        const sprod   = STATUS_PEDIDO[row[P]] || { emoji:'❓' };
        return `${urgente}#${row[0]} · ${row[2]}\n⏰ ${row[Q]||'Não informado'} · Pix ${spix.emoji} · Prod ${sprod.emoji}`;
      }).join('\n\n');
  _postTelegram(cfg, texto, null, null, null, destThread);
  // Se o comando veio de outro tópico, confirma com link
  if (String(originThreadId) !== String(destThread)) {
    const link = _linkTopico(chatId, destThread);
    _postTelegram(cfg, '📋 Lista enviada no tópico Status.',
      chatId, messageId, link ? [[{ text:'📋 Ver em Status', url:link }]] : null, originThreadId);
  }
}

function _gerarWALink(whatsapp, texto) {
  const tel = String(whatsapp).replace(/\D/g,'');
  const num = tel.startsWith('55') ? tel : '55' + tel;
  const t   = texto.length > 500 ? texto.substring(0, 497) + '...' : texto;
  return 'https://wa.me/' + num + '?text=' + encodeURIComponent(t);
}

function _msgWAStatus(status, numero, nome, token) {
  const msgs = {
    'Pago':
      `Olá ${nome}! Recebemos o comprovante do pedido #${numero}. Já estamos separando tudo com carinho!`,
    'Em produção':
      `Olá ${nome}! Seu pedido #${numero} está em produção. Cookies fresquinhos sendo feitos para você!`,
    'Pronto':
      `Olá ${nome}! Pedido #${numero} pronto! Vamos combinar a entrega? Quando fica melhor para você?`,
    'Entregue': (() => {
      const _s   = 'https://r3dd1n0.github.io/mikiescookies/';
      const avalUrl = token
        ? `${_s}?avaliacao&t=${token}&p=${numero}&n=${encodeURIComponent(nome)}`
        : `${_s}?avaliacao&p=${numero}&n=${encodeURIComponent(nome)}`;
      return `Olá ${nome}!\n\nSeu pedido #${numero} foi entregue!\n\nEsperamos que tenha chegado com todo o carinho. Uma foto ou um emoji já fazem nosso dia!\n\nConta como foi: ${avalUrl}\n\n— Equipe Mikies Cookies`;
    })(),
    'Cancelado':
      `Olá ${nome}, seu pedido #${numero} foi cancelado. Qualquer dúvida, estamos à disposição. Esperamos te ver em breve!`,
  };
  return msgs[status] || null;
}

function _linkTopico(chatId, threadId) {
  if (!chatId || !threadId) return null;
  return `https://t.me/c/${String(chatId).replace(/^-100/, '')}/${threadId}`;
}

function _contarPedidosAnteriores(sheet, whatsapp, rowAtual) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 4) return 0;
  const numWA = _normalizarTelefone(whatsapp);
  if (!numWA) return 0;
  const dados = sheet.getRange(4, 4, lastRow - 3, 1).getValues();
  let count = 0;
  for (let i = 0; i < dados.length; i++) {
    if ((i + 4) >= rowAtual) break;
    if (_normalizarTelefone(dados[i][0]) === numWA) count++;
  }
  return count;
}

// Silêncio para alertas de pedidos parados: 22h–7h
function _emHorarioSilencioso() {
  const h = parseInt(Utilities.formatDate(new Date(), 'America/Fortaleza', 'H'), 10);
  return h >= 22 || h < 7;
}

// Fora do horário comercial (8h–22h, exceto domingo)
function _foraDoHorario() {
  const h   = parseInt(Utilities.formatDate(new Date(), 'America/Fortaleza', 'H'), 10);
  const dow = parseInt(Utilities.formatDate(new Date(), 'America/Fortaleza', 'u'), 10); // 1=seg, 7=dom
  return h < 8 || h >= 22 || dow === 7;
}

function _fmt(v) {
  return Number(v || 0).toFixed(2).replace('.', ',');
}

// Texto legível dos itens. `obj.itensTexto` já vem pronto (1 embalagem por linha).
// Com `prefixo`, cada linha recebe o marcador (ex.: '•' para Telegram, '-' para WhatsApp).
function _itensTexto(obj, prefixo) {
  const txt = String((obj && obj.itensTexto) || '').trim();
  if (!txt) return 'Sem itens';
  if (!prefixo) return txt;
  return txt.split('\n').map(l => `${prefixo} ${l}`).join('\n');
}

// Normaliza telefone: remove não-dígitos e prefixo 55 se resultar em 11+ dígitos
function _normalizarTelefone(tel) {
  let n = String(tel || '').replace(/\D/g, '');
  if (n.startsWith('55') && n.length >= 12) n = n.slice(2);
  return n;
}

// Garante linha de cabeçalho na aba. Se ausente, insere antes da linha 1.
function _garantirCabecalhos(sheet, headers) {
  if (String(sheet.getRange(1, 1).getValue()) === headers[0]) return;
  sheet.insertRowBefore(1);
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
}
