import { Injectable } from '@angular/core';
import { HttpService } from '@shared/services/http.service';
import { Observable } from 'rxjs';
import { AuthController } from '@shared/Controllers/AuthController';

@Injectable({ providedIn: 'root' })
export class AuthService {
    constructor(private http: HttpService) { }

    revokeRefreshToken(refreshToken: string, reason?: string): Observable<any> {
        return this.http.POST(AuthController.Revoke, {
            refreshToken,
            reason: reason || null
        });
    }

    refreshToken(refreshToken: string): Observable<any> {
        return this.http.POST(AuthController.Refresh, { refreshToken });
    }
}
