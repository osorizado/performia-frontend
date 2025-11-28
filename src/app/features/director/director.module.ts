import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DirectorRoutingModule } from './director-routing.module';

// Components
import { DirectorLayoutComponent } from './components/director-layout.component';
import { DashboardEjecutivoComponent } from './components/dashboard-ejecutivo/dashboard-ejecutivo.component';
import { ReportesConsolidadosComponent } from './components/reportes-consolidados/reportes-consolidados.component';
import { VistaAreasComponent } from './components/vista-areas/vista-areas.component';

@NgModule({
  declarations: [
    DirectorLayoutComponent,
    DashboardEjecutivoComponent,
    ReportesConsolidadosComponent,
    VistaAreasComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    DirectorRoutingModule
  ]
})
export class DirectorModule { }