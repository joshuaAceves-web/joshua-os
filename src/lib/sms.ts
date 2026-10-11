import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSMS({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  try {
    if (!client || !fromNumber) {
      console.warn('Twilio not configured');
      return { success: false, error: 'Twilio not configured' };
    }

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });

    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendLeadSMS(phone: string, contactName: string) {
  return sendSMS({
    to: phone,
    message: `¡Hola! Hemos recibido tu solicitud. Nos pondremos en contacto pronto. -Joshua OS`,
  });
}

export async function sendFollowUpSMS(phone: string) {
  return sendSMS({
    to: phone,
    message: `¿Todavía interesado? Responde a este mensaje para continuar. -Joshua OS`,
  });
}
