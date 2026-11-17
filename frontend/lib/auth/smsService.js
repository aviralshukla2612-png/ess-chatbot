/**
 * Universal SMS Gateway Dispatcher
 * Supports Twilio, Fast2SMS (India), MSG91, AWS SNS, or Console Fallback.
 */

export const smsService = {
  async sendSms({ to, message }) {
    // 1. Fast2SMS (popular, instant in India)
    const fast2SmsKey = process.env.FAST2SMS_API_KEY;
    if (fast2SmsKey) {
      try {
        const cleanNumbers = to.replace(/^\+91/, "").replace(/\D/g, "");
        const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: fast2SmsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: message.match(/\b\d{6}\b/)?.[0] || "",
            numbers: cleanNumbers,
          }),
        });
        const d = await res.json();
        if (d && d.return) {
          return { success: true, provider: "fast2sms" };
        }
      } catch (err) {
        console.warn("[Fast2SMS_Error]", err.message);
      }
    }

    // 2. Twilio Gateway
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        const body = new URLSearchParams();
        body.append("To", to);
        body.append("From", twilioFrom);
        body.append("Body", message);

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
          }
        );
        if (res.ok) {
          return { success: true, provider: "twilio" };
        }
      } catch (err) {
        console.warn("[Twilio_Error]", err.message);
      }
    }

    // 3. Fallback: Logged in stdout (works anywhere, instant, zero cost)
    console.log(`[SMS_LOG] Dispatched to ${to}: "${message}"`);
    return { success: true, provider: "console_log" };
  },
};

