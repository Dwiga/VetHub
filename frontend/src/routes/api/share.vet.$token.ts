import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'

export const Route = createFileRoute('/api/share/vet/$token')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token as string
        const visit = await prisma.visit.findUnique({
          where: { shareToken: token },
          include: {
            pet: { include: { species: true, owner: true } },
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

        const totalCredits = visit.dailyReports
          .filter(r => r.type === 'credit')
          .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) + roomFeeTotal
        const totalDeposits = visit.dailyReports
          .filter(r => r.type === 'deposit')
          .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
        const balance = totalDeposits - totalCredits

        return Response.json({
          id: visit.id,
          petName: visit.pet?.name ?? null,
          petSpecies: visit.pet?.species?.name ?? null,
          ownerName: visit.pet?.owner?.name ?? null,
          visitDate: visit.visitDate,
          dischargeDate: visit.dischargeDate,
          type: visit.type,
          status: visit.status,
          anamnesis: visit.anamnesis,
          therapy: visit.therapy,
          dailyFee: visit.dailyFee ? parseFloat(visit.dailyFee) : null,
          daysIn,
          roomFeeTotal,
          totalDeposits,
          totalCredits,
          balance,
          dailyReports: visit.dailyReports.map(r => ({
            id: r.id,
            type: r.type,
            description: r.description,
            amount: parseFloat(r.amount) || 0,
            reportDate: r.reportDate,
          })),
        })
      },
    },
  },
})
