"use client";

import { BookOpen, TrendingUp, Award, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";

const statCards = [
  { label: "Cursos inscritos", value: "—", icon: BookOpen, color: "text-blue-500" },
  { label: "Progreso promedio", value: "—", icon: TrendingUp, color: "text-green-500" },
  { label: "Lecciones completadas", value: "—", icon: Award, color: "text-yellow-500" },
  { label: "Horas de estudio", value: "—", icon: Clock, color: "text-purple-500" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenido, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí tienes un resumen de tu actividad de aprendizaje.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">{label}</CardDescription>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Continuar aprendiendo</CardTitle>
          <CardDescription>Retoma donde lo dejaste</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Inscríbete en cursos para ver tu progreso aquí.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
