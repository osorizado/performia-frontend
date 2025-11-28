import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ColaboradorLayoutComponent } from './components/colaborador-layout.component';
import { ColaboradorDashboardComponent } from './components/dashboard/dashboard.component';
import { AutoevaluacionComponent } from './components/autoevaluacion/autoevaluacion.component';
import { ObjetivosComponent } from './components/objetivos/objetivos.component';

const routes: Routes = [
  {
    path: '',
    component: ColaboradorLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: ColaboradorDashboardComponent
      },
      {
        path: 'autoevaluacion',
        component: AutoevaluacionComponent
      },
      {
        path: 'objetivos',
        component: ObjetivosComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ColaboradorRoutingModule { }