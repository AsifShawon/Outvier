import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AIProviderSetting } from '../models/AIProviderSetting.model';
import { decryptText } from '../utils/encryption';
import { ComparisonSession } from '../models/ComparisonSession.model';
import { Program } from '../models/Program.model';

export const aiService = {
  /**
   * Retrieves the active AI provider configuration and initializes the LangChain model
   */
  async getModel() {
    let provider = 'groq';
    let apiKey = process.env.GROQ_API_KEY;
    let modelName = 'llama-3.3-70b-versatile'; 

    // Check DB for active setting
    const activeSetting = await AIProviderSetting.findOne({ isActive: true }).select('+encryptedApiKey');
    if (activeSetting) {
      provider = activeSetting.provider;
      modelName = activeSetting.aiModel;
      if (activeSetting.encryptedApiKey) {
        try {
          apiKey = decryptText(activeSetting.encryptedApiKey);
        } catch (e) {
          console.error('Failed to decrypt API key from DB, falling back to ENV variables if available');
        }
      }
    }

    if (!apiKey) {
      throw new Error(`No API key found for AI Provider: ${provider}. Please configure it in the Admin settings or .env file.`);
    }

    // Only Groq is supported now as per user request
    if (provider === 'groq') {
      return new ChatGroq({
        apiKey: apiKey,
        model: modelName,
        temperature: 0.5,
      });
    }

    throw new Error(`Provider ${provider} is not supported. Only Groq is currently available.`);
  },

  /**
   * Generates a response based on the user's chat input and their current comparison session context
   */
  async generateResponse(question: string, sessionKey?: string, userId?: string) {
    const chatModel = await this.getModel();
    
    // Retrieve context (Fit Scores)
    let contextStr = 'The user currently has no programs in their comparison session.';
    let session;

    if (userId || sessionKey) {
      const filter = userId ? { userId } : { sessionKey };
      session = await ComparisonSession.findOne(filter);
      
      if (session && session.selectedProgramIds.length > 0 && session.generatedScores) {
        // Fetch program names for readable context
        const programs = await Program.find({ _id: { $in: session.selectedProgramIds } })
          .populate('universityId', 'name')
          .lean();
        
        const programMap = programs.reduce((acc: any, p: any) => {
          acc[p._id.toString()] = `${p.name} at ${p.universityId?.name || 'Unknown University'}`;
          return acc;
        }, {});

        // Format the scores into a readable context string for the LLM
        const scores: Record<string, any> = session.generatedScores as any;
        const contextLines = Object.entries(scores).map(([progId, scoreData]) => {
          const pName = programMap[progId] || 'Unknown Program';
          const reasons = scoreData.reasons?.join(' ') || 'No specific reasons generated.';
          return `- **${pName}**: Total Fit Score = ${scoreData.totalScore}/100. Breakdown: Affordability ${scoreData.breakdown.affordability}, Admission Match ${scoreData.breakdown.admissionMatch}, Location ${scoreData.breakdown.location}. Note: ${reasons}`;
        });

        contextStr = `The user is currently comparing the following programs:\n` + contextLines.join('\n');
      }
    }

    const systemMessage = new SystemMessage(`
You are an expert Australian University admissions counselor and decision-support assistant named "Outvier Copilot".
Your goal is to help students analyze their options based strictly on the data provided in the context below.
Be concise, encouraging, and highly specific. Refer to the user's Fit Scores when giving advice.

Context:
${contextStr}
`);

    const humanMessage = new HumanMessage(question);

    const response = await chatModel.invoke([systemMessage, humanMessage]);

    return {
      answer: response.content.toString(),
      contextUsed: contextStr !== 'The user currently has no programs in their comparison session.',
    };
  }
};
