const { OpenAI } = require('openai');
const { AppError } = require('../middlewares/error.middleware');

let _openai = null;
const getOpenAI = () => {
  if (!_openai) {
    _openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    });
  }
  return _openai;
};

const processMeetingTranscript = async (transcript) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OPENAI_API_KEY is not configured in the environment.');
  }

  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const prompt = `You are an expert meeting analyst AI. Your job is to produce an extremely comprehensive and actionable summary of the following meeting transcript.

Analyze the transcript and extract:
1. **Overview**: A clear 3-5 sentence executive summary of what was discussed and accomplished.
2. **Key Decisions**: All decisions that were finalized or agreed upon.
3. **Action Items / Tasks**: Every task, to-do, or follow-up mentioned, with the responsible person's name (use "Unassigned" only if truly unknown).
4. **Blockers & Risks**: Anything preventing progress, risks raised, or dependencies flagged.
5. **Open Questions**: Unresolved questions or topics that need further discussion.
6. **Follow-ups**: Topics explicitly scheduled for the next meeting.
7. **Meeting Sentiment**: Overall tone (e.g., productive, tense, brainstorming, update-heavy).

Return ONLY a raw JSON object with no markdown formatting, no backticks, no explanation text:
{
  "overview": "string (3-5 sentences)",
  "keyDecisions": ["string"],
  "blockers": ["string"],
  "openQuestions": ["string"],
  "followUps": ["string"],
  "sentiment": "string",
  "tasks": [
    { "content": "Detailed task description", "ownerName": "Person's name or 'Unassigned'", "priority": "HIGH|MEDIUM|LOW" }
  ]
}

Meeting Transcript:
"""
${transcript}
"""`;

      const response = await getOpenAI().chat.completions.create({
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 4096
      });

      const resultText = response.choices[0].message.content;
      const jsonStart = resultText.indexOf('{');
      const jsonEnd = resultText.lastIndexOf('}') + 1;
      const cleanJson = resultText.substring(jsonStart, jsonEnd);
      
      const resultJson = JSON.parse(cleanJson);

      return {
        overview: resultJson.overview || 'No overview generated.',
        keyDecisions: resultJson.keyDecisions || [],
        blockers: resultJson.blockers || [],
        openQuestions: resultJson.openQuestions || [],
        followUps: resultJson.followUps || [],
        sentiment: resultJson.sentiment || 'neutral',
        tasks: resultJson.tasks || []
      };
    } catch (error) {
      attempt++;
      console.error(`[AI Service Error] Attempt ${attempt} failed:`, error.message);
      if (attempt >= maxRetries) {
        return {
          overview: 'AI summary generation failed. Please add manual notes.',
          keyDecisions: [],
          blockers: [],
          openQuestions: [],
          followUps: [],
          sentiment: 'unknown',
          tasks: [],
          failed: true
        };
      }
      await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));
    }
  }
};

const askInMeetingBot = async (question, context) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OPENAI_API_KEY is not configured in the environment.');
  }

  try {
    const systemPrompt = `You are IntellBot, an intelligent AI assistant embedded in a live meeting room called IntellMeet.
Your job is to help participants during the meeting by answering questions, summarizing discussions, identifying action items, and providing insights.
Be concise, helpful, and direct. Format your responses clearly using bullet points where appropriate.
Always base your answers on the provided meeting context when relevant.`;

    const userPrompt = `Recent Meeting Context (Chat & Live Transcript):
"""
${context || 'No context available yet.'}
"""

Question: ${question}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 1024
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('[AI Bot Error]:', error.message);
    return "Sorry, I'm having trouble processing that right now. Please try again.";
  }
};

module.exports = {
  processMeetingTranscript,
  askInMeetingBot
};
