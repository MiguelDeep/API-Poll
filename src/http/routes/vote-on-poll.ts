import { FastifyInstance } from "fastify"
import { date, z } from "zod"
import { prisma } from "../../lib/prisma"
import { randomUUID } from "crypto"
import { redis } from "../../lib/redis"



export async function voteOnPoll(app: FastifyInstance) {
  app.post('/polls/:pollId/votes', async (request, replay) => {

    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid()
    })
    const voteOnPollParams = z.object({
      pollId: z.string().uuid()
    })

    const { pollId } = voteOnPollParams.parse(request.params)
    const { pollOptionId } = voteOnPollBody.parse(request.body)
    let { sessionId } = request.cookies

    if (sessionId) {
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId
          }
        }
      })
      if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.sessionId !== pollOptionId) {

        await prisma.vote.delete({
          where: {
            id: userPreviousVoteOnPoll.id
          }
        })
        await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId);

      } else if (userPreviousVoteOnPoll) {

        return replay.code(400).send({ message: "You already voted on this poll" })
      }
    }

    if (!sessionId) {
      sessionId = randomUUID();
      replay.setCookie('sessionId', sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        signed: true,
        httpOnly: true
      });
    }
    /* Os dados mandados no PollId e o PollOptions sao unicas isso significa que os dados enviados 
      sao unicos */

    const vote = await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId
      }

    })

    //await redis.zincrby(pollId, 1, pollOptionId);
    //const result = await redis.zrange(pollId,0,-1,'WITHSCORES')
    //console.log(result)
    return replay.code(201).send({ vote })


  })
}

