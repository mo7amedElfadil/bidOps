import nodemailer from 'nodemailer'
import { prisma } from '../prisma'

export async function processEmailBatch(limit = 20) {
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST || 'localhost',
		port: Number(process.env.SMTP_PORT || 1025),
		secure: false
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
			await transporter.sendMail({
				from: process.env.SMTP_FROM || 'bidops@example.com',
				to: n.to,
				subject: n.subject,
				text: n.body
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
