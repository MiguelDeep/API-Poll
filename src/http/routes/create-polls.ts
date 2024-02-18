import { FastifyInstance } from "fastify"
import { date, z } from "zod"
import { prisma } from "../../lib/prisma"



export async function createPoll(app: FastifyInstance) {
  app.post('/polls', async (request) => {

    const createPollBody = z.object({
      title: z.string(),
      options: z.array(z.string())
    })

    const { title, options } = createPollBody.parse(request.body)

    const polls = await prisma.poll.create({
      data: {
        title,
        options: {
          createMany: {
            data: options.map(option => {
              return { title: option }
            })
          }
        }

      }
    })

    return { "pollId  ": polls.id }
  })


}