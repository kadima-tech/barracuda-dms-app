import { useState } from "react";
import { Header } from "../components/common/Header";
import ClientOverview from "../components/dashboard/ClientOverview";
import ClientSearchAndStatus from "../components/dashboard/ClientSearchAndStatus";
import { Wrapper } from "../components/layout/Wrapper";
//import FeaturesSection from "../components/dashboard/FeaturesSection";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Wrapper
      header={<Header />}
      contentBoxPrimary={[
        <ClientSearchAndStatus
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />,
        <ClientOverview searchQuery={searchQuery} />,
        // <FeaturesSection />,
      ]}
    ></Wrapper>
  );
};

export default Dashboard;
