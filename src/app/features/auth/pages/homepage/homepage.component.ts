import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent {
  
  constructor(private router: Router) {}

  navegarALogin(): void {
    this.router.navigate(['/auth/login']);
  }

  navegarARegistro(): void {
    this.router.navigate(['/auth/register']);
  }
}
