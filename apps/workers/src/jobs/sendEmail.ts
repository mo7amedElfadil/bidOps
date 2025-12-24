import nodemailer from 'nodemailer'
import { Notification } from '@prisma/client'
import { prisma } from '../prisma'

function escapeHtml(value?: string) {
	if (!value) return ''
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
}

function buildNotificationText(note: Notification) {
	const lines = []
	if (note.body) {
		lines.push(note.body)
	}
	const payload = note.payload as Record<string, any> | undefined
	if (payload?.actionUrl) {
		const label = payload.actionLabel || 'Take action'
		lines.push(`${label}: ${payload.actionUrl}`)
	}
	return lines.join('\n\n') || 'You have a new notification from BidOps.'
}

function buildNotificationHtml(note: Notification) {
	const payload = note.payload as Record<string, any> | undefined
	const bodyHtml = note.body
		? note.body
				.split('\n')
				.map(line => `<p style="margin:0 0 8px;">${escapeHtml(line)}</p>`)
				.join('')
		: ''
	const descriptionHtml = payload?.actionDescription
		? `<p style="margin:8px 0 12px; color:#475569;">${escapeHtml(payload.actionDescription)}</p>`
		: ''
	const actionHtml = payload?.actionUrl
		? `<p style="margin:12px 0;"><a
				href="${escapeHtml(payload.actionUrl)}"
				style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;"
			>${escapeHtml(payload.actionLabel || 'Take action')}</a></p>`
		: ''
	return `
		<div style="font-family: 'Segoe UI', system-ui, sans-serif; color:#0f172a; font-size:14px;">
			${bodyHtml}
			${descriptionHtml}
			${actionHtml}
			<p style="margin-top:18px;font-size:11px;color:#94a3b8;">Sent via BidOps</p>
		</div>
	`
}

export async function processEmailBatch(limit = 20) {
	const host = process.env.SMTP_HOST || 'localhost'
	const port = Number(process.env.SMTP_PORT || 1025)
	const secure = process.env.SMTP_SECURE === 'true' || port === 465
	const user = process.env.SMTP_USER
	const pass = process.env.SMTP_PASS
	const transporter = nodemailer.createTransport({
		host,
		port,
		secure,
		auth: user && pass ? { user, pass } : undefined,
		requireTLS: process.env.SMTP_REQUIRE_TLS === 'true',
		tls: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false' ? { rejectUnauthorized: false } : undefined
	})

	const pending = await prisma.notification.findMany({
		where: { status: 'pending', channel: 'EMAIL' },
		orderBy: { createdAt: 'asc' },
		take: limit
	})
	for (const n of pending) {
		try {
			if (!n.to) {
				throw new Error('Missing recipient')
			}
			const text = buildNotificationText(n)
			await transporter.sendMail({
				from: process.env.SMTP_FROM || 'bidops@example.com',
				to: n.to,
				subject: n.subject || 'BidOps notification',
				text,
				html: buildNotificationHtml(n)
			})
			await prisma.notification.update({
				where: { id: n.id },
				data: { status: 'sent', sentAt: new Date(), attempts: { increment: 1 } }
			})
		} catch (err: any) {
			await prisma.notification.update({
				where: { id: n.id },
				data: {
					status: 'failed',
					attempts: { increment: 1 },
					lastError: err?.message?.toString()?.slice(0, 500) || 'unknown'
				}
			})
		}
	}
}
