import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { RecuperarPasswordComponent } from './pages/recuperar-password/recuperar-password.component';
import { RegisterComponent } from './pages/register/register.component';
import { ConfirmarCorreoComponent } from './pages/confirmar-correo/confirmar-correo.component';
import { CorreoConfirmadoComponent } from './pages/correo-confirmado/correo-confirmado.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'homepage',
    pathMatch: 'full'
  },
  {
    path: 'homepage',
    component: HomepageComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'recuperar-password',
    component: RecuperarPasswordComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'confirmar-correo',
    component: ConfirmarCorreoComponent
  },
  {
    path: 'confirmar-correo/:token',  // ✅ NUEVA RUTA con token
    component: CorreoConfirmadoComponent
  },
  {
    path: 'correo-confirmado',
    component: CorreoConfirmadoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }