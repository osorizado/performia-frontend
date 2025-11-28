import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { DirectorLayoutComponent } from './components/director-layout.component';
import { DashboardEjecutivoComponent } from './components/dashboard-ejecutivo/dashboard-ejecutivo.component';
import { ReportesConsolidadosComponent } from './components/reportes-consolidados/reportes-consolidados.component';
import { VistaAreasComponent } from './components/vista-areas/vista-areas.component';

const routes: Routes = [
  {
    path: '',
    component: DirectorLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardEjecutivoComponent
      },
      {
        path: 'reportes',
        component: ReportesConsolidadosComponent
      },
      {
        path: 'areas',
        component: VistaAreasComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DirectorRoutingModule { }