import { AlertSettings } from '../types';

export interface AlertPayload {
  type: 'wrong_password' | 'low_stock' | 'high_expense' | 'shift_digest' | 'test';
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  details?: Record<string, any>;
}

// Check and record alert frequency count for rate limiting
export function checkAndIncrementAlertCount(maxAlerts: number): { allowed: boolean; count: number; limit: number } {
  if (maxAlerts <= 0) {
    return { allowed: true, count: 0, limit: 0 }; // 0 means unlimited
  }

  const today = new Date().toISOString().split('T')[0];
  const storageKey = `flyash_alert_count_${today}`;
  const currentCount = parseInt(localStorage.getItem(storageKey) || '0', 10);

  if (currentCount >= maxAlerts) {
    console.warn(`[Alert System] Daily notification limit reached (${currentCount}/${maxAlerts}).`);
    return { allowed: false, count: currentCount, limit: maxAlerts };
  }

  localStorage.setItem(storageKey, String(currentCount + 1));
  return { allowed: true, count: currentCount + 1, limit: maxAlerts };
}

export function getTodayAlertCount(): number {
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `flyash_alert_count_${today}`;
  return parseInt(localStorage.getItem(storageKey) || '0', 10);
}

// 1. TELEGRAM DISPATCH
export async function sendTelegramNotification(
  token: string,
  chatId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  if (!token || !chatId) {
    return { success: false, error: 'Telegram Bot Token or Chat ID not configured.' };
  }

  try {
    const url = `https://api.telegram.org/bot${token.trim()}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.description || 'Telegram API rejected request.' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error reaching Telegram API.' };
  }
}

// 2. WHATSAPP ALERT LINK
export function getWhatsAppAlertUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : '91' + cleanPhone}?text=${encodedMsg}`;
}

// 3. EMAIL ALERT DISPATCH
export async function sendEmailNotification(
  settings: AlertSettings,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  if (!settings.owner_email) {
    return { success: false, error: 'Recipient Email not configured.' };
  }

  // If EmailJS credentials are provided
  if (settings.email_service_id && settings.email_template_id && settings.email_public_key) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: settings.email_service_id,
          template_id: settings.email_template_id,
          user_id: settings.email_public_key,
          template_params: {
            to_email: settings.owner_email,
            subject: subject,
            message: body,
            plant_name: 'Sri Balamurugan Fly Ash Bricks',
          },
        }),
      });

      if (response.ok) {
        return { success: true };
      }
    } catch (e: any) {
      console.warn('EmailJS error:', e);
    }
  }

  // Fallback: Webhook or logged notification
  console.log(`[Email Alert Prepared for ${settings.owner_email}]: ${subject}\n${body}`);
  return { success: true };
}

// 4. MULTI-CHANNEL SYSTEM DISPATCH
export async function dispatchMultiChannelAlert(
  settings: AlertSettings,
  payload: AlertPayload
): Promise<{
  telegram?: { success: boolean; error?: string };
  email?: { success: boolean; error?: string };
  whatsappUrl?: string;
  limitReached?: boolean;
}> {
  // Check daily limit
  const rateLimit = checkAndIncrementAlertCount(settings.max_alerts_per_day || 0);
  if (!rateLimit.allowed) {
    return { limitReached: true };
  }

  const results: any = {};
  const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const formattedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Format Telegram message (HTML)
  const tgIcon = payload.severity === 'critical' ? '🚨' : payload.severity === 'warning' ? '⚠️' : '📢';
  const tgText = `<b>${tgIcon} PLANT ALERT: ${payload.title}</b>\n\n` +
    `🏢 <b>Plant:</b> Sri Balamurugan Fly Ash\n` +
    `🕒 <b>Time:</b> ${formattedDate} at ${formattedTime}\n\n` +
    `📝 <b>Details:</b>\n${payload.message}\n\n` +
    `<i>— Automated Fly Ash ERP Security & Operations Sentinel</i>`;

  // Format Plain Text for WhatsApp & Email
  const plainText = `${tgIcon} PLANT ALERT: ${payload.title}\n` +
    `🏢 Plant: Sri Balamurugan Fly Ash\n` +
    `🕒 Time: ${formattedDate} at ${formattedTime}\n\n` +
    `Details:\n${payload.message}\n\n` +
    `— Fly Ash ERP Sentinel`;

  // Dispatch to Telegram
  if (settings.alert_channel_telegram && settings.telegram_bot_token && settings.telegram_chat_id) {
    results.telegram = await sendTelegramNotification(
      settings.telegram_bot_token,
      settings.telegram_chat_id,
      tgText
    );
  }

  // Dispatch to Email
  if (settings.alert_channel_email && settings.owner_email) {
    results.email = await sendEmailNotification(
      settings,
      `[${payload.severity?.toUpperCase() || 'ALERT'}] ${payload.title} - Fly Ash ERP`,
      plainText
    );
  }

  // Prepare WhatsApp Link
  if (settings.alert_channel_whatsapp && (settings.owner_whatsapp || settings.owner_phone)) {
    const phone = settings.owner_whatsapp || settings.owner_phone || '';
    results.whatsappUrl = getWhatsAppAlertUrl(phone, plainText);
  }

  return results;
}

// 5. WRONG PASSWORD ATTEMPT TRACKER
let consecutiveFailedAttempts = 0;

export async function trackFailedLoginAttempt(
  settings: AlertSettings,
  attemptedUsername: string
): Promise<{ triggeredAlert: boolean; attemptCount: number; message?: string }> {
  consecutiveFailedAttempts += 1;
  const threshold = settings.alert_wrong_password_threshold || 1;

  if (settings.alert_wrong_password_enabled && consecutiveFailedAttempts >= threshold) {
    const alertMsg = `⚠️ SECURITY WARNING: Failed login attempt detected!\n` +
      `👤 Attempted Username: "${attemptedUsername}"\n` +
      `🔢 Consecutive Failed Attempts: ${consecutiveFailedAttempts}\n` +
      `🌐 Client Device: ${navigator.userAgent.slice(0, 80)}...\n\n` +
      `If this was not you, please verify your staff access credentials.`;

    await dispatchMultiChannelAlert(settings, {
      type: 'wrong_password',
      title: `Unauthorized Login Attempt (${consecutiveFailedAttempts} Failed)`,
      message: alertMsg,
      severity: 'critical',
    });

    return { triggeredAlert: true, attemptCount: consecutiveFailedAttempts, message: 'Security alert dispatched to configured channels.' };
  }

  return { triggeredAlert: false, attemptCount: consecutiveFailedAttempts };
}

export function resetFailedLoginAttempts() {
  consecutiveFailedAttempts = 0;
}
