import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { scheduleApi, Schedule } from "../../utils/api/schedule";

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #0cbab1;
    box-shadow: 0 0 0 2px rgba(12, 186, 177, 0.2);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #0cbab1;
    box-shadow: 0 0 0 2px rgba(12, 186, 177, 0.2);
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #0cbab1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #0a9e96;
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const ScheduleList = styled.div`
  margin-top: 1rem;
`;

const ScheduleItem = styled.div`
  padding: 1rem;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DeleteButton = styled.button`
  padding: 0.5rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #c0392b;
  }
`;

interface ScheduleSectionProps {
  deviceId: string;
  videoUrl: string;
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  deviceId,
  videoUrl,
}) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "monthly">(
    "none"
  );
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchedules();
  }, [deviceId]);

  const loadSchedules = async () => {
    try {
      const response = await scheduleApi.getSchedulesByDevice(deviceId);
      setSchedules(response);
    } catch (error) {
      console.error("Failed to load schedules:", error);
      setError("Failed to load schedules");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await scheduleApi.createSchedule({
        deviceId,
        videoUrl,
        startTime,
        endTime,
        repeat,
        cacheDuration: 30, // Default cache duration in minutes
      });

      // Reset form and reload schedules
      setStartTime("");
      setEndTime("");
      setRepeat("none");
      loadSchedules();
    } catch (error) {
      console.error("Failed to create schedule:", error);
      setError("Failed to create schedule");
    }
  };

  const handleDelete = async (scheduleId: string) => {
    try {
      await scheduleApi.deleteSchedule(scheduleId);
      loadSchedules();
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      setError("Failed to delete schedule");
    }
  };

  return (
    <Section>
      <Title>Schedule Playback</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <label>Start Time</label>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </FormGroup>

        <FormGroup>
          <label>End Time</label>
          <Input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </FormGroup>

        <FormGroup>
          <label>Repeat</label>
          <Select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as any)}
          >
            <option value="none">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </FormGroup>

        <Button type="submit">Schedule</Button>
      </Form>

      <ScheduleList>
        {schedules.map((schedule) => (
          <ScheduleItem key={schedule.id}>
            <div>
              <div>Start: {new Date(schedule.startTime).toLocaleString()}</div>
              <div>End: {new Date(schedule.endTime).toLocaleString()}</div>
              <div>Status: {schedule.status}</div>
            </div>
            <DeleteButton onClick={() => handleDelete(schedule.id)}>
              Delete
            </DeleteButton>
          </ScheduleItem>
        ))}
      </ScheduleList>
    </Section>
  );
};

export default ScheduleSection;
