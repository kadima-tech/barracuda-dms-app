"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const micro_service_base_1 = require("@kadima-tech/micro-service-base");
const xml2js_1 = require("xml2js");
const newsRouter = (fastify, opts) => __awaiter(void 0, void 0, void 0, function* () {
    fastify.get("/", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield fetch("https://feeds.nos.nl/nosnieuwsalgemeen");
            const text = yield response.text();
            return new Promise((resolve, reject) => {
                (0, xml2js_1.parseString)(text, (err, result) => {
                    if (err) {
                        micro_service_base_1.logger.error("Error parsing RSS feed:", err);
                        reject(err);
                        return;
                    }
                    const items = result.rss.channel[0].item
                        .slice(0, 10)
                        .map((item) => ({
                        title: item.title[0],
                        link: item.link[0],
                        pubDate: item.pubDate[0],
                    }));
                    resolve(reply.send(items));
                });
            });
        }
        catch (error) {
            micro_service_base_1.logger.error("Error fetching news:", error);
            return reply.status(500).send({ error: "Failed to fetch news" });
        }
    }));
});
exports.default = newsRouter;
