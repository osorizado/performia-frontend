import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ColaboradorRoutingModule } from './colaborador-routing.module';
import { ColaboradorLayoutComponent } from './components/colaborador-layout.component';
import { ColaboradorDashboardComponent } from './components/dashboard/dashboard.component';
import { AutoevaluacionComponent } from './components/autoevaluacion/autoevaluacion.component';
import { ObjetivosComponent } from './components/objetivos/objetivos.component';

// Servicios
import { ObjetivosService } from './services/objetivos.service';
import { EvaluacionesService } from './services/evaluaciones.service';

@NgModule({
  declarations: [
    ColaboradorLayoutComponent,
    ColaboradorDashboardComponent,
    AutoevaluacionComponent,
    ObjetivosComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    ColaboradorRoutingModule
  ],
  providers: [
    ObjetivosService,
    EvaluacionesService
  ]
})
export class ColaboradorModule { }