export interface Login{
    email: string;
    password?: string;
}

export interface Register extends Login{
    fullName: string;
    sid: string;
    group: string;
}