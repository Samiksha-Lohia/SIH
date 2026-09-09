import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * Email delivery abstraction. When SMTP is not configured, emails are logged
 * (no-op) so the backend runs fully without credentials. When configured, it
 * attempts to use nodemailer if that dependency is available.
 */
let transport = null;

async function getTransport() {
  if (!env.email.enabled) return null;
  if (transport) return transport;
  try {
    const nodemailer = await import('nodemailer');
    transport = nodemailer.default.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: { user: env.email.user, pass: env.email.pass },
    });
    return transport;
  } catch (err) {
    logger.warn(`Email transport unavailable (install nodemailer to enable): ${err.message}`);
    return null;
  }
}

export const emailService = {
  get enabled() {
    return env.email.enabled;
  },

  /**
   * Send an email. Always resolves (never throws) so callers can fire-and-forget.
   */
  async send({ to, subject, text, html }) {
    if (!to) return { sent: false, reason: 'no_recipient' };
    const tx = await getTransport();
    if (!tx) {
      logger.info(`[email suppressed] to=${to} subject="${subject}"`);
      return { sent: false, reason: env.email.enabled ? 'transport_unavailable' : 'disabled' };
    }
    try {
      await tx.sendMail({ from: env.email.from, to, subject, text, html });
      return { sent: true };
    } catch (err) {
      logger.warn(`Email send failed to ${to}: ${err.message}`);
      return { sent: false, reason: 'send_error' };
    }
  },
};

export default emailService;
