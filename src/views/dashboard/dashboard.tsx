import React, { ChangeEvent, useEffect } from "react";

interface DashboardProps {
  // next: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({}) => {
  const [selectedNetwork, setSelectedNetwork] = React.useState<string>("");

  const handleNetworkChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedNetwork(event.target.value);
  };

  useEffect(() => {}, []);

  return (
    <>
      <select value={selectedNetwork} onChange={handleNetworkChange}>
        <option value="osmosis">Osmosis</option>
        <option value="dogecoin">Dogecoin</option>
        <option value="evm">Polygon</option>
      </select>
    </>
  );
};
