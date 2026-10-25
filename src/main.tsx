import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "../base.css";
import { GlobalContextProviders } from "../components/_globalContextProviders";

type PageModule = { default: React.ComponentType };
type LayoutModule = { default: React.ComponentType<{ children: React.ReactNode }>[] };

// Same conventions as the original file-based router:
//   pages/_index.tsx                          -> /
//   pages/presentations.$presentationId.edit  -> /presentations/:presentationId/edit
//   pages/<name>.pageLayout.tsx               -> wrappers (outermost first)
const pageModules = import.meta.glob<PageModule>(["../pages/*.tsx", "!../pages/*.pageLayout.tsx"]);
const layoutModules = import.meta.glob<LayoutModule>("../pages/*.pageLayout.tsx", { eager: true });

function toPath(name: string): string {
  if (name === "_index") return "/";
  return "/" + name.split(".").map((seg) => (seg.startsWith("$") ? ":" + seg.slice(1) : seg)).join("/");
}

const routes = Object.entries(pageModules).map(([file, loader]) => {
  const name = file.replace("../pages/", "").replace(/\.tsx$/, "");
  const layouts = layoutModules[`../pages/${name}.pageLayout.tsx`]?.default ?? [];
  const Page = React.lazy(loader);
  const element = layouts.reduceRight<React.ReactNode>((child, Wrapper) => <Wrapper>{child}</Wrapper>, <Page />);
  return <Route key={name} path={toPath(name)} element={element} />;
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GlobalContextProviders>
        <Suspense fallback={null}>
          <Routes>
            {routes}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </GlobalContextProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
