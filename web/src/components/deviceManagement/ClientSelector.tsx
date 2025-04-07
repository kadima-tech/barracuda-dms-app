import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  font-size: 0.95rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #0cbab1;
    box-shadow: 0 0 0 2px rgba(12, 186, 177, 0.2);
  }
`;

interface Client {
  id: string;
  name: string;
}

interface ClientSelectorProps {
  selectedClientId?: string | null;
  onSelect: (clientId: string | null) => void;
  onClick?: (e: React.MouseEvent) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClientId,
  onSelect,
  onClick
}) => {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        //TODO: Replace this with actual API call
        const response = await fetch('/api/clients');
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      }
    };

    fetchClients();
  }, []);

  return (
    <Select
      value={selectedClientId || ''}
      onChange={(e) => onSelect(e.target.value || null)}
      onClick={onClick}
    >
      <option value="">Not Assigned</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.name}
        </option>
      ))}
    </Select>
  );
};
