import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(5), Validators.maxLength(320)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
        ]
      ],
      confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]]
    }, {
      validators: [this.passwordsMatchValidator()]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }

  get firstName() {
    return this.registerForm.get('firstName');
  }

  get lastName() {
    return this.registerForm.get('lastName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private passwordsMatchValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      if (!password || !confirmPassword) {
        return null;
      }
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }
}