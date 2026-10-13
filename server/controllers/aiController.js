const Groq = require('groq-sdk');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// ── HELPER: fetch user's last 90 days and build context string ──
const buildUserFinancialContext = async (userId) => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const transactions = await Transaction.find({
        user: userId,
        date: { $gte: ninetyDaysAgo },
    })
        .select('amount type category description date')
        .sort({ date: -1 })
        .limit(100);

    const user = await User.findById(userId).select('name monthlyIncome');

    if (!transactions.length) {
        return {
            contextString: 'The user has no transaction history yet.',
            user,
            stats: null,
        };
    }

    const stats = transactions.reduce(
        (acc, txn) => {
            if (txn.type === 'debit') {
                acc.totalSpent += txn.amount;
                acc.byCategory[txn.category] =
                    (acc.byCategory[txn.category] || 0) + txn.amount;
            } else {
                acc.totalIncome += txn.amount;
            }
            return acc;
        },
        { totalSpent: 0, totalIncome: 0, byCategory: {} }
    );

    const topCategories = Object.entries(stats.byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(0)}`);

    const contextString = `
User Financial Summary (Last 90 Days):
- Name: ${user?.name || 'User'}
- Monthly Income: ₹${user?.monthlyIncome || 'Not set'}
- Total Spent (90 days): ₹${stats.totalSpent.toFixed(0)}
- Total Income (90 days): ₹${stats.totalIncome.toFixed(0)}
- Net Savings: ₹${(stats.totalIncome - stats.totalSpent).toFixed(0)}
- Top Spending Categories: ${topCategories.join(', ')}
- Total Transactions Analyzed: ${transactions.length}
    `.trim();

    return { contextString, user, stats };
};

// ── CONTROLLER 1: Chat with AI Coach ──
const chatWithAICoach = async (req, res) => {
    try {
        const { messages } = req.body;
        const userId = req.user._id;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Messages array is required',
            });
        }

        const { contextString } = await buildUserFinancialContext(userId);

        const systemPrompt = `
You are PaySense Coach, a friendly and knowledgeable AI financial advisor 
specialized for Indian users. You speak in a warm, encouraging tone.

Your expertise covers:
- Personal budgeting using the 50/30/20 rule
- Indian investment options (SIPs, FDs, PPF, NPS, ELSS)
- UPI, credit card optimization, and cashback strategies
- Emergency fund planning
- Tax-saving under Section 80C and 80D

Here is the real financial data for the user you are advising:
${contextString}

Guidelines:
- Always personalize advice based on the user's actual data above
- Give specific, actionable steps — not vague platitudes
- Keep responses concise (3-5 sentences max unless asked for detail)
- Use Indian Rupee (₹) for all monetary values
- If data is missing, gently ask them to upload a bank statement
- Never recommend illegal tax evasion or unregulated investments
        `.trim();

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
        });

        const aiReply = completion.choices[0]?.message?.content;
        if (!aiReply) throw new Error('No response received from AI');

        res.status(200).json({
            success: true,
            message: aiReply,
            usage: completion.usage,
        });
    } catch (error) {
        console.error('AI Chat Error:', error);
        if (error.status === 429) {
            return res.status(429).json({
                success: false,
                message: 'AI service is rate limited. Please wait a moment and try again.',
            });
        }
        res.status(500).json({
            success: false,
            message: 'AI coach is temporarily unavailable. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// ── CONTROLLER 2: Spending Analysis ──
const getSpendingAnalysis = async (req, res) => {
    try {
        const userId = req.user._id;
        const { contextString, stats } = await buildUserFinancialContext(userId);

        const analysisPrompt = `
Based on the following financial data for an Indian user, provide a detailed 
spending analysis. Structure your response with these exact sections:

**📊 SPENDING OVERVIEW**
(2-3 sentences summarizing the overall financial picture)

**🚨 AREAS OF CONCERN**
(List 2-3 categories where spending seems high, with specific ₹ amounts)

**💡 ACTIONABLE TIPS**
(Give 3 specific, practical tips tailored to Indian context)

**🎯 30-DAY CHALLENGE**
(One specific, measurable goal they can start tomorrow)

User's financial data:
${contextString}
        `.trim();

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: analysisPrompt }],
            temperature: 0.6,
            max_tokens: 1500,
        });

        const analysis = completion.choices[0]?.message?.content;
        if (!analysis) throw new Error('No analysis received from AI');

        res.status(200).json({
            success: true,
            analysis,
            stats,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Spending Analysis Error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not generate spending analysis.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// ── CONTROLLER 3: Budget Recommendation ──
const getBudgetRecommendation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { contextString } = await buildUserFinancialContext(userId);

        const budgetPrompt = `
You are a certified Indian financial planner. Based on the user's financial data,
create a detailed personalized monthly budget recommendation.

Format your response exactly like this:

**💰 YOUR PERSONALIZED BUDGET PLAN**

Monthly Income: ₹[amount]

**NEEDS (50% = ₹[amount])**
- Rent/EMI: ₹[amount]
- Groceries & Essentials: ₹[amount]
- Utilities & Recharges: ₹[amount]
- Transport: ₹[amount]

**WANTS (30% = ₹[amount])**
- Dining Out & Food Delivery: ₹[amount]
- Entertainment & OTT: ₹[amount]
- Shopping & Lifestyle: ₹[amount]

**SAVINGS & INVESTMENTS (20% = ₹[amount])**
- Emergency Fund: ₹[amount]
- SIP (Mutual Funds): ₹[amount]
- PPF or NPS: ₹[amount]

**WHY THIS WORKS FOR YOU**
(2-3 sentences explaining why this budget fits their spending pattern)

User's Financial Data:
${contextString}
        `.trim();

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: budgetPrompt }],
            temperature: 0.5,
            max_tokens: 1200,
        });

        const recommendation = completion.choices[0]?.message?.content;
        if (!recommendation) throw new Error('No budget recommendation received from AI');

        res.status(200).json({
            success: true,
            recommendation,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Budget Recommendation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not generate budget recommendation.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// ── CONTROLLER 4: Financial Health Score ──
const getFinancialHealthScore = async (req, res) => {
    try {
        const userId = req.user._id;
        const { contextString, stats } = await buildUserFinancialContext(userId);

        let score = 50;
        let scoreBreakdown = {};

        if (stats) {
            const savingsRate =
                stats.totalIncome > 0
                    ? ((stats.totalIncome - stats.totalSpent) / stats.totalIncome) * 100
                    : 0;

            let savingsPoints = 0;
            if (savingsRate >= 20) savingsPoints = 30;
            else if (savingsRate >= 10) savingsPoints = 20;
            else if (savingsRate >= 0) savingsPoints = 10;
            else savingsPoints = 0;

            scoreBreakdown.savingsRate = {
                value: savingsRate.toFixed(1),
                points: savingsPoints,
                maxPoints: 30,
            };

            const categoryCount = Object.keys(stats.byCategory).length;
            const diversityPoints = Math.min(categoryCount * 3, 20);

            scoreBreakdown.diversity = {
                categories: categoryCount,
                points: diversityPoints,
                maxPoints: 20,
            };

            score = Math.min(50 + savingsPoints + diversityPoints, 100);
            score = Math.max(score, 10);
        }

        let grade, gradeMessage;
        if (score >= 80) { grade = 'A'; gradeMessage = 'Excellent Financial Health'; }
        else if (score >= 60) { grade = 'B'; gradeMessage = 'Good Financial Health'; }
        else if (score >= 40) { grade = 'C'; gradeMessage = 'Needs Improvement'; }
        else { grade = 'D'; gradeMessage = 'Financial Health at Risk'; }

        const scoreExplanationPrompt = `
A financial health score of ${score}/100 (Grade ${grade}: ${gradeMessage}) was calculated 
for an Indian user based on their financial data:

${contextString}

Score breakdown:
${JSON.stringify(scoreBreakdown, null, 2)}

In 3-4 sentences, explain:
1. What this score means for them specifically
2. The single most impactful thing they can do THIS WEEK to improve it
3. End with an encouraging statement

Keep the tone warm and motivating, not scary.
        `.trim();

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: scoreExplanationPrompt }],
            temperature: 0.7,
            max_tokens: 400,
        });

        const explanation = completion.choices[0]?.message?.content;

        res.status(200).json({
            success: true,
            score,
            grade,
            gradeMessage,
            scoreBreakdown,
            explanation,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Health Score Error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not calculate financial health score.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

module.exports = {
    chatWithAICoach,
    getSpendingAnalysis,
    getBudgetRecommendation,
    getFinancialHealthScore,
};