const { OpenAI } = require('openai');
const { AppError } = require('../middlewares/error.middleware');

// Lazy client — only instantiated when an actual AI call is made
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
      const prompt = `
        You are an AI assistant helping to summarize meetings and extract action items.
        Read the following meeting transcript and provide:
        1. A concise meeting overview (2-3 sentences).
        2. A list of key decisions made.
        3. A list of blockers or issues raised.
        4. A list of action items, including what needs to be done and who is responsible. (ownerName must be exact match or "Unassigned").

        Output the result as a raw JSON object with this exact structure (do not include markdown formatting or backticks around the json):
        {
          "overview": "Brief meeting overview...",
          "keyDecisions": ["Decision 1", "Decision 2"],
          "blockers": ["Blocker 1", "Blocker 2"],
          "tasks": [
            { "content": "Action item description", "ownerName": "Name of owner or 'Unassigned'" }
          ]
        }

        Meeting Transcript:
        """
        ${transcript}
        """
      `;

      const response = await getOpenAI().chat.completions.create({
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
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
        tasks: resultJson.tasks || []
      };
    } catch (error) {
      attempt++;
      console.error(`[AI Service Error] Attempt ${attempt} failed:`, error);
      if (attempt >= maxRetries) {
        // Return a graceful fallback instead of throwing
        return {
          overview: 'AI summary generation failed. Please add manual notes.',
          keyDecisions: [],
          blockers: [],
          tasks: [],
          failed: true
        };
      }
      // Exponential backoff
      await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));
    }
  }
};

const askInMeetingBot = async (question, context) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OPENAI_API_KEY is not configured in the environment.');
  }

  try {
    const prompt = `
      You are IntellBot, an AI assistant in a live meeting.
      Answer the user's question concisely based on the recent meeting context provided below.
      
      Recent Meeting Context (Transcripts & Chat):
      """
      ${context}
      """
      
      User's Question: "${question}"
    `;

    const response = await getOpenAI().chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.5,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('[AI Bot Error]:', error);
    return "Sorry, I'm having trouble processing that right now.";
  }
};

module.exports = {
  processMeetingTranscript,
  askInMeetingBot
};
