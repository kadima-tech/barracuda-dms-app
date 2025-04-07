import { useState } from "react";
import styled from "styled-components";
import { Plus } from "react-feather"; // Make sure to install react-feather if not already
import AddClientModal from "./AddClientModal";

const OverviewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  width: 100%;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const Title = styled.h3`
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const StatItem = styled.div`
  flex: 1;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;

  .label {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #0cbab1;
  }
`;

const AddClientCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #e2e8f0;
  background: #f8fafc;
  min-height: 160px;

  &:hover {
    border-color: #0cbab1;
    background: white;
  }
`;

const AddIcon = styled(Plus)`
  color: #0cbab1;
  margin-bottom: 0.5rem;
`;

const AddText = styled.span`
  color: #64748b;
  font-size: 0.9rem;
`;

interface Client {
  id: number;
  name: string;
  devices: number;
  connected: number;
}

interface ClientOverviewProps {
  searchQuery: string;
}

const ClientOverview: React.FC<ClientOverviewProps> = ({ searchQuery }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = (newClient: Omit<Client, "id">) => {
    setClients((prev) => [
      ...prev,
      {
        ...newClient,
        id: prev.length + 1,
      },
    ]);
    setIsModalOpen(false);
  };

  return (
    <>
      <OverviewContainer>
        <AddClientCard onClick={() => setIsModalOpen(true)}>
          <AddIcon size={24} />
          <AddText>Add New Client</AddText>
        </AddClientCard>
        {filteredClients.map((client) => (
          <Card key={client.id}>
            <Title>{client.name}</Title>
            <StatsContainer>
              <StatItem>
                <div className="label">Total Devices</div>
                <div className="value">{client.devices}</div>
              </StatItem>
              <StatItem>
                <div className="label">Connected</div>
                <div className="value">{client.connected}</div>
              </StatItem>
            </StatsContainer>
          </Card>
        ))}
      </OverviewContainer>
      {isModalOpen && (
        <AddClientModal
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddClient}
        />
      )}
    </>
  );
};

export default ClientOverview;
