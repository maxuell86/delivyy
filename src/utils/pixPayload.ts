// ==============================================================
// GERADOR DE PAYLOAD PIX PADRÃO BANCO CENTRAL (BRCode EMV)
// Permite pagamento direto com 0% de taxas para qualquer restaurante
// ==============================================================

function formatElement(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixPayload({
  chave,
  nomeRecebedor,
  cidade,
  valor,
  identificador = 'PEDIDO',
}: {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  valor: number;
  identificador?: string;
}): string {
  const cleanKey = chave.trim();
  const cleanName = nomeRecebedor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 25)
    .toUpperCase() || 'MAX HAMBURGUER';

  const cleanCity = cidade
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 15)
    .toUpperCase() || 'TANGARA';

  const formattedAmount = valor.toFixed(2);

  // Merchant Account Information (ID 26)
  const gui = formatElement('00', 'br.gov.bcb.pix');
  const key = formatElement('01', cleanKey);
  const merchantAccountInfo = formatElement('26', `${gui}${key}`);

  // Additional Data Field Template (ID 62)
  const txId = formatElement('05', identificador.slice(0, 25) || '***');
  const additionalData = formatElement('62', txId);

  let raw = '';
  raw += formatElement('00', '01'); // Payload Format Indicator
  raw += formatElement('01', '12'); // Point of Initiation Method (12 = dynamic / single use)
  raw += merchantAccountInfo;
  raw += formatElement('52', '0000'); // Merchant Category Code
  raw += formatElement('53', '986'); // Transaction Currency (986 = BRL)
  raw += formatElement('54', formattedAmount); // Transaction Amount
  raw += formatElement('58', 'BR'); // Country Code
  raw += formatElement('59', cleanName); // Merchant Name
  raw += formatElement('60', cleanCity); // Merchant City
  raw += additionalData;
  raw += '6304'; // CRC16 placeholder

  const checksum = crc16(raw);
  return `${raw}${checksum}`;
}
