/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as waitlistAdminNotification } from './waitlist-admin-notification.tsx'
import { template as waitlistWelcome } from './waitlist-welcome.tsx'
import { template as contactMessage } from './contact-message.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'waitlist-admin-notification': waitlistAdminNotification,
  'waitlist-welcome': waitlistWelcome,
  'contact-message': contactMessage,
}
