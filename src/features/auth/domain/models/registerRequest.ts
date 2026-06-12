// WHAT: Value object para request de registro — dominio puro
export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
}
