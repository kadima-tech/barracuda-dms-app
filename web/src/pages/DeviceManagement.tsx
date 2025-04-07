import { Header } from "../components/common/Header";
import DeviceOverview from "../components/deviceManagement/DeviceOverview";
import DeviceSearchAndStatus from "../components/deviceManagement/DeviceSearchAndStatus";

import { Wrapper } from "../components/layout/Wrapper";

const DeviceManagement = () => {
  return (
    <Wrapper
      header={<Header />}
      contentBoxPrimary={[<DeviceSearchAndStatus />, <DeviceOverview />]}
    ></Wrapper>
  );
};

export default DeviceManagement;
