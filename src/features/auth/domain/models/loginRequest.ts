// WHAT: Value object para request de login — dominio puro
export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}
