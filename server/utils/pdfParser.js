const pdfParse = require('pdf-parse');

// -----------------------------------------------
// Main function — takes a PDF buffer, returns
// structured transactions array
// -----------------------------------------------
const parseBankStatement = async (pdfBuffer) => {
  try {
    // Step 1 — Extract raw text from PDF
    const data = await pdfParse(pdfBuffer);
    const rawText = data.text;

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
  // Match patterns like "01/04/2024 to 31/03/2025"
  // or "From: 01-Apr-2024 To: 31-Mar-2025"
  const patterns = [
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+(?:to|TO)\s+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/,
    /from[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+to[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    /(\d{2}\s+\w+\s+\d{4})\s+(?:to|TO)\s+(\d{2}\s+\w+\s+\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        start: new Date(match[1]),
        end: new Date(match[2]),
      };
    }
  }

  // Default to current month if not found
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
  // Split text into lines and clean them
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const transactions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try to parse each line as a transaction
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
  // Pattern 1: DD/MM/YYYY or DD-MM-YYYY at start of line
  // Example: "15/03/2024 SWIGGY ORDER 12345 500.00 4500.00"
  const pattern1 = /^(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)(?:\s+([\d,]+\.?\d*))?$/;

  // Pattern 2: Date with month name
  // Example: "15 Mar 2024 UPI/PHONEPE/123456 DR 1000.00"
  const pattern2 = /^(\d{2}\s+\w{3}\s+\d{4})\s+(.+?)\s+(DR|CR|dr|cr)?\s*([\d,]+\.?\d*)$/i;

  // Pattern 3: HDFC style
  // Example: "15/03/2024 15/03/2024 UPI-SWIGGY-123 500.00 0.00 4500.00"
  const pattern3 = /^(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+\d{2}[\/\-]\d{2}[\/\-]\d{4}\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)$/;

  let match = null;
  let transaction = null;

  // Try Pattern 3 first (most specific)
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

  // Try Pattern 1
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

  // Try Pattern 2
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

  // Validate the transaction
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
  // Remove commas (Indian number format: 1,00,000)
  const cleaned = amountStr.replace(/,/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : Math.abs(amount);
};

// -----------------------------------------------
// Helper — Parse date string to Date object
// -----------------------------------------------
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyPattern = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/;
  const dmyMatch = dateStr.match(dmyPattern);
  if (dmyMatch) {
    // Month is 0-indexed in JavaScript Date
    return new Date(
      parseInt(dmyMatch[3]),
      parseInt(dmyMatch[2]) - 1,
      parseInt(dmyMatch[1])
    );
  }

  // Handle "15 Mar 2024" format
  return new Date(dateStr);
};

// -----------------------------------------------
// Helper — Determine if transaction is credit or debit
// -----------------------------------------------
const determineType = (description, debitAmount, creditAmount) => {
  const upperDesc = description.toUpperCase();

  // Keywords that indicate credit (money coming in)
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
  // Must have a valid date
  if (!transaction.date || isNaN(transaction.date.getTime())) return false;

  // Must have a positive amount
  if (!transaction.amount || transaction.amount <= 0) return false;

  // Description must be meaningful (more than 3 characters)
  if (!transaction.description || transaction.description.length < 3) return false;

  // Amount must be reasonable (not more than 10 crore)
  if (transaction.amount > 100000000) return false;

  return true;
};

module.exports = { parseBankStatement };