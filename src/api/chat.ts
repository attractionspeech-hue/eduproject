import axios from 'axios';

export interface ChatRequest {
  message: string;
  systemPrompt: string;
}

export interface ChatResponse {
  content: string;
}

export const chatAPI = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await axios.post<ChatResponse>('/api/chat', {
      message: request.message,
      systemPrompt: request.systemPrompt,
    });
    return response.data;
  },
};
