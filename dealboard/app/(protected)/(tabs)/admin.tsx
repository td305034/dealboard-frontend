import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import {
  Text,
  Button,
  DataTable,
  Portal,
  Dialog,
  TextInput,
  Snackbar,
  IconButton,
  SegmentedButtons,
  ActivityIndicator,
  Switch,
} from "react-native-paper";
import { useAuth } from "@/context/auth";
import { adminService, AdminUser } from "@/utils/adminService";
import { Deal } from "@/types/Deal";

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "deals">("users");

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Deals state
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // Pagination state
  const [usersPage, setUsersPage] = useState(0);
  const [dealsPage, setDealsPage] = useState(0);
  const [itemsPerPage] = useState(10);

  // Dialog states
  const [userDialogVisible, setUserDialogVisible] = useState(false);
  const [dealDialogVisible, setDealDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Form states
  const [editingUser, setEditingUser] = useState<
    (AdminUser & { password?: string }) | null
  >(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "user" | "deal";
    id: number;
  } | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  if (Platform.OS !== "web" || user?.role !== "ADMIN") {
    return (
      <View style={styles.container}>
        <Text variant="headlineMedium">Brak dostępu</Text>
        <Text>
          Ta sekcja jest dostępna tylko dla administratorów na platformie web.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    } else {
      loadDeals();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
      setUsersPage(0); // Reset to first page
    } catch (error: any) {
      showSnackbar(error.message || "Błąd wczytywania użytkowników", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  const paginatedUsers = users.slice(
    usersPage * itemsPerPage,
    usersPage * itemsPerPage + itemsPerPage
  );

  const loadDeals = async () => {
    setLoadingDeals(true);
    try {
      const data = await adminService.getAllDeals();
      setDeals(data);
      setDealsPage(0); // Reset to first page
    } catch (error: any) {
      showSnackbar(error.message || "Błąd wczytywania promocji", "error");
    } finally {
      setLoadingDeals(false);
    }
  };

  const paginatedDeals = deals.slice(
    dealsPage * itemsPerPage,
    dealsPage * itemsPerPage + itemsPerPage
  );

  const showSnackbar = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setSnackbar({ visible: true, message, type });
  };

  const handleAddUser = () => {
    setEditingUser({
      id: 0,
      name: "",
      email: "",
      role: "USER",
      createdAt: "",
      password: "",
    });
    setUserDialogVisible(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser({ ...user, password: "" });
    setUserDialogVisible(true);
  };

  const handleDeleteUser = (userId: number) => {
    setDeleteTarget({ type: "user", id: userId });
    setDeleteDialogVisible(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      if (editingUser.id === 0) {
        await adminService.createUser({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
        });
        showSnackbar("Użytkownik dodany pomyślnie");
      } else {
        await adminService.updateUser(editingUser.id, {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
        });
        showSnackbar("Użytkownik zaktualizowany pomyślnie");
      }
      setUserDialogVisible(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      showSnackbar(error.message || "Błąd zapisywania użytkownika", "error");
    }
  };

  const handleAddDeal = () => {
    setEditingDeal({
      id: 0,
      name: "",
      store: "",
      category: "",
      promoNotes: "",
      priceValue: null,
      priceAlt: "",
      discountPercentage: null,
      imageUrl: "",
      unit: "",
      validUntil: new Date().toISOString().split("T")[0],
      validSince: new Date().toISOString().split("T")[0],
      appRequired: false,
    });
    setDealDialogVisible(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal({ ...deal });
    setDealDialogVisible(true);
  };

  const handleDeleteDeal = (dealId: number) => {
    setDeleteTarget({ type: "deal", id: dealId });
    setDeleteDialogVisible(true);
  };

  const handleSaveDeal = async () => {
    if (!editingDeal) return;

    try {
      const dealData = {
        name: editingDeal.name,
        store: editingDeal.store,
        category: editingDeal.category,
        promoNotes: editingDeal.promoNotes || null,
        priceValue: editingDeal.priceValue,
        priceAlt: editingDeal.priceAlt || null,
        discountPercentage: editingDeal.discountPercentage,
        imageUrl: editingDeal.imageUrl || null,
        unit: editingDeal.unit,
        validUntil: editingDeal.validUntil,
        validSince: editingDeal.validSince || null,
        appRequired: editingDeal.appRequired || false,
      };

      if (editingDeal.id === 0) {
        await adminService.createDeal(dealData);
        showSnackbar("Promocja dodana pomyślnie");
      } else if (editingDeal.id) {
        await adminService.updateDeal(editingDeal.id, dealData);
        showSnackbar("Promocja zaktualizowana pomyślnie");
      }
      setDealDialogVisible(false);
      setEditingDeal(null);
      loadDeals();
    } catch (error: any) {
      showSnackbar(error.message || "Błąd zapisywania promocji", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "user") {
        await adminService.deleteUser(deleteTarget.id);
        showSnackbar("Użytkownik usunięty");
        loadUsers();
      } else {
        await adminService.deleteDeal(deleteTarget.id);
        showSnackbar("Promocja usunięta");
        loadDeals();
      }
      setDeleteDialogVisible(false);
      setDeleteTarget(null);
    } catch (error: any) {
      showSnackbar(error.message || "Błąd usuwania", "error");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text variant="headlineMedium" style={styles.title}>
        Panel Administratora
      </Text>

      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "users" | "deals")}
        buttons={[
          { value: "users", label: "Użytkownicy", icon: "account-group" },
          { value: "deals", label: "Promocje", icon: "tag-multiple" },
        ]}
        style={styles.segmentedButtons}
      />

      {activeTab === "users" ? (
        <View style={styles.section}>
          <View style={styles.header}>
            <Text variant="titleLarge">Zarządzanie użytkownikami</Text>
            <Button
              mode="contained"
              onPress={handleAddUser}
              icon="plus"
              buttonColor="#7868f5ff"
            >
              Dodaj użytkownika
            </Button>
          </View>

          {loadingUsers ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#7868f5ff" />
            </View>
          ) : (
            <ScrollView horizontal>
              <DataTable style={styles.table}>
                <DataTable.Header>
                  <DataTable.Title style={styles.columnId}>ID</DataTable.Title>
                  <DataTable.Title style={styles.columnName}>
                    Imię
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnEmail}>
                    Email
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnRole}>
                    Rola
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnDate}>
                    Data utworzenia
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnActions}>
                    Akcje
                  </DataTable.Title>
                </DataTable.Header>

                {paginatedUsers.map((userItem) => (
                  <DataTable.Row key={userItem.id}>
                    <DataTable.Cell style={styles.columnId}>
                      {userItem.id}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnName}>
                      {userItem.name}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnEmail}>
                      {userItem.email}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnRole}>
                      {userItem.role}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnDate}>
                      {new Date(userItem.createdAt).toLocaleDateString("pl-PL")}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditUser(userItem)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#d32f2f"
                        onPress={() => handleDeleteUser(userItem.id)}
                      />
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}

                <DataTable.Pagination
                  page={usersPage}
                  numberOfPages={Math.ceil(users.length / itemsPerPage)}
                  onPageChange={(page) => setUsersPage(page)}
                  label={`${usersPage * itemsPerPage + 1}-${Math.min((usersPage + 1) * itemsPerPage, users.length)} z ${users.length}`}
                  numberOfItemsPerPage={itemsPerPage}
                  showFastPaginationControls
                />
              </DataTable>
            </ScrollView>
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.header}>
            <Text variant="titleLarge">Zarządzanie promocjami</Text>
            <Button
              mode="contained"
              onPress={handleAddDeal}
              icon="plus"
              buttonColor="#7868f5ff"
            >
              Dodaj promocję
            </Button>
          </View>

          {loadingDeals ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#7868f5ff" />
            </View>
          ) : (
            <ScrollView horizontal>
              <DataTable style={styles.table}>
                <DataTable.Header>
                  <DataTable.Title style={styles.columnId}>ID</DataTable.Title>
                  <DataTable.Title style={styles.columnDealName}>
                    Nazwa
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnStore}>
                    Sklep
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnCategory}>
                    Kategoria
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnPrice}>
                    Cena
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnDiscount}>
                    Zniżka
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnDate}>
                    Ważne do
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnDate}>
                    Ważne od
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnAppRequired}>
                    Wymaga aplikacji
                  </DataTable.Title>
                  <DataTable.Title style={styles.columnActions}>
                    Akcje
                  </DataTable.Title>
                </DataTable.Header>

                {paginatedDeals.map((deal) => (
                  <DataTable.Row key={deal.id}>
                    <DataTable.Cell style={styles.columnId}>
                      {deal.id}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnDealName}>
                      {deal.name}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnStore}>
                      {deal.store || "-"}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnCategory}>
                      {deal.category}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnPrice}>
                      {deal.priceValue
                        ? `${deal.priceValue} zł`
                        : deal.priceAlt || "-"}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnDiscount}>
                      {deal.discountPercentage
                        ? `${deal.discountPercentage}%`
                        : "-"}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnDate}>
                      {deal.validUntil
                        ? new Date(deal.validUntil).toLocaleDateString("pl-PL")
                        : "-"}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnDate}>
                      {deal.validSince
                        ? new Date(deal.validSince).toLocaleDateString("pl-PL")
                        : "-"}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnAppRequired}>
                      {deal.appRequired ? "Tak" : "Nie"}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.columnActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditDeal(deal)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#d32f2f"
                        onPress={() => deal.id && handleDeleteDeal(deal.id)}
                      />
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}

                <DataTable.Pagination
                  page={dealsPage}
                  numberOfPages={Math.ceil(deals.length / itemsPerPage)}
                  onPageChange={(page) => setDealsPage(page)}
                  label={`${dealsPage * itemsPerPage + 1}-${Math.min((dealsPage + 1) * itemsPerPage, deals.length)} z ${deals.length}`}
                  numberOfItemsPerPage={itemsPerPage}
                  showFastPaginationControls
                />
              </DataTable>
            </ScrollView>
          )}
        </View>
      )}

      {/* User Dialog */}
      <Portal>
        <Dialog
          visible={userDialogVisible}
          onDismiss={() => setUserDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>
            {editingUser?.id === 0 ? "Dodaj użytkownika" : "Edytuj użytkownika"}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Imię"
              value={editingUser?.name || ""}
              onChangeText={(text) =>
                setEditingUser((prev) =>
                  prev ? { ...prev, name: text } : null
                )
              }
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Email"
              value={editingUser?.email || ""}
              onChangeText={(text) =>
                setEditingUser((prev) =>
                  prev ? { ...prev, email: text } : null
                )
              }
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label="Rola (USER/ADMIN)"
              value={editingUser?.role || ""}
              onChangeText={(text) =>
                setEditingUser((prev) =>
                  prev ? { ...prev, role: text.toUpperCase() } : null
                )
              }
              style={styles.input}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUserDialogVisible(false)}>Anuluj</Button>
            <Button
              onPress={handleSaveUser}
              buttonColor="#7868f5ff"
              textColor="white"
            >
              Zapisz
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Deal Dialog */}
      <Portal>
        <Dialog
          visible={dealDialogVisible}
          onDismiss={() => setDealDialogVisible(false)}
          style={styles.dialogLarge}
        >
          <Dialog.Title>
            {editingDeal?.id === 0 ? "Dodaj promocję" : "Edytuj promocję"}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogScroll}>
              <TextInput
                label="Nazwa *"
                value={editingDeal?.name || ""}
                onChangeText={(text) =>
                  setEditingDeal((prev) =>
                    prev ? { ...prev, name: text } : null
                  )
                }
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Sklep *"
                value={editingDeal?.store || ""}
                onChangeText={(text) =>
                  setEditingDeal((prev) =>
                    prev ? { ...prev, store: text } : null
                  )
                }
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Kategoria *"
                value={editingDeal?.category || ""}
                onChangeText={(text) =>
                  setEditingDeal((prev) =>
                    prev ? { ...prev, category: text } : null
                  )
                }
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Jednostka * (np. kg, szt)"
                value={editingDeal?.unit || ""}
                onChangeText={(text) =>
                  setEditingDeal((prev) =>
                    prev ? { ...prev, unit: text } : null
                  )
                }
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Cena (liczba)"
                value={editingDeal?.priceValue?.toString() || ""}
                onChangeText={(text) =>
                  setEditingDeal((prev) =>
                    prev
                      ? {
                          ...prev,
                          priceValue: text ? parseFloat(text) || null : null,
                        }
                      : null
                  )
                }
                style={styles.input}
                mode="outlined"
                keyboardType="decimal-pad"
              />
              <TextInput
                label="Cena alternatywna (tekst)"
                value={editingDeal?.priceAlt || ""}
                onChangeText={(text) =>
                  setEditingDeal((prev) =>
                    prev ? { ...prev, priceAlt: text } : null
                  )
                }
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Procent zniżki"
                value={editingDeal?.discountPercentage?.toString() || ""}
                onChangeText={(text) =>
                  setEditingDeal((prev) =>
                    prev
                      ? {
                          ...prev,
                          discountPercentage: text
                            ? parseFloat(text) || null
                            : null,
                        }
                      : null
                  )
                }
                style={styles.input}
                mode="outlined"
                keyboardType="decimal-pad"
              />
              <TextInput
                label="Notatki promocyjne"
                value={editingDeal?.promoNotes || ""}
                onChangeText={(text) =>
                  setEditingDeal((prev) =>
                    prev ? { ...prev, promoNotes: text } : null
                  )
                }
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
              <TextInput
                label="Ważne do * (YYYY-MM-DD)"
                value={editingDeal?.validUntil || ""}
                onChangeText={(text) =>
                  setEditingDeal((prev) =>
                    prev ? { ...prev, validUntil: text } : null
                  )
                }
                style={styles.input}
                mode="outlined"
                placeholder="2024-12-31"
              />
              <TextInput
                label="Ważne od (YYYY-MM-DD)"
                value={editingDeal?.validSince || ""}
                onChangeText={(text) =>
                  setEditingDeal((prev) =>
                    prev ? { ...prev, validSince: text } : null
                  )
                }
                style={styles.input}
                mode="outlined"
                placeholder="2024-01-01"
              />
              <View style={styles.switchContainer}>
                <Text>Wymaga aplikacji</Text>
                <Switch
                  value={editingDeal?.appRequired || false}
                  onValueChange={(value) =>
                    setEditingDeal((prev) =>
                      prev ? { ...prev, appRequired: value } : null
                    )
                  }
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDealDialogVisible(false)}>Anuluj</Button>
            <Button
              onPress={handleSaveDeal}
              buttonColor="#7868f5ff"
              textColor="white"
            >
              Zapisz
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Potwierdź usunięcie</Dialog.Title>
          <Dialog.Content>
            <Text>
              Czy na pewno chcesz usunąć{" "}
              {deleteTarget?.type === "user" ? "użytkownika" : "promocję"}?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Anuluj
            </Button>
            <Button onPress={confirmDelete} textColor="#d32f2f">
              Usuń
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{
          backgroundColor: snackbar.type === "error" ? "#d32f2f" : "#4caf50",
        }}
      >
        {snackbar.message}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
    fontWeight: "bold",
    color: "#333",
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  section: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  table: {
    minWidth: 1000,
  },
  columnId: {
    width: 60,
  },
  columnName: {
    width: 150,
  },
  columnEmail: {
    width: 220,
  },
  columnRole: {
    width: 100,
  },
  columnDate: {
    width: 120,
  },
  columnDealName: {
    flex: 1,
    minWidth: 300,
  },
  columnStore: {
    width: 150,
  },
  columnCategory: {
    width: 120,
  },
  columnPrice: {
    width: 100,
  },
  columnDiscount: {
    width: 80,
  },
  columnAppRequired: {
    width: 100,
  },
  columnActions: {
    width: 120,
  },
  loading: {
    padding: 40,
    alignItems: "center",
  },
  dialog: {
    maxWidth: 500,
    alignSelf: "center",
    width: "90%",
  },
  dialogLarge: {
    maxWidth: 600,
    alignSelf: "center",
    width: "90%",
    maxHeight: "80%",
  },
  dialogScroll: {
    maxHeight: 400,
  },
  input: {
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
});
