import nodemailer from 'nodemailer'
import { Notification } from '@prisma/client'
import { prisma } from '../prisma'
import { renderEmailTemplate } from '../emailTemplate'
import {
	getAppBaseUrl,
	getAppLogoUrl,
	getSupportEmail
} from '../branding'

const SOCIAL_KEYS = ['social.linkedin', 'social.x', 'social.instagram', 'social.youtube']

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

function stripHtml(html: string) {
	return html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<[^>]+>/g, '')
		.replace(/\\s+/g, ' ')
		.trim()
}

async function loadSocialLinks() {
	const rows = await prisma.appSetting.findMany({
		where: { key: { in: SOCIAL_KEYS } }
	})
	const map = Object.fromEntries(
		rows.map((row: { key: string; value: string | null }) => [
			row.key,
			row.value
		])
	)
	return {
		linkedin: map['social.linkedin'] ?? '',
		x: map['social.x'] ?? '',
		instagram: map['social.instagram'] ?? '',
		youtube: map['social.youtube'] ?? ''
	}
}

async function buildEmailContent(
	note: Notification,
	appUrl: string,
	supportEmail: string,
	socialLinks: { linkedin: string; x: string; instagram: string; youtube: string }
) {
	const payload = note.payload as Record<string, any> | undefined
	const templateName = payload?.templateName
	if (templateName) {
		const templateData: Record<string, string> = {
			APP_URL: appUrl,
			APP_BASE_URL: appUrl,
			SUPPORT_EMAIL: supportEmail,
			SOCIAL_LINK_LINKEDIN: socialLinks.linkedin,
			SOCIAL_LINK_X: socialLinks.x,
			SOCIAL_LINK_INSTAGRAM: socialLinks.instagram,
			SOCIAL_LINK_YOUTUBE: socialLinks.youtube,
			APP_LOGO_URL: getAppLogoUrl(),
			...(payload?.templateData || {})
		}
		if (payload?.actionUrl) {
			templateData.CTA_URL = payload.actionUrl
			templateData.CTA_TEXT = payload.actionLabel || ''
		}
		const html = await renderEmailTemplate(templateName, templateData)
		return { html, text: stripHtml(html) }
	}
	return { html: buildNotificationHtml(note), text: buildNotificationText(note) }
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

	const socialLinks = await loadSocialLinks()
	const appUrl = getAppBaseUrl()
	const supportEmail = getSupportEmail()

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
			const payload = n.payload as Record<string, any> | undefined
			const subject =
				n.subject ||
				payload?.templateData?.SUBJECT ||
				payload?.templateData?.subject ||
				'BidOps notification'
			const content = await buildEmailContent(n, appUrl, supportEmail, socialLinks)
			await transporter.sendMail({
				from: process.env.SMTP_FROM || 'bidops@example.com',
				to: n.to,
				subject,
				text: content.text,
				html: content.html
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
