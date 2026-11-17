/**
 * Universal SMS Gateway Dispatcher with TRAI DLT Compliant Provider
 * Primary: allsmssolution.in DLT Gateway (PE_ID: 1401805350000060162, Header: TXXTOO, TemplateID: 1607100000000313742)
 * Secondary: Fast2SMS, Twilio, Console Fallback.
 */

const DLT_CONFIG = {
  uri: process.env.DLT_SMS_URI || "https://allsmssolution.in/sms-panel/api/http/index.php",
  username: process.env.DLT_SMS_USERNAME || "EMPEROR",
  apikey: process.env.DLT_SMS_APIKEY || "62CEF-9A446",
  sender: process.env.DLT_SMS_SENDER || "TXXTOO",
  route: process.env.DLT_SMS_ROUTE || "TRANS",
  templateId: process.env.DLT_SMS_TEMPLATE_ID || "1607100000000313742",
  entityId: process.env.DLT_SMS_ENTITY_ID || "1401805350000060162",
  signOff: process.env.DLT_SMS_SIGNOFF || "Team Emperor",
};

export const smsService = {
  /**
   * Dispatches SMS to a recipient phone number using TRAI DLT-approved template.
   */
  async sendSms({ to, otp, recipientName = "User", message: fallbackMessage }) {
    // 1. Clean 10-digit Indian phone number
    const cleanNumbers = (to || "").replace(/^\+91/, "").replace(/\D/g, "");
    const otpCode = otp || (fallbackMessage ? fallbackMessage.match(/\b\d{6}\b/)?.[0] : "");

    // ========================================================
    // 1. Primary: TRAI DLT Telecom Gateway (allsmssolution.in)
    // ========================================================
    if (DLT_CONFIG.uri && DLT_CONFIG.apikey && cleanNumbers.length === 10 && otpCode) {
      try {
        const var1 = recipientName || "User";
        const var2 = otpCode;
        const var3 = DLT_CONFIG.signOff || "Team Emperor";

        // Exact approved TRAI DLT template text:
        // "Dear {#var#} Your OTP for verification is {#var#}. Please enter this code to complete the process.\nRegards {#var#}\nTEXT2"
        const finalMessage = `Dear ${var1} Your OTP for verification is ${var2}. Please enter this code to complete the process.\nRegards ${var3}\nTEXT2`;

        const params = new URLSearchParams();
        params.append("username", DLT_CONFIG.username);
        params.append("apikey", DLT_CONFIG.apikey);
        params.append("apirequest", "Text");
        params.append("sender", DLT_CONFIG.sender);
        params.append("route", DLT_CONFIG.route);
        params.append("format", "JSON");
        params.append("TemplateID", DLT_CONFIG.templateId);
        params.append("EntityID", DLT_CONFIG.entityId);
        params.append("PE_ID", DLT_CONFIG.entityId);
        params.append("mobile", cleanNumbers);
        params.append("message", finalMessage);

        const response = await fetch(DLT_CONFIG.uri, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        const rawText = await response.text();
        let parsed = null;
        try {
          parsed = JSON.parse(rawText);
        } catch (e) {}

        const isSuccess =
          parsed?.status === "success" ||
          rawText.toLowerCase().includes("success") ||
          rawText.toLowerCase().includes("message-id");

        if (isSuccess) {
          console.log(`[DLT_SMS_SUCCESS] Dispatched to +91${cleanNumbers} | MsgID: ${parsed?.["message-id"] || "OK"}`);
          return {
            success: true,
            provider: "dlt_allsmssolution",
            messageId: parsed?.["message-id"],
            raw: parsed || rawText,
          };
        } else {
          console.warn(`[DLT_SMS_WARNING] Gateway response: ${rawText}`);
        }
      } catch (dltErr) {
        console.warn("[DLT_SMS_ERROR]", dltErr.message);
      }
    }

    // ========================================================
    // 2. Secondary: Fast2SMS (Optional fallback)
    // ========================================================
    const fast2SmsKey = process.env.FAST2SMS_API_KEY;
    if (fast2SmsKey && otpCode) {
      try {
        const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: fast2SmsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: otpCode,
            numbers: cleanNumbers,
          }),
        });
        const d = await res.json();
        if (d && d.return) {
          console.log(`[Fast2SMS_SUCCESS] Dispatched to +91${cleanNumbers}`);
          return { success: true, provider: "fast2sms" };
        }
      } catch (err) {
        console.warn("[Fast2SMS_Error]", err.message);
      }
    }

    // ========================================================
    // 3. Tertiary: Twilio Gateway (Optional international)
    // ========================================================
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        const body = new URLSearchParams();
        body.append("To", to);
        body.append("From", twilioFrom);
        body.append("Body", fallbackMessage || `Your verification code is ${otpCode}`);

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
          console.log(`[Twilio_SUCCESS] Dispatched to ${to}`);
          return { success: true, provider: "twilio" };
        }
      } catch (err) {
        console.warn("[Twilio_Error]", err.message);
      }
    }

    // 4. Console log fallback
    console.log(`[SMS_LOG] Dispatched to ${to}: OTP is ${otpCode}`);
    return { success: true, provider: "console_log" };
  },
};
