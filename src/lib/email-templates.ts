import { prisma } from './prisma';

export interface EmailTemplateData {
  name: string;
  slug: string;
  description?: string;
  subject: string;
  html: string;
  plainText?: string;
  category?: string;
}

export async function createEmailTemplate(
  workspaceId: string,
  data: EmailTemplateData
) {
  // Extract variables from subject and html
  const variables = extractVariables([data.subject, data.html, data.plainText || '']);

  return prisma.emailTemplate.create({
    data: {
      ...data,
      variables: JSON.stringify(variables),
      workspaceId,
    },
  });
}

export async function updateEmailTemplate(
  templateId: string,
  data: Partial<EmailTemplateData>
) {
  // Extract variables if content changed
  const variables = data.subject || data.html || data.plainText
    ? extractVariables([
        data.subject || '',
        data.html || '',
        data.plainText || '',
      ])
    : undefined;

  return prisma.emailTemplate.update({
    where: { id: templateId },
    data: {
      ...data,
      ...(variables && { variables: JSON.stringify(variables) }),
    },
  });
}

export async function getEmailTemplate(templateId: string) {
  return prisma.emailTemplate.findUnique({
    where: { id: templateId },
  });
}

export async function getEmailTemplateBySlug(
  workspaceId: string,
  slug: string
) {
  return prisma.emailTemplate.findUnique({
    where: {
      workspaceId_slug: { workspaceId, slug },
    },
  });
}

export async function listEmailTemplates(
  workspaceId: string,
  category?: string
) {
  return prisma.emailTemplate.findMany({
    where: {
      workspaceId,
      ...(category && { category }),
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteEmailTemplate(templateId: string) {
  return prisma.emailTemplate.delete({
    where: { id: templateId },
  });
}

export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let rendered = template;

  // Replace all {{variable}} patterns
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(pattern, String(value));
  }

  return rendered;
}

export function renderEmailTemplate(
  template: { subject: string; html: string; plainText?: string | null },
  variables: TemplateVariables
) {
  return {
    subject: renderTemplate(template.subject, variables),
    html: renderTemplate(template.html, variables),
    plainText: template.plainText
      ? renderTemplate(template.plainText, variables)
      : undefined,
  };
}

// Extract {{variable}} patterns from text
function extractVariables(texts: string[]): string[] {
  const variables = new Set<string>();
  const pattern = /\{\{(\w+)\}\}/g;

  for (const text of texts) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      variables.add(match[1]);
    }
  }

  return Array.from(variables).sort();
}
