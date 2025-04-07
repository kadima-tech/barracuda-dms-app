import React, { useState } from "react";
import { deviceApi } from "../../utils/api/devices";
import styled from "styled-components";

interface SendUrlFormProps {
  deviceId: string;
  onSuccess?: () => void;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 600px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #2c3e50;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Checkbox = styled.input`
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  padding: 0.75rem;
  background-color: #fdeaea;
  border-radius: 6px;
  font-size: 0.9rem;
`;

export const SendUrlForm: React.FC<SendUrlFormProps> = ({
  deviceId,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [active, setActive] = useState(true);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await deviceApi.sendUrl(deviceId, url, active);
      setName("");
      setUrl("");
      setMessage("");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to send URL:", error);
      setMessage("Failed to send URL to device");
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormGroup>
        <Label>Name</Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Screen #1"
        />
      </FormGroup>

      <FormGroup>
        <Label>Content URL</Label>
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.example.com"
          required
        />
      </FormGroup>

      <FormGroup>
        <CheckboxGroup>
          <Checkbox
            type="checkbox"
            id="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <Label htmlFor="active">Active</Label>
        </CheckboxGroup>
      </FormGroup>

      {message && <ErrorMessage>{message}</ErrorMessage>}

      <Button type="submit">Submit</Button>
    </Form>
  );
};
