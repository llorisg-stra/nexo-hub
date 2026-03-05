import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})
export class LoginComponent {
    loginForm: FormGroup;
    loading = signal(false);
    errorMessage = signal<string | null>(null);

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });

        // If already authenticated, redirect to dashboard
        if (this.auth.isAuthenticated()) {
            this.router.navigateByUrl('/dashboard');
        }
    }

    async onSubmit(): Promise<void> {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        const { email, password } = this.loginForm.value;
        const { error } = await this.auth.login(email, password);

        this.loading.set(false);

        if (error) {
            this.errorMessage.set(this.getErrorMessage(error.message));
        } else {
            this.router.navigateByUrl('/dashboard');
        }
    }

    private getErrorMessage(message: string): string {
        if (message.includes('Invalid login credentials')) {
            return 'Email o contraseña incorrectos';
        }
        if (message.includes('Email not confirmed')) {
            return 'Email no confirmado. Revisa tu bandeja de entrada.';
        }
        if (message.includes('Too many requests')) {
            return 'Demasiados intentos. Espera un momento.';
        }
        return 'Error al iniciar sesión. Inténtalo de nuevo.';
    }
}
