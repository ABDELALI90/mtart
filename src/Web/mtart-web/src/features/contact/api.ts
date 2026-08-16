import { apiClient } from '@/services/apiClient';

export interface ContactFormPayload {
  name: string;
  email: string;
  message: string;
  language: string;
}

export async function submitContactRequest(payload: ContactFormPayload): Promise<void> {
  await apiClient.post('/api/v1/contact', payload, { timeout: 30_000 });
}
