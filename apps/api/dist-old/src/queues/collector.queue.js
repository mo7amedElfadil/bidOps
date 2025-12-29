"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectorsQueue = void 0;
exports.enqueueAwardCollector = enqueueAwardCollector;
exports.enqueueTenderCollector = enqueueTenderCollector;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const connection = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null
});
const QUEUE_NAME = 'bidops-default';
exports.collectorsQueue = new bullmq_1.Queue(QUEUE_NAME, { connection });
function enqueueAwardCollector(payload) {
    return exports.collectorsQueue.add('collect-awards', payload, {
        removeOnComplete: true,
        removeOnFail: true
    });
}
function enqueueTenderCollector(payload) {
    return exports.collectorsQueue.add('collect-tenders', payload, {
        removeOnComplete: true,
        removeOnFail: true
    });
}
//# sourceMappingURL=collector.queue.js.map