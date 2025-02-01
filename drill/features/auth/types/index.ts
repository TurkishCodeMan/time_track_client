export type Role = 'ADMIN' | 'ENGINEER' | 'WORKER';

export interface User {
    id: number;
    email: string;
    name: string;
    surname: string;
    role: Role;
    is_active: boolean;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    name: string;
    surname: string;
    role: Role;
} 