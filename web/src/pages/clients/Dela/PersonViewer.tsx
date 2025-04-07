import styled from "styled-components";
import { useState, useEffect } from "react";
import dela from "../../../assets/dela.png";

// Types
interface Person {
  id: string;
  name: string;
  roomNumber: string;
  imageUrl: string;
}

// Styled components
const PersonCard = styled.div`
  display: flex;
  gap: 64px;
  padding: 48px;
  background: #ffffff;
  border-radius: 24px;

  width: 100vw;
  height: 100vh;
  box-shadow: 0 8px 24px rgba(94, 42, 132, 0.08);
  box-sizing: border-box;
  overflow: hidden;
`;

const PersonImage = styled.img`
  width: 520px;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(94, 42, 132, 0.12);

  @media (max-width: 1024px) {
    width: 400px;
  }
`;

const PersonInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 32px 0;
  height: 100%;
  box-sizing: border-box;
`;

const InfoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RoomNumber = styled.div`
  color: #5e2a84;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const PersonName = styled.h2`
  color: #0093b0;
  font-size: 42px;
  margin: 0;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const StatusIndicator = styled.div<{ isPresent?: boolean }>`
  background-color: ${(props) => (props.isPresent ? "#F37021" : "#2E7D32")};
  color: white;
  width: 100%;
  height: 80px;
  border-radius: 16px;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px
    ${(props) =>
      props.isPresent ? "rgba(243, 112, 33, 0.15)" : "rgba(46, 125, 50, 0.15)"};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px
      ${(props) =>
        props.isPresent
          ? "rgba(243, 112, 33, 0.25)"
          : "rgba(46, 125, 50, 0.25)"};
  }

  @media (max-width: 1024px) {
    height: 72px;
  }
`;

interface PersonViewerProps {
  deviceId: string;
}

const PersonViewer: React.FC<PersonViewerProps> = ({ deviceId }) => {
  const [isPresent, setIsPresent] = useState(false);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonData = async () => {
      try {
        // Replace this with your actual API endpoint
        const response = await fetch(`/api/devices/${deviceId}/person`);
        if (!response.ok) {
          throw new Error("Failed to fetch person data");
        }
        const data = await response.json();
        setPerson(data);
      } catch (error) {
        console.error("Error fetching person data:", error);
        // Fallback data for development/testing
        setPerson({
          id: "1",
          name: "Marie-Antoinette van Leeuwenhoven",
          roomNumber: "Kamer 02",
          imageUrl: dela,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPersonData();
  }, [deviceId]);

  const togglePresence = () => {
    setIsPresent(!isPresent);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!person) {
    return <div>No person assigned to this device</div>;
  }

  return (
    <>
      <PersonCard>
        <PersonImage src={person.imageUrl} alt={`Resident ${person.name}`} />
        <PersonInfo>
          <InfoContent>
            <RoomNumber>{person.roomNumber}</RoomNumber>
            <PersonName>{person.name}</PersonName>
          </InfoContent>
          <StatusIndicator isPresent={isPresent} onClick={togglePresence}>
            {isPresent ? "Familie aanwezig" : "Niemand aanwezig"}
          </StatusIndicator>
        </PersonInfo>
      </PersonCard>
    </>
  );
};

export default PersonViewer;
