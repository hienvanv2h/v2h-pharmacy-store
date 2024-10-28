type Role = "Admin" | "Manager" | "Staff" | "Customer";

type User = {
  userId: number;
  uuid?: string;
  username: string;
  password: string;
  role?: Role;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserView = Omit<User, "userId">;

export type UserCreateDTO = {
  uuid?: string;
  username: string;
  password: string;
};

export type UserUpdateDTO = {
  username?: string;
  password?: string;
  role?: Role;
  isEnabled?: boolean;
};
