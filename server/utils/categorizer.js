// -----------------------------------------------
// Rule-based transaction categorizer
// Maps transaction descriptions to categories
// -----------------------------------------------

const categoryRules = {
  food: [
    'swiggy', 'zomato', 'dominos', 'pizza', 'burger', 'restaurant',
    'cafe', 'coffee', 'starbucks', 'mcdonalds', 'kfc', 'subway',
    'hotel', 'dhaba', 'food', 'eat', 'dining', 'bakery', 'snacks',
    'blinkit', 'zepto', 'bigbasket', 'grofer', 'instamart',
  ],
  transport: [
    'uber', 'ola', 'rapido', 'auto', 'taxi', 'metro', 'irctc',
    'railway', 'train', 'bus', 'petrol', 'diesel', 'fuel',
    'parking', 'toll', 'fastag', 'airline', 'indigo', 'spicejet',
    'airindia', 'flight', 'travel',
  ],
  shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho',
    'snapdeal', 'shopify', 'retail', 'shop', 'store', 'mall',
    'purchase', 'order', 'buy', 'reliance', 'dmart', 'bigbazar',
  ],
  entertainment: [
    'netflix', 'amazon prime', 'hotstar', 'disney', 'spotify',
    'youtube', 'gaming', 'steam', 'bookmyshow', 'pvr', 'inox',
    'movie', 'cinema', 'theatre', 'concert', 'event', 'subscription',
  ],
  healthcare: [
    'hospital', 'clinic', 'doctor', 'pharmacy', 'medicine', 'medical',
    'apollo', 'fortis', 'max hospital', 'chemist', 'diagnostic',
    'lab', 'health', 'insurance', 'dental', 'eye',
  ],
  education: [
    'school', 'college', 'university', 'course', 'udemy', 'coursera',
    'byju', 'unacademy', 'fees', 'tuition', 'library', 'book',
    'stationery', 'coaching',
  ],
  utilities: [
    'electricity', 'water', 'gas', 'internet', 'broadband', 'airtel',
    'jio', 'vodafone', 'bsnl', 'mobile', 'recharge', 'postpaid',
    'bill', 'utility',
  ],
  rent: [
    'rent', 'landlord', 'housing', 'flat', 'apartment', 'pg',
    'accommodation', 'lease',
  ],
  salary: [
    'salary', 'stipend', 'payroll', 'wages', 'income', 'compensation',
    'bonus', 'incentive', 'payment from',
  ],
  investment: [
    'mutual fund', 'sip', 'zerodha', 'groww', 'upstox', 'angel',
    'stock', 'share', 'demat', 'nse', 'bse', 'fd', 'fixed deposit',
    'rd', 'recurring deposit', 'ppf', 'nps',
  ],
  transfer: [
    'neft', 'rtgs', 'imps', 'upi', 'transfer', 'sent to', 'received from',
    'phonepe', 'gpay', 'paytm', 'bhim',
  ],
  cash: [
    'atm', 'cash withdrawal', 'cash deposit', 'atm wd', 'atm/cdm',
  ],
};

// -----------------------------------------------
// Main categorize function
// -----------------------------------------------
const categorizeTransaction = (description) => {
  const lowerDesc = description.toLowerCase();

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryRules)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        // Calculate a simple confidence score
        // Longer keyword match = higher confidence
        const confidence = Math.min(0.95, 0.5 + keyword.length * 0.05);
        return { category, confidence };
      }
    }
  }

  // No match found
  return { category: 'other', confidence: 0.3 };
};

// -----------------------------------------------
// Categorize multiple transactions at once
// -----------------------------------------------
const categorizeTransactions = (transactions) => {
  return transactions.map((transaction) => {
    const { category, confidence } = categorizeTransaction(
      transaction.description
    );
    return {
      ...transaction,
      category,
      aiConfidence: confidence,
    };
  });
};

// -----------------------------------------------
// Check if transaction is an ATM withdrawal
// -----------------------------------------------
const isATMWithdrawal = (description) => {
  const lowerDesc = description.toLowerCase();
  const atmKeywords = ['atm', 'cash withdrawal', 'atm wd', 'atm/cdm', 'cash wd'];
  return atmKeywords.some((keyword) => lowerDesc.includes(keyword));
};

module.exports = { categorizeTransaction, categorizeTransactions, isATMWithdrawal };