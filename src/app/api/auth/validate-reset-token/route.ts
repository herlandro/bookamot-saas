import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar usuário com o token
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

    return NextResponse.json(
      { message: 'Token válido' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao validar token:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}