"use client";

import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const DEFAULT_STAGES = [
  { id: "backlog", name: "Backlog", order: 0 },
  { id: "planning", name: "Planning", order: 1 },
  { id: "repo-created", name: "Repo created", order: 2 },
  { id: "in-dev", name: "In development", order: 3 },
  { id: "in-review", name: "In review", order: 4 },
  { id: "staging", name: "Staging deployed", order: 5 },
  { id: "production", name: "Production deployed", order: 6 },
  { id: "live", name: "Live", order: 7 },
];

interface Project {
  id: string;
  name: string;
  stageId: string;
  brand?: string;
}

export default function BoardPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    const projectId = result.draggableId;
    const newStageId = result.destination.droppableId;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, stageId: newStageId } : p
      )
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Board</h1>
        <a
          href="/projects/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Project
        </a>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No projects yet. Create your first project to get started.
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {DEFAULT_STAGES.map((stage) => (
              <div key={stage.id} className="min-w-[280px] flex-shrink-0">
                <div className="rounded-t-lg bg-card border border-border border-b-0 px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {projects.filter((p) => p.stageId === stage.id).length} projects
                  </p>
                </div>
                <Droppable droppableId={stage.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="rounded-b-lg border border-border border-t-0 bg-card/50 p-2 min-h-[200px] space-y-2"
                    >
                      {projects
                        .filter((p) => p.stageId === stage.id)
                        .map((project, index) => (
                          <Draggable
                            key={project.id}
                            draggableId={project.id}
                            index={index}
                          >
                            {(provided) => (
                              <a
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                href={`/projects/${project.id}`}
                                className="block rounded-md border border-border bg-background p-3 hover:border-primary/50 transition-colors"
                              >
                                <p className="text-sm font-medium text-foreground">
                                  {project.name}
                                </p>
                                {project.brand && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {project.brand}
                                  </p>
                                )}
                              </a>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
