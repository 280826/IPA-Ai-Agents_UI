import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule] // Import ReactiveFormsModule here
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMsg = '';

  form = this.fb.group({
    email: ['', Validators.required],
    password: ['', Validators.required]
  });

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/agents']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = (err?.error?.message) || 'Login failed';
        }
      });
  }
}