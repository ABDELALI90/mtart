import { apiClient } from '@/services/apiClient';
import type { QuoteFormValues } from './schema';

export interface QuoteSubmissionResult {
  referenceNumber: string;
}

export async function submitQuoteRequest(values: QuoteFormValues): Promise<QuoteSubmissionResult> {
  const payload = {
    fullName: values.fullName,
    company: values.company,
    email: values.email,
    phone: values.phone,
    whatsapp: values.whatsapp,
    country: values.country,
    city: values.city,
    quantityM2: values.quantityM2 ? Number(values.quantityM2) : undefined,
    message: values.message,
    productName: values.productName,
    reference: values.reference,
    productId: values.productId,
    slug: values.slug,
    productUrl: values.productUrl,
    price: values.price,
    category: values.category,
    language: values.language,
    mould: values.mould,
    shareUrl: values.shareUrl,
  };
  const { data } = await apiClient.post<QuoteSubmissionResult>('/api/v1/inquiries/quotes', payload, {
    timeout: 30_000,
  });
  return data;
}
