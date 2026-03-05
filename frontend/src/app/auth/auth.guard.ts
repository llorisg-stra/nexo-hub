import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Wait for initial session check to complete
    if (auth.loading()) {
        return new Promise<boolean>((resolve) => {
            const check = setInterval(() => {
                if (!auth.loading()) {
                    clearInterval(check);
                    if (auth.isAuthenticated()) {
                        resolve(true);
                    } else {
                        router.navigateByUrl('/login');
                        resolve(false);
                    }
                }
            }, 50);
        });
    }

    if (auth.isAuthenticated()) {
        return true;
    }

    router.navigateByUrl('/login');
    return false;
};
