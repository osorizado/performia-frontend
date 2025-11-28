import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './pages/login/login.component';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { RecuperarPasswordComponent } from './pages/recuperar-password/recuperar-password.component';
import { RegisterComponent } from './pages/register/register.component';
import { ConfirmarCorreoComponent } from './pages/confirmar-correo/confirmar-correo.component';
import { CorreoConfirmadoComponent } from './pages/correo-confirmado/correo-confirmado.component';

@NgModule({
  declarations: [
    LoginComponent,
    HomepageComponent,
    RecuperarPasswordComponent,
    RegisterComponent,
    ConfirmarCorreoComponent,
    CorreoConfirmadoComponent 
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AuthRoutingModule
  ]
})
export class AuthModule { }