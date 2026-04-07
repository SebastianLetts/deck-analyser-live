export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }

    try {
        const { deckText } = req.body;

        if (!deckText || typeof deckText !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid deckText in request body' });
        }

        // Truncate to ~12000 words to stay within context limits
        const truncatedText = deckText.split(/\s+/).slice(0, 12000).join(' ');

        const systemPrompt = `You are an elite investment banking ECM analyst. You review startup pitch decks and produce structured analyst notes.

You must return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "companyName": "string - the company name extracted from the deck",
  "score": number (1-10, how investor-ready is this deck),
  "stage": "string - Pre-Seed / Seed / Series A / Series B / Growth",
  "valuation": "string - estimated valuation range, e.g. '$2M - $8M'",
  "sections": {
    "Problem": boolean,
    "Solution": boolean,
    "Market Size": boolean,
    "Business Model": boolean,
    "Competition": boolean,
    "Team": boolean,
    "Financials": boolean,
    "Ask/Timeline": boolean
  },
  "feedback": [
    {"title": "string", "body": "string - actionable investor feedback"}
  ],
  "scoreSummary": "string - 1-2 sentence summary of the overall deck quality",
  "noteIntro": "string - 2 paragraph executive summary for ECM analyst note",
  "noteOffering": "string - 2 paragraph analysis of the problem and solution/offering",
  "noteMarket": "string - 2 paragraph analysis of market opportunity and competitive landscape",
  "noteTraction": "string - 2 paragraph analysis of traction, KPIs, and growth metrics",
  "noteTeam": "string - 2 paragraph assessment of the management team and execution capability",
  "noteFinancials": "string - 2 paragraph summary of financial projections and capital efficiency",
  "noteConclusion": "string - 2 paragraph investment conclusion with recommendation",
  "chartData": {
    "marketSOM": number (0-100, estimated SOM % of TAM),
    "marketSAM": number (0-100, estimated SAM % of TAM),
    "tractionData": [number, number, number, number, number, number],
    "revenueProjection": [number, number, number, number],
    "expenseProjection": [number, number, number, number]
  }
}

Guidelines:
- feedback array should have 3-5 items, each with specific, actionable advice
- All note sections should be substantive, professional, and reference actual content from the deck
- If the deck doesn't mention something, say so honestly rather than inventing facts
- Score should reflect: narrative quality (20%), completeness (20%), market opportunity (20%), team strength (20%), financial clarity (20%)
- Chart data should be realistic estimates based on what's in the deck
- tractionData represents 6 quarters of growth index (Q1-Q4 actual + Q1-Q2 projected)
- revenueProjection and expenseProjection are 4-year figures in $000s`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Please analyze this pitch deck text and return the structured JSON analysis:\n\n${truncatedText}` }
                ],
                temperature: 0.4,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenAI API error:', errorData);
            return res.status(response.status).json({
                error: errorData.error?.message || `OpenAI API error: ${response.status}`
            });
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();

        // Parse and validate the JSON response
        const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (!parsed.score || !parsed.sections || !parsed.noteIntro) {
            return res.status(500).json({ error: 'AI response missing required fields' });
        }

        return res.status(200).json(parsed);

    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
