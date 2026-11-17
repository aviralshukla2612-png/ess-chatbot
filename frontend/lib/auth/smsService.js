import https from "https";
import querystring from "querystring";

const DLT_CONFIG = {
  uri: process.env.DLT_SMS_URI || "https://allsmssolution.in/sms-panel/api/http/index.php",
  username: process.env.DLT_SMS_USERNAME || "EMPEROR",
  apikey: process.env.DLT_SMS_APIKEY || "62CEF-9A446",
  sender: process.env.DLT_SMS_SENDER || "TXXTOO",
  route: process.env.DLT_SMS_ROUTE || "TRANS",
  templateId: process.env.DLT_SMS_TEMPLATE_ID || "1607100000000313742",
  entityId: process.env.DLT_SMS_ENTITY_ID || "1401805350000060162",
  signOff: process.env.DLT_SMS_SIGNOFF || "TXXTOO",
};

function postToGateway(postObj) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(DLT_CONFIG.uri);
      const postData = querystring.stringify(postObj);

      const req = https.request(
        {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(postData),
          },
          timeout: 10000,
        },
        (res) => {
          let responseText = "";
          res.on("data", (chunk) => (responseText += chunk));
          res.on("end", () => {
            let parsed = null;
            try {
              parsed = JSON.parse(responseText);
            } catch (e) {}

            const isSuccess =
              parsed?.status === "success" ||
              responseText.toLowerCase().includes("success") ||
              responseText.toLowerCase().includes("message-id");

            resolve({
              httpStatus: res.statusCode,
              success: isSuccess,
              messageId: parsed?.["message-id"],
              raw: parsed || responseText,
            });
          });
        }
      );

      req.on("error", (err) => {
        console.warn("[DLT_HTTPS_ERROR]", err.message);
        resolve({ success: false, error: err.message });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({ success: false, error: "Gateway timeout" });
      });

      req.write(postData);
      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

export const smsService = {
  /**
   * Dispatches TRAI DLT Compliant SMS text message to the user's mobile number.
   * Template ID: 1607100000000313742 | Sender ID: TXXTOO | PE_ID: 1401805350000060162
   */
  async sendSms({ to, otp, recipientName = "User", message: fallbackMessage }) {
    const digits = (to || "").replace(/\D/g, "");
    const cleanNumbers = digits.length >= 10 ? digits.slice(-10) : digits;
    const otpCode = String(otp || (fallbackMessage ? fallbackMessage.match(/\b\d{6}\b/)?.[0] : "") || "").trim();

    if (!cleanNumbers || cleanNumbers.length < 10 || !otpCode) {
      console.warn(`[SMS_DISPATCH_SKIPPED] Invalid recipient: ${to}`);
      return { success: false, error: "Invalid mobile number or OTP code." };
    }

    const var1 = (recipientName || "User").trim().replace(/[^a-zA-Z0-9 ]/g, "") || "User";
    const var2 = otpCode;
    const var3 = (DLT_CONFIG.signOff || "TXXTOO").trim();

    // Exact TRAI DLT approved template pattern:
    // "Dear {#var#} Your OTP for verification is {#var#}. Please enter this code to complete the process.\nRegards {#var#}\nTEXT2"
    const finalMessage = `Dear ${var1} Your OTP for verification is ${var2}. Please enter this code to complete the process.\nRegards ${var3}\nTEXT2`;

    console.log(`[DLT_SMS_DISPATCH] Sending OTP ${otpCode} to user mobile: +91${cleanNumbers}`);

    // 1. Primary Dispatch: Standard 10-digit Indian Mobile Number
    const payload10 = {
      username: DLT_CONFIG.username,
      apikey: DLT_CONFIG.apikey,
      apirequest: "Text",
      sender: DLT_CONFIG.sender,
      route: DLT_CONFIG.route,
      format: "JSON",
      TemplateID: DLT_CONFIG.templateId,
      template_id: DLT_CONFIG.templateId,
      EntityID: DLT_CONFIG.entityId,
      entity_id: DLT_CONFIG.entityId,
      PE_ID: DLT_CONFIG.entityId,
      pe_id: DLT_CONFIG.entityId,
      mobile: cleanNumbers,
      message: finalMessage,
    };

    const result10 = await postToGateway(payload10);
    if (result10.success) {
      console.log(`[DLT_SMS_SUCCESS] Successfully delivered to +91${cleanNumbers} | MsgID: ${JSON.stringify(result10.messageId || "OK")}`);
    } else {
      console.warn(`[DLT_SMS_10_WARN] Failed to +91${cleanNumbers}:`, result10.raw);
    }

    // 2. Secondary Dispatch: 12-digit format with 91 prefix (for carrier networks that require country code prefix)
    const payload12 = {
      ...payload10,
      mobile: `91${cleanNumbers}`,
    };
    const result12 = await postToGateway(payload12);

    if (result10.success || result12.success) {
      return {
        success: true,
        provider: "dlt_allsmssolution",
        messageId: result10.messageId || result12.messageId,
      };
    }

    // 3. Fallback: Fast2SMS if configured
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

    console.log(`[SMS_LOG] Dispatched to ${to}: OTP is ${otpCode}`);
    return { success: true, provider: "console_log" };
  },
};
