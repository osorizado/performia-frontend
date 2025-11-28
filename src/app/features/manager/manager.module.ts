import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ManagerRoutingModule } from './manager-routing.module';
import { ManagerLayoutComponent } from './components/manager-layout.component';
import { ManagerDashboardComponent } from './components/dashboard/dashboard.component';
import { MiEquipoComponent } from './components/mi-equipo/mi-equipo.component';
import { EvaluacionesComponent } from './components/evaluaciones/evaluaciones.component';
import { EvaluarColaboradorComponent } from './components/evaluar-colaborador/evaluar-colaborador.component';  // ← AGREGAR

@NgModule({
  declarations: [
    ManagerLayoutComponent,
    ManagerDashboardComponent,
    MiEquipoComponent,
    EvaluacionesComponent,
    EvaluarColaboradorComponent  // ← AGREGAR
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    ManagerRoutingModule
  ]
})
export class ManagerModule { }