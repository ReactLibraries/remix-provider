import React from "react";
import { createContext, ReactNode, useContext, useMemo } from "react";

const isServer = typeof window === "undefined";

export const ServerContext = createContext<{ [key: string]: unknown }>({});
export const ServerProvider = ServerContext.Provider;
const DATA_NAME = "__SERVER_VALUE__";
export const useServerContext = () => {
  const serverValue = useContext(ServerContext);
  const clientValue = useMemo(() => {
    if (!isServer) {
      return JSON.parse(
        document.querySelector(`script#${DATA_NAME}`)?.textContent ?? "{}"
      );
    }
  }, []);

  return isServer ? serverValue : clientValue;
};

export const RootValue = () => {
  const value = useServerContext();
  return (
    <script
      id={DATA_NAME}
      type="application/json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replace(/</g, "\\u003c"),
      }}
    />
  );
};

const RootContext = createContext<unknown>(undefined as never);

export const RootProvider = ({ children }: { children: ReactNode }) => {
  const value = useServerContext();
  return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
};

export const useRootContext = <T,>() => {
  return useContext(RootContext) as T;
};
