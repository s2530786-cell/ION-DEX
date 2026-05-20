import { createContext, useContext, type PropsWithChildren } from "react";
import { MOCK_DATA, type IonMockDataSnapshot } from "@/lib/MOCK_DATA";

const MockDataContext = createContext<IonMockDataSnapshot>(MOCK_DATA);

export function MockDataProvider({
  children,
  value = MOCK_DATA,
}: PropsWithChildren<{ value?: IonMockDataSnapshot }>) {
  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

/** 纯 Mock 预览：页面只通过此 Hook 读取 MOCK_DATA，禁止在组件内 fetch /api。 */
export function useMockData(): IonMockDataSnapshot {
  return useContext(MockDataContext);
}
