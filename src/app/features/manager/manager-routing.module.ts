import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManagerLayoutComponent } from './components/manager-layout.component';
import { ManagerDashboardComponent } from './components/dashboard/dashboard.component';
import { MiEquipoComponent } from './components/mi-equipo/mi-equipo.component';
import { EvaluacionesComponent } from './components/evaluaciones/evaluaciones.component';
import { EvaluarColaboradorComponent } from './components/evaluar-colaborador/evaluar-colaborador.component';
import { RealizarEvaluacionComponent } from './components/realizar-evaluacion/realizar-evaluacion.component';
import { EvaluacionDetalleComponent } from './components/evaluacion-detalle/evaluacion-detalle.component';

const routes: Routes = [
  {
    path: '',
    component: ManagerLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ManagerDashboardComponent },
      { path: 'mi-equipo', component: MiEquipoComponent },
      { path: 'evaluaciones', component: EvaluacionesComponent },
      { path: 'evaluar', component: EvaluarColaboradorComponent },
      { path: 'realizar-evaluacion/:id', component: RealizarEvaluacionComponent },
      { path: 'evaluacion-detalle/:id', component: EvaluacionDetalleComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagerRoutingModule { }