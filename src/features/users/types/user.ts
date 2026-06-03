export interface UserRole {
  id: number;
  name: string;
}

export interface User {
  id: string;
  roles: UserRole[];
  firstName: string;
  middleName?: string;
  lastName: string;
  suffixName?: string;
  email: string;
  type: string;
  studentNumber?: string;
  profilePicture?: string;
  studentCorUrl?: string;
  isStudentCorValid?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
