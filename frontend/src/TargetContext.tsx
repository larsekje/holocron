import React, { createContext, useState } from "react";
import {Target} from "./components/ContentCardTargets";


type TargetContextType = [Target | null, React.Dispatch<React.SetStateAction<Target | null>>];

export const TargetContext = createContext<TargetContextType>([null, () => null]);

interface TargetContextProviderProps {
  children: React.ReactNode;
}

export const TargetContextProvider: React.FC<TargetContextProviderProps> = ({ children }) => {
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);

  return (
    <TargetContext.Provider value={[selectedTarget, setSelectedTarget]}>
      {children}
    </TargetContext.Provider>
  );
};