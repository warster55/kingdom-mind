import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function sendOTP(email: string, code: string) {
  const params = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
            <div style="font-family: serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #fafaf9; border-radius: 24px;">
              <h1 style="font-size: 24px; font-weight: normal; text-align: center; margin-bottom: 32px; letter-spacing: 0.2em; text-transform: uppercase; color: #78716c;">Kingdom Mind</h1>
              <p style="font-size: 18px; font-style: italic; margin-bottom: 24px; text-align: center;">Your sign-in code for the sanctuary</p>
              <div style="background-color: white; padding: 24px; border-radius: 16px; text-align: center; border: 1px solid #e7e5e4;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 0.5em; color: #d97706;">${code}</span>
              </div>
              <p style="font-size: 14px; color: #78716c; margin-top: 32px; text-align: center;">This code will expire in 10 minutes.</p>
              <hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 32px 0;" />
              <p style="font-size: 12px; color: #a8a29e; text-align: center; font-style: italic;">"Be transformed by the renewing of your mind."</p>
            </div>
          `,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: `${code} is your Kingdom Mind entry code`,
      },
    },
    Source: "servant@kingdomind.app", // Temporary verified sender for sandbox testing
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    console.error("SES Error:", error);
    return { success: false, error: error.message };
  }
}
