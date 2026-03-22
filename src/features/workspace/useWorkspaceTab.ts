import { useSearchParams } from "react-router-dom";

export default function useWorkspaceTab(defaultTab: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? defaultTab;

  const setActiveTab = (nextTab: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("tab", nextTab);
    setSearchParams(nextSearchParams, { replace: true });
  };

  return { activeTab, setActiveTab };
}
