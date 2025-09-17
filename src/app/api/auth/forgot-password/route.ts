import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { forgotPasswordRateLimit } from '@/lib/rate-limit'

// Configuração do transporter de e-mail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: NextRequest) {
  try {
    // Verificar rate limiting
    const rateLimitResult = forgotPasswordRateLimit(req)
    if (!rateLimitResult.success) {
      const resetTime = new Date(rateLimitResult.resetTime!)
      return NextResponse.json(
        { 
          error: 'Muitas tentativas. Tente novamente em 1 hora.',
          resetTime: resetTime.toISOString()
        },
        { status: 429 }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Por segurança, sempre retornamos sucesso mesmo se o usuário não existir
    // Isso evita que atacantes descubram quais e-mails estão cadastrados
    if (!user) {
      return NextResponse.json(
        { message: 'Se o e-mail estiver cadastrado, você receberá um link de redefinição' },
        { status: 200 }
      )
    }

    // Gerar token de redefinição
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      } as any,
    })

    // URL de redefinição
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    // Template do e-mail
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redefinir Senha - BookaMOT</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛡️ BookaMOT</div>
            </div>
            <div class="content">
              <h2>Redefinir sua senha</h2>
              <p>Olá,</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta BookaMOT.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </p>
              <p><strong>Este link expira em 1 hora.</strong></p>
              <p>Se você não solicitou esta redefinição, pode ignorar este e-mail com segurança.</p>
              <p>Por segurança, nunca compartilhe este link com outras pessoas.</p>
            </div>
            <div class="footer">
              <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all;">${resetUrl}</p>
              <p>© 2024 BookaMOT. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Enviar e-mail
    await transporter.sendMail({
      from: `"BookaMOT" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Redefinir sua senha - BookaMOT',
      html: emailHtml,
    })

    return NextResponse.json(
      { message: 'E-mail de redefinição enviado com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao processar solicitação de redefinição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}