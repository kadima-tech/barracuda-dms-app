import { Header } from '../components/common/Header';
import DeviceOverview from '../components/deviceManagement/DeviceOverview';
import DeviceSearchAndStatus from '../components/deviceManagement/DeviceSearchAndStatus';

import { Wrapper } from '../components/layout/Wrapper';
import { useState } from 'react';

const DeviceManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <Wrapper
      header={<Header />}
      contentBoxPrimary={[
        <DeviceSearchAndStatus
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />,
        <DeviceOverview searchQuery={searchQuery} />,
      ]}
    ></Wrapper>
  );
};

export default DeviceManagement;
