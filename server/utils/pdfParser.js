const { PDFParse } = require('pdf-parse');

// -----------------------------------------------
// Main function — takes a PDF buffer, returns
// structured transactions array
// -----------------------------------------------
const parseBankStatement = async (pdfBuffer) => {
  let parser;
  try {
    // Step 1 — Extract raw text from PDF using the new pdf-parse v2 API
    parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    const rawText = result.text;

    // Step 2 — Detect which bank this statement is from
    const bankName = detectBank(rawText);

    // Step 3 — Extract transactions based on bank format
    const transactions = extractTransactions(rawText, bankName);

    // Step 4 — Extract statement period
    const period = extractPeriod(rawText);

    return {
      bankName,
      transactions,
      periodStart: period.start,
      periodEnd: period.end,
      rawText,
    };

  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  } finally {
    // Always clean up the parser's internal resources, even on error
    if (parser) await parser.destroy();
  }
};

// -----------------------------------------------
// Detect bank name from statement text
// -----------------------------------------------
const detectBank = (text) => {
  const upperText = text.toUpperCase();

  if (upperText.includes('HDFC BANK')) return 'HDFC Bank';
  if (upperText.includes('ICICI BANK')) return 'ICICI Bank';
  if (upperText.includes('STATE BANK OF INDIA') || upperText.includes('SBI')) return 'SBI';
  if (upperText.includes('AXIS BANK')) return 'Axis Bank';
  if (upperText.includes('KOTAK MAHINDRA')) return 'Kotak Mahindra Bank';
  if (upperText.includes('PUNJAB NATIONAL BANK') || upperText.includes('PNB')) return 'PNB';
  if (upperText.includes('BANK OF BARODA')) return 'Bank of Baroda';
  if (upperText.includes('CANARA BANK')) return 'Canara Bank';
  if (upperText.includes('YES BANK')) return 'Yes Bank';
  if (upperText.includes('INDUSIND BANK')) return 'IndusInd Bank';

  return 'Unknown Bank';
};

// -----------------------------------------------
// Extract statement period (start and end dates)
// -----------------------------------------------
const extractPeriod = (text) => {
  const patterns = [
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+(?:to|TO)\s+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/,
    /from[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+to[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    /(\d{2}\s+\w+\s+\d{4})\s+(?:to|TO)\s+(\d{2}\s+\w+\s+\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const start = parseDate(match[1]);
      const end = parseDate(match[2]);

      // Guard against any still-invalid dates (e.g. unexpected formats)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return { start, end };
      }
    }
  }

  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: now,
  };
};

// -----------------------------------------------
// Extract transactions from raw text
// -----------------------------------------------
const extractTransactions = (text, bankName) => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const transactions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const transaction = parseLine(line, bankName);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  return transactions;
};

// -----------------------------------------------
// Parse a single line into a transaction object
// -----------------------------------------------
const parseLine = (line, bankName) => {
  const pattern1 = /^(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)(?:\s+([\d,]+\.?\d*))?$/;
  const pattern2 = /^(\d{2}\s+\w{3}\s+\d{4})\s+(.+?)\s+(DR|CR|dr|cr)?\s*([\d,]+\.?\d*)$/i;
  const pattern3 = /^(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+\d{2}[\/\-]\d{2}[\/\-]\d{4}\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)$/;

  let match = null;
  let transaction = null;

  match = line.match(pattern3);
  if (match) {
    const amount1 = parseAmount(match[3]);
    const amount2 = parseAmount(match[4]);
    const balance = parseAmount(match[5]);

    transaction = {
      date: parseDate(match[1]),
      description: match[2].trim(),
      amount: amount1 > 0 ? amount1 : amount2,
      type: amount1 > 0 ? 'debit' : 'credit',
      balance,
    };
  }

  if (!transaction) {
    match = line.match(pattern1);
    if (match) {
      const debitAmount = parseAmount(match[3]);
      const creditOrBalance = parseAmount(match[4]);

      transaction = {
        date: parseDate(match[1]),
        description: match[2].trim(),
        amount: debitAmount || creditOrBalance,
        type: determineType(match[2], debitAmount, creditOrBalance),
        balance: match[5] ? parseAmount(match[5]) : null,
      };
    }
  }

  if (!transaction) {
    match = line.match(pattern2);
    if (match) {
      const typeIndicator = match[3] ? match[3].toUpperCase() : null;
      transaction = {
        date: parseDate(match[1]),
        description: match[2].trim(),
        amount: parseAmount(match[4]),
        type: typeIndicator === 'CR' ? 'credit' : 'debit',
        balance: null,
      };
    }
  }

  if (transaction && isValidTransaction(transaction)) {
    return transaction;
  }

  return null;
};

// -----------------------------------------------
// Helper — Parse amount string to number
// -----------------------------------------------
const parseAmount = (amountStr) => {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/,/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : Math.abs(amount);
};

// -----------------------------------------------
// Helper — Parse date string to Date object
// -----------------------------------------------
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();

  const dmyPattern = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/;
  const dmyMatch = dateStr.match(dmyPattern);
  if (dmyMatch) {
    return new Date(
      parseInt(dmyMatch[3]),
      parseInt(dmyMatch[2]) - 1,
      parseInt(dmyMatch[1])
    );
  }

  return new Date(dateStr);
};

// -----------------------------------------------
// Helper — Determine if transaction is credit or debit
// -----------------------------------------------
const determineType = (description, debitAmount, creditAmount) => {
  const upperDesc = description.toUpperCase();

  const creditKeywords = [
    'SALARY', 'CREDIT', 'REFUND', 'CASHBACK',
    'INTEREST', 'DIVIDEND', 'NEFT CR', 'IMPS CR',
    'UPI CR', 'REVERSAL',
  ];

  for (const keyword of creditKeywords) {
    if (upperDesc.includes(keyword)) return 'credit';
  }

  return 'debit';
};

// -----------------------------------------------
// Helper — Validate that parsed data looks like
// a real transaction
// -----------------------------------------------
const isValidTransaction = (transaction) => {
  if (!transaction.date || isNaN(transaction.date.getTime())) return false;
  if (!transaction.amount || transaction.amount <= 0) return false;
  if (!transaction.description || transaction.description.length < 3) return false;
  if (transaction.amount > 100000000) return false;

  return true;
};

module.exports = { parseBankStatement };