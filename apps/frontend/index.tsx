import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import App from './App';
import { PublicViewer } from './pages/PublicViewer';

// Wrapper component to extract projectId from URL params
const PublicViewerWrapper: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  return <PublicViewer projectId={projectId || ''} />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/watch/:projectId" element={<PublicViewerWrapper />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
