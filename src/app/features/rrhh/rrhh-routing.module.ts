import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { RrhhLayoutComponent } from './components/rrhh-layout.component';
import { PanelControlComponent } from './components/panel-control/panel-control.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { FormulariosComponent } from './components/formularios/formularios.component'; // ⭐ AGREGAR
import { ReportesComponent } from './components/reportes/reportes.component';

const routes: Routes = [
  {
    path: '',
    component: RrhhLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'panel-control',
        pathMatch: 'full'
      },
      {
        path: 'panel-control',
        component: PanelControlComponent
      },
      {
        path: 'usuarios',
        component: UsuariosComponent
      },
      {
        path: 'formularios',           // ⭐ AGREGAR ESTA RUTA
        component: FormulariosComponent
      },
      {
        path: 'reportes',
        component: ReportesComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RrhhRoutingModule { }
