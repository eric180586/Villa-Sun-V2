import React from 'react';
import ChecklistTemplateManager from '../components/ChecklistTemplateManager';

const Templates: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vorlagen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Checklisten-Vorlagen für wiederkehrende Aufgaben
        </p>
      </div>
      
      <ChecklistTemplateManager />
    </div>
  );
};

export default Templates;