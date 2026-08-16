import { z } from 'zod';

/**
 * Client-side validation for the Request a Quote form.
 * Product/reference are attached from the selected catalog item and are not typed by the client.
 */
export const quoteFormSchema = z.object({
  fullName: z.string().trim().min(1, 'quote.validation.required'),
  company: z.string().trim().optional(),
  email: z.string().trim().min(1, 'quote.validation.required').email('quote.validation.email'),
  phone: z.string().trim().min(1, 'quote.validation.required'),
  whatsapp: z.string().trim().optional(),
  country: z.string().trim().min(1, 'quote.validation.required'),
  city: z.string().trim().min(1, 'quote.validation.required'),
  quantityM2: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) > 0), {
      message: 'quote.validation.positiveNumber',
    }),
  message: z.string().trim().optional(),
  productName: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  productId: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  productUrl: z.string().trim().optional(),
  price: z.string().trim().optional(),
  category: z.string().trim().optional(),
  language: z.string().trim().optional(),
  mould: z.string().trim().optional(),
  shareUrl: z.string().trim().optional(),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const QUOTE_FORM_DEFAULTS: Partial<QuoteFormValues> = {};
