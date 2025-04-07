import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { logger } from "@kadima-tech/micro-service-base";
import { parseString } from "xml2js";

const newsRouter = async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
  fastify.get("/", async (request, reply) => {
    try {
      const response = await fetch("https://feeds.nos.nl/nosnieuwsalgemeen");
      const text = await response.text();

      return new Promise((resolve, reject) => {
        parseString(text, (err, result) => {
          if (err) {
            logger.error("Error parsing RSS feed:", err);
            reject(err);
            return;
          }

          const items = result.rss.channel[0].item
            .slice(0, 10)
            .map((item: any) => ({
              title: item.title[0],
              link: item.link[0],
              pubDate: item.pubDate[0],
            }));

          resolve(reply.send(items));
        });
      });
    } catch (error) {
      logger.error("Error fetching news:", error);
      return reply.status(500).send({ error: "Failed to fetch news" });
    }
  });
};

export default newsRouter; 