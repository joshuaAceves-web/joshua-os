import { Resend } from 'resend';
import { renderEmailTemplate, TemplateVariables } from './email-templates';
import { prisma } from './prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@joshua-os.com',
      to,
      subject,
      html,
    });

    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendEmailWithTemplate(
  to: string,
  templateSlug: string,
  workspaceId: string,
  variables: TemplateVariables
) {
  try {
    // Get template
    const template = await prisma.emailTemplate.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: templateSlug } },
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Render template with variables
    const rendered = renderEmailTemplate(
      {
        subject: template.subject,
        html: template.html,
        plainText: template.plainText,
      },
      variables
    );

    // Send email
    return sendEmail({
      to,
      subject: rendered.subject,
      html: rendered.html,
    });
  } catch (error) {
    console.error('Send email with template error:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: '¡Bienvenido a Joshua OS!',
    html: `
      <h1>¡Hola ${name}!</h1>
      <p>Gracias por registrarte en Joshua OS.</p>
      <p>Tu cuenta está lista para usar.</p>
      <a href="${process.env.NEXTAUTH_URL}/dashboard">Ir al Dashboard</a>
    `,
  });
}

export async function sendLeadNotification(
  email: string,
  contactName: string,
  contactEmail: string
) {
  return sendEmail({
    to: email,
    subject: `🔔 Nuevo Lead: ${contactName}`,
    html: `
      <h2>¡Nuevo Lead!</h2>
      <p><strong>Nombre:</strong> ${contactName}</p>
      <p><strong>Email:</strong> ${contactEmail}</p>
      <p>
        <a href="${process.env.NEXTAUTH_URL}/contacts">
          Ver en Contacts →
        </a>
      </p>
    `,
  });
}
