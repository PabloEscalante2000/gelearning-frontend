"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LessonItem from "./LessonItem";
import type { Module } from "@/types";

interface ModuleAccordionProps {
  modules: Module[];
  courseId: string;
  activeLessonId?: string;
}

export default function ModuleAccordion({
  modules,
  courseId,
  activeLessonId,
}: ModuleAccordionProps) {
  const defaultOpen = modules
    .filter((m) => m.lessons.some((l) => l.id === Number(activeLessonId)))
    .map((m) => String(m.id));

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
      {modules.map((module) => {
        const completedCount = module.lessons.filter((l) => l.completed).length;
        return (
          <AccordionItem key={module.id} value={String(module.id)}>
            <AccordionTrigger className="hover:no-underline px-1">
              <div className="flex flex-col items-start text-left gap-0.5">
                <span className="font-medium text-sm">{module.title}</span>
                <span className="text-xs text-muted-foreground">
                  {completedCount}/{module.lessons.length} lecciones
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2 pt-0">
              <div className="space-y-0.5">
                {module.lessons.map((lesson) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    courseId={courseId}
                    moduleId={String(module.id)}
                    active={String(lesson.id) === activeLessonId}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
