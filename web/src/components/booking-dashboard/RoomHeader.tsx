import React from 'react';
import { Room, RoomInfo } from './types';
import { useTheme } from './ThemeContext';
import {
  Header,
  RoomInfo as RoomInfoContainer,
  RoomSelector,
  RoomName,
  TimeInfo,
} from './StyledComponents';

interface RoomHeaderProps {
  rooms: Room[];
  roomId: string | null;
  displayRoomInfo: RoomInfo;
  onRoomChange: (roomId: string) => void;
  onTimeInfoClick: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({
  rooms,
  roomId,
  displayRoomInfo,
  onRoomChange,
  onTimeInfoClick,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleTimeClick = () => {
    // Toggle theme first, then refresh data
    toggleTheme();
    onTimeInfoClick();
  };

  return (
    <Header $isDark={isDark}>
      <RoomInfoContainer>
        <RoomSelector
          $isDark={isDark}
          value={roomId || ''}
          onChange={(e) => onRoomChange(e.target.value)}
        >
          <option value="">Select a room</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </RoomSelector>
        <RoomName $isDark={isDark}>{displayRoomInfo.roomName}</RoomName>
      </RoomInfoContainer>

      <TimeInfo $isDark={isDark} onClick={handleTimeClick}>
        {displayRoomInfo.currentTime} | {displayRoomInfo.currentDate}
      </TimeInfo>
    </Header>
  );
};

export default RoomHeader;
