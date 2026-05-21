import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function generateContent(marketData, news, movers) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/New_York',
  });

  const dayOfWeek = today.getDay();
  let tradingDayLabel = "yesterday";
  if (dayOfWeek === 0) tradingDayLabel = "Friday";
  if (dayOfWeek === 1) tradingDayLabel = "Friday";
  if (dayOfWeek === 6) tradingDayLabel = "Friday";

  const prompt = `You are the writer for "Market Buzz Daily," a fun and engaging daily stock market digest for a 12-year-old who is learning about investing. He owns VOO (Vanguard S&P 500 ETF) in his portfolio.

Your job: Take the raw market data and news below and turn it into a JSON object I can use to build the daily digest page.

VOICE & TONE RULES:
- Write like a cool older brother explaining the markets — casual, fun, never boring
- Use simple language. If you must use a financial term, explain it right there in parentheses
- Use analogies a 12-year-old gets (video games, sports, pizza, school)
- Short sentences. Punchy. Not textbook-y.
- Sprinkle in emojis naturally but don't overdo it
- The "Why It Matters" sections should genuinely connect dots — show cause and effect chains
- NEVER include anything inappropriate, scary, or overly complex
- Skip any news about violence, war casualties, or disturbing events. Focus on business/tech/market stories.
- If there's geopolitical news that affects markets, keep it very high-level (e.g. "tensions eased" not graphic details)

TODAY'S DATE: ${dateStr}
TRADING DAY: Data is from ${tradingDayLabel}'s market close.

RAW MARKET DATA:
${JSON.stringify(marketData, null, 2)}

NEWS HEADLINES:
${JSON.stringify(news, null, 2)}

TOP MOVERS:
${JSON.stringify(movers, null, 2)}

Return ONLY a JSON object with this exact structure (no markdown, no backticks, no explanation):

{
  "date": "${dateStr}",
  "tradingDay": "${tradingDayLabel}",
  "marketVibe": "green" or "red" or "mixed",
  "vibeEmoji": "appropriate emoji",
  "vibeSummary": "One fun sentence summarizing the overall market day",
  "vooNote": "A sentence explaining what today's VOO move means in dollars per share and connecting it to the S&P 500. Make it personal — this is HIS fund.",
  "scoreboard": {
    "sp500": { "price": "formatted price", "change": "+X.XX%", "direction": "up/down", "vibe": "short fun comment" },
    "nasdaq": { "price": "formatted price", "change": "+X.XX%", "direction": "up/down", "vibe": "short fun comment" },
    "dow": { "price": "formatted price", "change": "+X.XX%", "direction": "up/down", "vibe": "short fun comment" },
    "voo": { "price": "$XXX.XX", "change": "+X.XX%", "direction": "up/down", "vibe": "short fun comment about HIS money" }
  },
  "stories": [
    {
      "badge": "hot/new/money/world/brain",
      "badgeLabel": "SHORT LABEL",
      "title": "Catchy headline a kid would click on",
      "body": "2-4 sentences explaining the story simply",
      "whyItMatters": "2-3 sentences connecting this to the bigger picture, explaining cause and effect"
    }
  ],
  "comingUp": [
    {
      "day": "MON/TUE/WED/THU/FRI",
      "title": "Short event name",
      "description": "One sentence on why to watch",
      "emoji": "relevant emoji"
    }
  ],
  "quiz": {
    "question": "A fun question related to today's news or a basic investing concept",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "2-3 sentences explaining the answer and teaching the concept"
  },
  "wordOfDay": {
    "word": "A financial/investing term",
    "type": "noun/verb/etc",
    "context": "what it relates to from today's news",
    "definition": "Fun, clear explanation with an analogy. 2-3 sentences max."
  }
}

Generate exactly 3 stories (pick the most interesting/relevant from the news), 3 coming-up items, and make the quiz and word of the day educational but fun. Stories should be from the provided news — don't make up stories.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[AI] Failed to parse response:', cleaned.substring(0, 200));
    throw new Error('Failed to parse AI response as JSON');
  }
}
