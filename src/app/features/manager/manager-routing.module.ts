import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManagerLayoutComponent } from './components/manager-layout.component';
import { ManagerDashboardComponent } from './components/dashboard/dashboard.component';
import { MiEquipoComponent } from './components/mi-equipo/mi-equipo.component';
import { EvaluacionesComponent } from './components/evaluaciones/evaluaciones.component';
import { EvaluarColaboradorComponent } from './components/evaluar-colaborador/evaluar-colaborador.component';  // ← AGREGAR

const routes: Routes = [
  {
    path: '',
    component: ManagerLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: ManagerDashboardComponent
      },
      {
        path: 'mi-equipo',
        component: MiEquipoComponent
      },
      {
        path: 'evaluaciones',
        component: EvaluacionesComponent
      },
      {
        path: 'evaluar',  // ← AGREGAR ESTA RUTA
        component: EvaluarColaboradorComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagerRoutingModule { }