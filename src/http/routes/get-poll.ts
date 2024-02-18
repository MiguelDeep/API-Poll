import { FastifyInstance } from "fastify"
import { date, z } from "zod"
import { prisma } from "../../lib/prisma"
import { redis } from "../../lib/redis"



export async function getPoll(app: FastifyInstance) {
  app.get('/polls/:pollId', async (request, replay) => {

    const getPollParams = z.object({
      pollId: z.string().uuid()
    })

    const { pollId } = getPollParams.parse(request.params)

    const polls = await prisma.poll.findUnique({
      where: {
        id: pollId
      },
      include: {
        options: {
          select: {
            id: true,
            title: true,
            pollId: true
          }
        }
      }
    })

    if (!pollId) {
      return replay.code(400).send({ message: " polls not found" })
    }



    // ( await redis.zrange(pollId,0,-1,'WITHSCORES'))
    //console.log('poll'+(await redis.zrange(pollId,0,-1,'WITHSCORES')))

    return { polls }
  })


}