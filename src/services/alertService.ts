import { Database } from '../database/db';
import { AlertSettings } from '../types';
import axios from 'axios';
import nodemailer from 'nodemailer';

export class AlertService {
  public static async getSettings(): Promise<AlertSettings | undefined> {
    return await Database.get<AlertSettings>('SELECT * FROM alert_settings LIMIT 1');
  }

  public static async updateSettings(data: Partial<AlertSettings>): Promise<void> {
    const existing = await this.getSettings();
    if (existing) {
      await Database.run(
        `UPDATE alert_settings 
         SET is_enabled = ?, channel = ?, phone_number = ?, owner_name = ?, owner_email = ?,
             email_alerts_enabled = ?, smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_password = ?,
             api_key = ?, chat_id = ?, telegram_bot_token = ?, telegram_chat_id = ?,
             daily_digest_enabled = ?, daily_digest_time = ?, daily_digest_channel = ?, daily_digest_email = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          data.is_enabled ? 1 : 0,
          data.channel || 'telegram',
          data.phone_number || null,
          data.owner_name || 'Plant Owner',
          data.owner_email || 'admin@flyash.local',
          data.email_alerts_enabled ? 1 : 0,
          data.smtp_host || 'smtp.gmail.com',
          data.smtp_port || 587,
          data.smtp_user || null,
          data.smtp_password || null,
          data.api_key || null,
          data.chat_id || null,
          data.telegram_bot_token || null,
          data.telegram_chat_id || null,
          data.daily_digest_enabled ? 1 : 0,
          data.daily_digest_time || '19:00',
          data.daily_digest_channel || 'both',
          data.daily_digest_email || null,
          existing.id,
        ]
      );
    }
  }

  public static async sendTelegramMessage(text: string): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      const token = settings?.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
      const chatId = settings?.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;

      if (!token || !chatId) {
        console.warn('⚠️ Telegram Token or Chat ID not configured.');
        return false;
      }

      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      });
      return true;
    } catch (err: any) {
      console.error('Failed to send Telegram alert:', err.message);
      return false;
    }
  }

  public static async sendEmailAlert(subject: string, htmlContent: string): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      if (!settings || !settings.email_alerts_enabled || !settings.smtp_user || !settings.smtp_password) {
        return false;
      }

      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_port === 465,
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_password,
        },
      });

      await transporter.sendMail({
        from: `"${settings.owner_name}" <${settings.smtp_user}>`,
        to: settings.owner_email,
        subject,
        html: htmlContent,
      });
      return true;
    } catch (err: any) {
      console.error('Failed to send email alert:', err.message);
      return false;
    }
  }
}
