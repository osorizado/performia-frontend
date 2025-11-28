import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly TOKEN_TYPE_KEY = 'token_type';
  private readonly USER_KEY = 'current_user';

  constructor() { }

  /**
   * Guardar token de acceso
   */
  saveToken(token: string, tokenType: string = 'Bearer'): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.TOKEN_TYPE_KEY, tokenType);
  }

  /**
   * Obtener token de acceso
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtener tipo de token
   */
  getTokenType(): string | null {
    return localStorage.getItem(this.TOKEN_TYPE_KEY);
  }

  /**
   * Obtener token completo (tipo + token)
   */
  getFullToken(): string | null {
    const token = this.getToken();
    const tokenType = this.getTokenType();
    
    if (token && tokenType) {
      return `${tokenType} ${token}`;
    }
    
    return null;
  }

  /**
   * Verificar si existe un token
   */
  hasToken(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Guardar información del usuario
   */
  saveUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Obtener información del usuario
   */
  getUser(): any | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Limpiar todo el storage
   */
  clearAll(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_TYPE_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Guardar dato genérico
   */
  setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Obtener dato genérico
   */
  getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  /**
   * Eliminar dato genérico
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
