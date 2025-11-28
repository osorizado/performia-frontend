import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

// Services
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service';
import { ApiService } from './services/api.service';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    AuthService,
    StorageService,
    ApiService,
    AuthGuard,
    RoleGuard
  ]
})
export class CoreModule {
  // Asegurar que CoreModule solo se importe una vez
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule ya ha sido importado. Importar solo en AppModule.');
    }
  }
}
