import { useMemo, useState, type FormEvent, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import ContentCopy from '@mui/icons-material/ContentCopy';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/utils/paths';
import { submitContactRequest } from '@/features/contact/api';

const EMAIL = 'Cimentcarreaux06@gmail.com';
const PHONE_DISPLAY = '+212 719 202 277';
const PHONE_E164 = '+212719202277';
const WHATSAPP_URL = 'https://wa.me/212719202277';
const LOCATION = 'Dkhissa, Meknes, Morocco';
const MAP_LAT = 33.9373;
const MAP_LNG = -5.4666;
const MAPS_QUERY = encodeURIComponent(LOCATION);
const MAPS_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;
const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAPS_QUERY}`;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapsEmbedUrl(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${MAPS_QUERY}&zoom=15`;
  }

  // Official embed endpoint (no API key). Marker at Dkhissa, Meknes.
  return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13228!2d${MAP_LNG}!3d${MAP_LAT}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${MAPS_QUERY}!5e0!3m2!1sen!2sma!4v1710000000000!5m2!1sen!2sma`;
}

export function ContactPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const [copied, setCopied] = useState(false);
  const [valueCopied, setValueCopied] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const embedUrl = useMemo(() => mapsEmbedUrl(), []);

  async function shareLocation() {
    const title = `MT ART — ${LOCATION}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, text: title, url: MAPS_OPEN_URL });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(MAPS_OPEN_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.open(MAPS_OPEN_URL, '_blank', 'noopener,noreferrer');
    }
  }

  function validate(): boolean {
    const next: { name?: string; email?: string; message?: string } = {};
    if (!name.trim()) {
      next.name = t('contactPage.form.validation.name');
    }
    if (!email.trim() || !EMAIL_PATTERN.test(email.trim())) {
      next.email = t('contactPage.form.validation.email');
    }
    if (!message.trim()) {
      next.message = t('contactPage.form.validation.message');
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(false);
    setSubmitError(null);
    if (!validate()) {
      return;
    }

    setSending(true);
    try {
      await submitContactRequest({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        language: lang,
      });
      setSuccess(true);
      setFieldErrors({});
    } catch (error) {
      setSubmitError(t('contactPage.form.error'));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageMeta title={t('contactPage.title')} description={t('contactPage.subtitle')} lang={lang} path="/contact" />

      <div className="border-b border-charcoal/10 bg-ivory-dark py-14 pt-32 md:pt-40">
        <div className="container-mtart">
          <h1 className="font-display text-3xl text-charcoal md:text-4xl">{t('contactPage.title')}</h1>
          <p className="mt-3 max-w-xl text-sm text-charcoal-soft/75">{t('contactPage.subtitle')}</p>
        </div>
      </div>

      <div className="container-mtart grid grid-cols-1 gap-14 py-14 md:grid-cols-2 md:py-20">
        <div className="flex flex-col gap-8">
          <ContactRow icon={Mail} label={t('contactPage.email')} value={EMAIL} href={`mailto:${EMAIL}`} ltr copyValue={EMAIL} onCopied={() => setValueCopied(true)} />
          <ContactRow icon={Phone} label={t('contactPage.phone')} value={PHONE_DISPLAY} href={`tel:${PHONE_E164}`} ltr copyValue={PHONE_DISPLAY} onCopied={() => setValueCopied(true)} />
          <ContactRow icon={MessageCircle} label={t('contactPage.whatsapp')} value={PHONE_DISPLAY} href={WHATSAPP_URL} ltr external copyValue={PHONE_DISPLAY} onCopied={() => setValueCopied(true)} />
          <ContactRow icon={MapPin} label={t('contactPage.address')} value={LOCATION} />

          <div>
            <Button href={WHATSAPP_URL} target="_blank" rel="noreferrer" size="lg">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t('contactPage.whatsappCta')}
            </Button>
          </div>

          <div className="border-t border-charcoal/10 pt-8">
            <Button to={ROUTES.requestQuote(lang)} size="lg" variant="secondary">
              {t('common.requestQuote')}
            </Button>
          </div>
        </div>

        <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <TextField
            required
            name="name"
            autoComplete="name"
            label={t('contactPage.form.name')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
            disabled={sending}
          />
          <TextField
            required
            type="email"
            name="email"
            autoComplete="email"
            label={t('contactPage.form.email')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email}
            disabled={sending}
            inputProps={{ dir: 'ltr' }}
          />
          <TextField
            required
            multiline
            rows={5}
            name="message"
            label={t('contactPage.form.message')}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            error={Boolean(fieldErrors.message)}
            helperText={fieldErrors.message}
            disabled={sending}
          />
          {success ? (
            <p className="text-sm font-medium text-charcoal" role="status">
              {t('contactPage.form.success')}
            </p>
          ) : null}
          {submitError ? (
            <p className="text-sm text-charcoal" role="alert">
              {submitError}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="self-start" disabled={sending}>
            {sending ? t('contactPage.form.sending') : t('contactPage.form.submit')}
          </Button>
        </form>
      </div>

      <section className="border-t border-charcoal/10 bg-ivory-dark py-14 md:py-20">
        <div className="container-mtart">
          <h2 className="font-display text-2xl text-charcoal">{t('contactPage.factoryMap')}</h2>
          <p className="mt-2 text-sm text-charcoal-soft/75">{LOCATION}</p>

          <div className="mt-6 overflow-hidden border border-charcoal/10 bg-ivory">
            <iframe
              title={t('contactPage.factoryMap')}
              src={embedUrl}
              width="100%"
              height="400"
              className="block h-[300px] w-full md:h-[400px]"
              style={{ border: 0 }}
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={MAPS_OPEN_URL} target="_blank" rel="noreferrer" variant="secondary">
              {t('contactPage.openInMaps')}
            </Button>
            <Button href={MAPS_DIRECTIONS_URL} target="_blank" rel="noreferrer" variant="secondary">
              {t('contactPage.getDirections')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void shareLocation()}>
              {t('contactPage.shareLocation')}
            </Button>
          </div>
          {copied ? (
            <p className="mt-3 text-sm text-charcoal-soft/80" role="status">
              {t('contactPage.locationCopied')}
            </p>
          ) : null}
        </div>
      </section>

      <Snackbar
        open={valueCopied}
        autoHideDuration={1800}
        onClose={() => setValueCopied(false)}
        message="Copied"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  ltr = false,
  external = false,
  copyValue,
  onCopied,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
  ltr?: boolean;
  external?: boolean;
  copyValue?: string;
  onCopied?: () => void;
}) {
  const text = (
    <div>
      <p className="text-xs uppercase tracking-wide text-charcoal-soft/60">{label}</p>
      <p className="text-base font-medium text-charcoal" dir={ltr ? 'ltr' : undefined} style={ltr ? { unicodeBidi: 'isolate' } : undefined}>
        {value}
      </p>
    </div>
  );

  const body = (
    <>
      <Icon className="h-5 w-5 text-charcoal" aria-hidden="true" />
      {text}
    </>
  );

  if (href) {
    return (
      <div className="flex items-end">
        <a
          href={href}
          className="flex items-center gap-4 hover:opacity-80"
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
        >
          {body}
        </a>
        {copyValue ? <CopyValueButton value={copyValue} onCopied={onCopied} /> : null}
      </div>
    );
  }

  return <div className="flex items-center gap-4">{body}</div>;
}

function CopyValueButton({ value, onCopied }: { value: string; onCopied?: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement('textarea');
      input.value = value;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    onCopied?.();
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Tooltip title="Copied" open={copied} disableHoverListener disableFocusListener disableTouchListener>
      <IconButton
        size="small"
        onClick={(event) => void copy(event)}
        aria-label="Copy"
        sx={{
          color: 'text.primary',
          padding: '2px',
          marginInlineStart: '6px',
          flexShrink: 0,
        }}
      >
        <ContentCopy sx={{ fontSize: 15 }} />
      </IconButton>
    </Tooltip>
  );
}

export default ContactPage;
