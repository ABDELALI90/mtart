import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QUOTE_FORM_DEFAULTS, quoteFormSchema, type QuoteFormValues } from '@/features/quote/schema';
import { submitQuoteRequest } from '@/features/quote/submitQuote';
import { TextField, TextareaField } from '@/components/forms/FormField';
import type { FieldError } from 'react-hook-form';
import type { TFunction } from 'i18next';

function translatedError(error: FieldError | undefined, t: TFunction): FieldError | undefined {
  if (!error) return undefined;
  return { ...error, message: t(error.message as string) };
}

export function QuoteForm({ defaultValues }: { defaultValues?: Partial<QuoteFormValues> }) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: { ...QUOTE_FORM_DEFAULTS, ...defaultValues },
  });

  const mutation = useMutation({
    mutationFn: submitQuoteRequest,
  });

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 border border-charcoal/15 bg-ivory-dark px-6 py-16 text-center">
        <CheckCircle2 className="h-8 w-8 text-charcoal" aria-hidden="true" />
        <h2 className="font-display text-2xl text-charcoal">{t('quote.success.heading')}</h2>
        <p className="max-w-sm text-sm text-charcoal-soft/80">
          {t('quote.success.body', { reference: mutation.data.referenceNumber })}
        </p>
        <Button
          onClick={() => {
            mutation.reset();
            reset();
          }}
          variant="secondary"
        >
          {t('quote.success.backHome')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-12" noValidate>
      {mutation.isError ? (
        <div role="alert" className="border border-charcoal/20 bg-ivory-dark px-5 py-4 text-sm text-charcoal">
          <p className="font-medium text-charcoal">{t('quote.error.heading')}</p>
          <p className="mt-1 text-charcoal-soft/85">{t('quote.error.generic')}</p>
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-2 font-display text-xl text-charcoal">{t('quote.sections.contact')}</legend>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            label={t('quote.fields.fullName')}
            htmlFor="fullName"
            required
            register={register('fullName')}
            error={translatedError(errors.fullName, t)}
          />
          <TextField label={t('quote.fields.company')} htmlFor="company" register={register('company')} />
          <TextField
            label={t('quote.fields.email')}
            htmlFor="email"
            type="email"
            required
            register={register('email')}
            error={translatedError(errors.email, t)}
          />
          <TextField
            label={t('quote.fields.phone')}
            htmlFor="phone"
            type="tel"
            required
            register={register('phone')}
            error={translatedError(errors.phone, t)}
          />
          <TextField label={t('quote.fields.whatsapp')} htmlFor="whatsapp" type="tel" register={register('whatsapp')} />
          <TextField
            label={t('quote.fields.country')}
            htmlFor="country"
            required
            register={register('country')}
            error={translatedError(errors.country, t)}
          />
          <TextField
            label={t('quote.fields.city')}
            htmlFor="city"
            required
            register={register('city')}
            error={translatedError(errors.city, t)}
          />
          <TextField
            label={t('quote.fields.quantityM2')}
            htmlFor="quantityM2"
            type="number"
            register={register('quantityM2')}
            error={translatedError(errors.quantityM2, t)}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-2 font-display text-xl text-charcoal">{t('quote.sections.message')}</legend>
        <TextareaField
          label={t('quote.fields.message')}
          htmlFor="message"
          register={register('message')}
          error={translatedError(errors.message, t)}
        />
      </fieldset>

      <input type="hidden" {...register('productName')} />
      <input type="hidden" {...register('reference')} />
      <input type="hidden" {...register('productId')} />
      <input type="hidden" {...register('slug')} />
      <input type="hidden" {...register('productUrl')} />
      <input type="hidden" {...register('price')} />
      <input type="hidden" {...register('category')} />
      <input type="hidden" {...register('language')} />
      <input type="hidden" {...register('mould')} />
      <input type="hidden" {...register('shareUrl')} />

      <Button type="submit" size="lg" disabled={mutation.isPending} className="self-start">
        {mutation.isPending ? t('quote.submitting') : t('quote.submit')}
      </Button>
    </form>
  );
}
