// --- POSTMARK EMAIL CONFIGURATION ---
const POSTMARK_SERVER_TOKEN = 'b2f432df-31dc-4580-8c19-a835360f34ac';

// IMPORTANT: This MUST be the email address you verified in Postmark (Sender Signatures)
const VERIFIED_SENDER = 'gagaye8387@onbap.com'; 

/**
 * Sends a ultra-premium modern email notification using Postmark
 */
async function sendEmailNotification(to, subject, title, message, ctaLink = '#') {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
            body { font-family: 'Outfit', sans-serif; background-color: #f0f4f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f0f4f8; padding-bottom: 60px; }
            .main { background-color: #ffffff; width: 100%; max-width: 600px; margin: 0 auto; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); margin-top: 40px; border: 1px solid rgba(255,255,255,0.7); }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 50px 40px; text-align: center; position: relative; }
            .logo-text { font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -1px; margin: 0; position: relative; z-index: 2; }
            .badge { display: inline-block; padding: 6px 16px; background: rgba(255,255,255,0.2); border-radius: 100px; color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; backdrop-filter: blur(4px); position: relative; z-index: 2; }
            .content { padding: 50px 45px; text-align: left; }
            .title { font-size: 26px; font-weight: 700; color: #0f172a; margin-bottom: 20px; line-height: 1.2; }
            .text { font-size: 16px; color: #475569; line-height: 1.7; margin-bottom: 35px; white-space: pre-line; }
            .cta-btn { display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #2563EB 0%, #1e40af 100%); color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.25); }
            .footer { padding: 40px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; }
            .footer-text { font-size: 13px; color: #94a3b8; line-height: 1.5; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="main">
                <div class="header">
                    <div class="badge">EELU SMART NOTIFICATION</div>
                    <h1 class="logo-text">Learning System</h1>
                </div>
                <div class="content">
                    <h2 class="title">${title}</h2>
                    <p class="text">${message}</p>
                    <div style="text-align: center;">
                        <a href="${ctaLink}" class="cta-btn">Access Dashboard</a>
                    </div>
                </div>
                <div class="footer">
                    <p class="footer-text">
                        &copy; 2026 EELU Academic Hub. This is an automated notification based on your account preferences.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        const response = await fetch('https://api.postmarkapp.com/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN
            },
            body: JSON.stringify({
                "From": VERIFIED_SENDER,
                "To": "hazem-j@outlook.com, gagaye8387@onbap.com", // Sent to both recipients
                "Subject": subject,
                "HtmlBody": htmlContent,
                "MessageStream": "outbound"
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('Postmark Email Sent Successfully:', data.MessageID);
            return { success: true, messageId: data.MessageID };
        } else {
            console.error('Postmark API Response:', data);
            throw new Error(data.Message || 'Postmark API Error');
        }
    } catch (error) {
        console.error('Postmark Error (Backend):', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sends a WhatsApp message via Wasender API (Backend implementation)
 */
async function sendWhatsAppNotification(to, message) {
    const WASENDER_TOKEN = "ea4dba73b54792b10fcaccdc066ba3d0c4c559e2e4fa437ea9c7fa21cae10c1d";
    try {
        const response = await fetch("https://wasenderapi.com/api/send-message", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WASENDER_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "to": to,
                "text": message
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`WhatsApp API Error ${response.status}: ${errorText}`);
        }

        return { success: true };
    } catch (error) {
        console.error('WhatsApp sending error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendEmailNotification,
    sendWhatsAppNotification
};
