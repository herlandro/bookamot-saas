import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetPasswordRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Verificar rate limiting
    const rateLimitResult = resetPasswordRateLimit(req)
    if (!rateLimitResult.success) {
      const resetTime = new Date(rateLimitResult.resetTime!)
      return NextResponse.json(
        { 
          error: 'Muitas tentativas. Tente novamente em 15 minutos.',
          resetTime: resetTime.toISOString()
        },
        { status: 429 }
      )
    }

    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar força da senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número' },
        { status: 400 }
      )
    }

    // Buscar usuário com o token válido
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { resetToken: token } as any,
          { resetTokenExpiry: { gt: new Date() } } as any,
        ],
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Atualizar senha e limpar token de reset
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      } as any,
    })

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}