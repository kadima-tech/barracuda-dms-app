import { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from './types';
import { logger } from '@kadima-tech/micro-service-base';
import { cacheContentForSchedule } from '../caching/service';

// In-memory storage for schedules (replace with database in production)
const schedules = new Map<string, Schedule>();

export const createSchedule = async (request: CreateScheduleRequest): Promise<Schedule> => {
  const id = `schedule-${Date.now()}`;
  const now = new Date().toISOString();
  
  const schedule: Schedule = {
    id,
    ...request,
    status: 'pending',
    created: now,
    updated: now
  };

  schedules.set(id, schedule);
  
  // Initiate caching if start time is within cache duration
  const startTime = new Date(schedule.startTime);
  const cacheTime = new Date(startTime.getTime() - (schedule.cacheDuration * 60 * 1000));
  
  if (cacheTime <= new Date()) {
    schedule.status = 'caching';
    await cacheContentForSchedule(id, {
      videoUrl: schedule.videoUrl,
      scheduleTime: schedule.startTime,
      cacheDuration: schedule.cacheDuration,
      deviceId: schedule.deviceId
    });
  }

  return schedule;
};

export const updateSchedule = async (
  scheduleId: string,
  updates: UpdateScheduleRequest
): Promise<Schedule> => {
  const schedule = schedules.get(scheduleId);
  if (!schedule) {
    throw new Error('Schedule not found');
  }

  const updatedSchedule: Schedule = {
    ...schedule,
    ...updates,
    updated: new Date().toISOString()
  };

  schedules.set(scheduleId, updatedSchedule);
  return updatedSchedule;
};

export const getSchedule = (scheduleId: string): Schedule => {
  const schedule = schedules.get(scheduleId);
  if (!schedule) {
    throw new Error('Schedule not found');
  }
  return schedule;
};

export const getSchedules = (filters?: { deviceId?: string; status?: string }): Schedule[] => {
  let result = Array.from(schedules.values());
  
  if (filters?.deviceId) {
    result = result.filter(s => s.deviceId === filters.deviceId);
  }
  
  if (filters?.status) {
    result = result.filter(s => s.status === filters.status);
  }
  
  return result;
};

export const deleteSchedule = (scheduleId: string): void => {
  if (!schedules.delete(scheduleId)) {
    throw new Error('Schedule not found');
  }
};


