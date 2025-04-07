import { api } from "./instance";

export interface Schedule {
  id: string;
  deviceId: string;
  videoUrl: string;
  startTime: string;
  endTime: string;
  repeat?: "daily" | "weekly" | "monthly" | "none";
  status: "pending" | "caching" | "ready" | "playing" | "completed" | "error";
  cacheDuration: number;
  created: string;
  updated: string;
}

export interface CreateScheduleRequest {
  deviceId: string;
  videoUrl: string;
  startTime: string;
  endTime: string;
  repeat?: "daily" | "weekly" | "monthly" | "none";
  cacheDuration: number;
}

export const scheduleApi = {
  getSchedules: () => {
    return api.get("/schedules") as Promise<Schedule[]>;
  },

  getSchedulesByDevice: (deviceId: string) => {
    return api.get(`/schedules?deviceId/${deviceId}`);
  },

  createSchedule: (schedule: CreateScheduleRequest) => {
    return api.post("/schedules", schedule);
  },

  updateSchedule: (
    scheduleId: string,
    updates: Partial<CreateScheduleRequest>
  ) => {
    return api.put(`/schedules/${scheduleId}`, updates);
  },

  getSchedule: (scheduleId: string) => {
    return api.get(`/schedules/${scheduleId}`);
  },

  deleteSchedule: (scheduleId: string) => {
    return api.delete(`/schedules/${scheduleId}`);
  },
};
