import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/visits/$visitId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.visitId)
        const visit = await prisma.visit.findFirst({
          where: { id },
          include: {
            dailyReports: { orderBy: { reportDate: 'desc' } },
          },
        })
        if (!visit) return Response.json({ error: 'not found' }, { status: 404 })

        // Compute financial summary
        const endDate = visit.dischargeDate
          ? new Date(visit.dischargeDate)
          : new Date()
        const daysIn = Math.max(1, Math.ceil((endDate.getTime() - new Date(visit.visitDate).getTime()) / (1000 * 60 * 60 * 24)))
        const dailyFeeNum = visit.dailyFee ? parseFloat(visit.dailyFee) : 0
        const roomFeeTotal = dailyFeeNum * daysIn

        // DailyReport ledger calculations
        const totalCredits = visit.dailyReports
          .filter(r => r.type === 'credit')
          .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) + roomFeeTotal
        const totalDeposits = visit.dailyReports
          .filter(r => r.type === 'deposit')
          .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
        const balance = totalDeposits - totalCredits

        return Response.json({
          ...visit,
          dailyFee: dailyFeeNum || null,
          roomFeeTotal,
          totalDeposits,
          totalCredits,
          balance,
        })
      },
      PATCH: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.visitId)
        const body = await request.json()

        // If discharging, auto-create a room fee credit entry
        if (body.status === 'completed' || body.dischargeDate) {
          const current = await prisma.visit.findUnique({
            where: { id },
            include: { dailyReports: true },
          })
          if (current) {
            const endDate = body.dischargeDate
              ? new Date(body.dischargeDate)
              : new Date()
            const daysIn = Math.max(1, Math.ceil((endDate.getTime() - new Date(current.visitDate).getTime()) / (1000 * 60 * 60 * 24)))
            const dailyFeeNum = current.dailyFee ? parseFloat(current.dailyFee) : 0
            if (dailyFeeNum > 0) {
              const totalRoomFee = dailyFeeNum * daysIn
              await prisma.dailyReport.create({
                data: {
                  visitId: id,
                  type: 'credit',
                  description: `Room fee (${daysIn} days × Rp ${dailyFeeNum.toLocaleString('id-ID')})`,
                  amount: String(totalRoomFee),
                  reportDate: body.dischargeDate || current.visitDate,
                },
              })
            }
          }
        }

        const updated = await prisma.visit.update({
          where: { id },
          data: body,
        })
        return Response.json(updated)
      },
    },
  },
})
