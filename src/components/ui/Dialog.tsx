import type { ReactNode } from 'react'
import { Dialog as RTDialog } from '@radix-ui/themes'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  maxWidth?: string
}

export function Modal({ open, onOpenChange, trigger, title, description, children, footer, maxWidth = '450px' }: ModalProps) {
  return (
    <RTDialog.Root open={open} onOpenChange={onOpenChange}>
      <RTDialog.Trigger>
        {trigger}
      </RTDialog.Trigger>
      <RTDialog.Content maxWidth={maxWidth}>
        {title ? <RTDialog.Title>{title}</RTDialog.Title> : null}
        {description ? (
          <RTDialog.Description size="2" mb="3">
            {description}
          </RTDialog.Description>
        ) : null}
        {children}
        {footer ? <div className="mt-4">{footer}</div> : null}
      </RTDialog.Content>
    </RTDialog.Root>
  )
} 