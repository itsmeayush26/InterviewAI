interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class AIInterviewer {
  private conversationHistory: Message[] = [];
  private jobField: string;

  constructor(jobField: string) {
    this.jobField = jobField;
  }

  async getNextQuestion(userResponse?: string): Promise<string> {
    if (userResponse) {
      this.conversationHistory.push({
        role: 'user',
        content: userResponse
      });
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: this.conversationHistory,
            jobField: this.jobField
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get AI response');
      }

      const data = await response.json();
      const assistantMessage = data.message;

      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      return assistantMessage;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  getQuestionCount() {
    return this.conversationHistory.filter(msg => msg.role === 'assistant').length;
  }
}
