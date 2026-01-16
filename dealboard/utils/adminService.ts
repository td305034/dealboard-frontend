import { authFetch } from "./authService";
import { BASE_SPRING_URL } from "./constants";
import { Deal } from "@/types/Deal";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

class AdminService {
  // User Management
  async getAllUsers(): Promise<AdminUser[]> {
    const response = await authFetch(`${BASE_SPRING_URL}/api/admin/users`, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      throw new Error("Nie udało się pobrać użytkowników");
    }

    return response.json();
  }

  async getUserById(id: number): Promise<AdminUser> {
    const response = await authFetch(
      `${BASE_SPRING_URL}/api/admin/users/${id}`,
      {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Nie udało się pobrać użytkownika");
    }

    return response.json();
  }

  async createUser(user: {
    name: string;
    email: string;
    role: string;
  }): Promise<AdminUser> {
    const response = await authFetch(`${BASE_SPRING_URL}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Błąd tworzenia użytkownika" }));
      throw new Error(error.message || "Nie udało się utworzyć użytkownika");
    }

    return response.json();
  }

  async updateUser(
    id: number,
    user: { name?: string; email?: string; role?: string }
  ): Promise<AdminUser> {
    const response = await authFetch(
      `${BASE_SPRING_URL}/api/admin/users/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(user),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Błąd aktualizacji użytkownika" }));
      throw new Error(
        error.message || "Nie udało się zaktualizować użytkownika"
      );
    }

    return response.json();
  }

  async deleteUser(id: number): Promise<void> {
    const response = await authFetch(
      `${BASE_SPRING_URL}/api/admin/users/${id}`,
      {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Nie udało się usunąć użytkownika");
    }
  }

  // Deal Management
  async getAllDeals(): Promise<Deal[]> {
    const response = await authFetch(`${BASE_SPRING_URL}/api/admin/deals`, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      throw new Error("Nie udało się pobrać promocji");
    }

    return response.json();
  }

  async getDealById(id: number): Promise<Deal> {
    const response = await authFetch(
      `${BASE_SPRING_URL}/api/admin/deals/${id}`,
      {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Nie udało się pobrać promocji");
    }

    return response.json();
  }

  async createDeal(deal: Omit<Deal, "id">): Promise<Deal> {
    const response = await authFetch(`${BASE_SPRING_URL}/api/admin/deals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(deal),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Błąd tworzenia promocji" }));
      throw new Error(error.message || "Nie udało się utworzyć promocji");
    }

    return response.json();
  }

  async updateDeal(id: number, deal: Partial<Omit<Deal, "id">>): Promise<Deal> {
    const response = await authFetch(
      `${BASE_SPRING_URL}/api/admin/deals/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(deal),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Błąd aktualizacji promocji" }));
      throw new Error(error.message || "Nie udało się zaktualizować promocji");
    }

    return response.json();
  }

  async deleteDeal(id: number): Promise<void> {
    const response = await authFetch(
      `${BASE_SPRING_URL}/api/admin/deals/${id}`,
      {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Nie udało się usunąć promocji");
    }
  }
}

export const adminService = new AdminService();
