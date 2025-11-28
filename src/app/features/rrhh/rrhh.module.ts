import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { RrhhRoutingModule } from './rrhh-routing.module';

// Components
import { RrhhLayoutComponent } from './components/rrhh-layout.component';
import { PanelControlComponent } from './components/panel-control/panel-control.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { FormulariosComponent } from './components/formularios/formularios.component'; // ⭐ AGREGAR
import { ReportesComponent } from './components/reportes/reportes.component'; // ⭐ AGREGAR

@NgModule({
  declarations: [
    RrhhLayoutComponent,
    PanelControlComponent,
    UsuariosComponent,
    FormulariosComponent,  // ⭐ AGREGAR AQUÍ
    ReportesComponent  // ⭐ AGREGAR AQUÍ
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RrhhRoutingModule
  ]
})
export class RrhhModule { }