import { getDeviceSocket } from "../device/service";
import { logger } from "@kadima-tech/micro-service-base";
import { CacheContentBody } from "./schema";

const cacheProgress = new Map<
  string,
  {
    progress: number;
    status: string;
    deviceId: string;
  }
>();

export const updateCacheProgress = (
  deviceId: string,
  data: {
    scheduleId: string;
    progress: number;
    status: "downloading" | "complete" | "error";
  }
) => {
  const progressKey = `${deviceId}-${data.scheduleId}`;
  cacheProgress.set(progressKey, {
    progress: data.progress,
    status: data.status,
    deviceId,
  });

  if (data.status === "error") {
    logger.error(
      `Caching failed for schedule ${data.scheduleId} on device ${deviceId}`
    );
  } else if (data.status === "complete") {
    logger.info(
      `Caching completed for schedule ${data.scheduleId} on device ${deviceId}`
    );
  }
};

export const getCacheProgress = (deviceId: string, scheduleId: string) => {
  return cacheProgress.get(`${deviceId}-${scheduleId}`);
};

export const cacheContentForSchedule = async (
  scheduleId: string,
  body: CacheContentBody
) => {
  const deviceSocket = getDeviceSocket(body.deviceId);

  if (!deviceSocket) {
    throw new Error(`Device ${body.deviceId} not found`);
  }

  if (!deviceSocket.connected) {
    throw new Error(`Device ${body.deviceId} is disconnected`);
  }

  // Send cache request to device
  deviceSocket.emit("cacheContent", {
    scheduleId,
    videoUrl: body.videoUrl,
    scheduleTime: body.scheduleTime,
    cacheDuration: body.cacheDuration,
  });

  logger.info(
    `Cache request sent for schedule ${scheduleId} to device ${body.deviceId}`
  );

  return {
    message: `Cache request initiated for schedule ${scheduleId}`,
    deviceId: body.deviceId,
    scheduleTime: body.scheduleTime,
  };
};
