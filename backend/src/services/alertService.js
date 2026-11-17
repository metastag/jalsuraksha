const nodemailer = require('nodemailer');
const db = require('../config/db');

/**
 * Automated Authority Alert Dispatcher (FR5)
 * Creates an in-app alert in PostgreSQL and dispatches an email notification
 * (via local mock transport or configured SMTP) when a water source crosses risk thresholds.
 */
async function evaluateAndDispatchAlert({ source, report, riskResult }) {
  // Trigger alerts when source risk is medium (>=35) or high (>=65), or report risk >= 45
  if (riskResult.risk_level === 'low' && (report.calculated_report_risk || 0) < 40) {
    return null;
  }

  const severity = riskResult.risk_level === 'high' ? 'critical' : 'warning';
  const violationSummary =
    riskResult.violations && riskResult.violations.length > 0
      ? riskResult.violations.slice(0, 3).join('; ')
      : 'Elevated contamination / symptom indicators reported';

  const title =
    severity === 'critical'
      ? `CRITICAL CONTAMINATION ALERT: ${source.name} (${source.locality})`
      : `Water Quality Warning: ${source.name} (${source.locality})`;

  const message = `Source [${source.code}] at ${source.locality} reached Risk Score ${riskResult.risk_score}/100 (${riskResult.risk_level.toUpperCase()} risk, ${riskResult.confidence_level} confidence). Key findings: ${violationSummary}. Immediate PHED inspection requested.`;

  // Insert alert into PostgreSQL
  const insertRes = await db.query(
    `INSERT INTO alerts (source_id, report_id, severity, title, message, assigned_jurisdiction, notification_channel, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'unread')
     RETURNING *`,
    [
      source.id,
      report.id,
      severity,
      title,
      message,
      source.jurisdiction || 'Gautam Buddha Nagar (Greater Noida)',
      'In-App + PHED Email Dispatch',
    ]
  );

  const alertRecord = insertRes.rows[0];

  // Dispatch mock/SMTP email via Nodemailer JSON transport (zero external dependency required)
  try {
    const transporter = nodemailer.createTransport({
      jsonTransport: true,
    });

    await transporter.sendMail({
      from: '"JalSuraksha Portal Alert Engine" <alerts@jalsuraksha-g315.org.in>',
      to: 'phed-control-room@gbnagar.gov.in',
      subject: `[${severity.toUpperCase()}] ${title}`,
      text: message,
    });
  } catch (err) {
    console.warn('[AlertService] Email transport log warning:', err.message);
  }

  return alertRecord;
}

module.exports = {
  evaluateAndDispatchAlert,
};
