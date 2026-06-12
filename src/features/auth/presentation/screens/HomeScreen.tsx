/**
 * HomeScreen — Pantalla principal post-login con ActionCards por rol.
 *
 * WHAT: Landing page que muestra ActionCards navegables filtradas por
 *       el rol del usuario (RBAC con 7 roles). Muestra nombre y roles
 *       en el header con botón de logout.
 *       Equivalente a home_screen.dart del Flutter.
 * WHY: Un solo punto de configuración de permisos — los ActionCards
 *      definen qué rutas ve cada rol. Si se agrega un nuevo rol o ruta,
 *      solo se actualiza el array actionCards.
 * BENEFITS: Navegación centralizada, contenido adaptativo por rol,
 *           sin if/else dispersos por rol en cada pantalla.
 *
 * TDD: GREEN — implementación mínima para pasar HomeScreen.test.tsx.
 *
 * NOTA: Las dependencias se instancian temporalmente aquí.
 *       En el PR de composition root se refactoriza con DI.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import {
  useAuthStore,
  selectRoles,
  selectUsername,
} from '../stores/authStore';
import { AuthRepositoryAdapter } from '../../infrastructure/adapters/authRepositoryAdapter';
import { AuthApi } from '../../infrastructure/api/authApi';
import { createApiClient } from '@core/http/apiClient';
import { InMemoryTokenStorage } from '@core/storage/tokenStorage';
import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@core/navigation/types';

// ──── ActionCards ─────────────────────────────────────────────────────

/**
 * WHAT: Configuración de ActionCards por rol — mismo patrón que home_screen.dart.
 * WHY: Un solo array define qué rutas ve cada rol. Si se agrega un rol nuevo,
 *      solo se modifica este array. Los roles son los mismos 7 del backend:
 *      ADMIN, STOCK_MANAGER, STOCK_OPERATOR, SALES_CLERK, PRODUCTION_OP,
 *      ACCOUNTANT, CUSTOMER.
 * BENEFITS: Configuración declarativa, sin lógica condicional dispersa.
 */
interface ActionCard {
  title: string;
  route: keyof RootStackParamList;
  roles: string[];
}

const actionCards: ActionCard[] = [
  {
    title: 'Ver Productos',
    route: 'ProductsList',
    roles: [
      'ADMIN',
      'STOCK_MANAGER',
      'STOCK_OPERATOR',
      'SALES_CLERK',
      'PRODUCTION_OP',
      'ACCOUNTANT',
      'CUSTOMER',
    ],
  },
  {
    title: 'Ver Inventario',
    route: 'InventoryList',
    roles: ['ADMIN', 'STOCK_MANAGER', 'STOCK_OPERATOR'],
  },
  {
    title: 'Materias Primas',
    route: 'BulkProductList',
    roles: ['ADMIN', 'STOCK_MANAGER'],
  },
  {
    title: 'Producción',
    route: 'ProductionBatchList',
    roles: ['ADMIN', 'PRODUCTION_OP'],
  },
  {
    title: 'Nueva Venta',
    route: 'SalesCreate',
    roles: ['ADMIN', 'SALES_CLERK'],
  },
  {
    title: 'Historial Ventas',
    route: 'SalesHistory',
    roles: ['ADMIN', 'SALES_CLERK', 'ACCOUNTANT'],
  },
  {
    title: 'Usuarios',
    route: 'UsersList',
    roles: ['ADMIN'],
  },
  {
    title: 'Nuevo Recibo',
    route: 'ReceiptCapture',
    roles: ['ADMIN', 'STOCK_MANAGER'],
  },
  {
    title: 'Historial Recibos',
    route: 'ReceiptsHistory',
    roles: ['ADMIN', 'STOCK_MANAGER', 'ACCOUNTANT'],
  },
  {
    title: 'Backups',
    route: 'BackupList',
    roles: ['ADMIN'],
  },
];

// ──── Props ───────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// ──── Componente ──────────────────────────────────────────────────────

/**
 * WHAT: Pantalla Home con ActionCards filtradas por rol.
 * WHY: Equivalente a home_screen.dart — landing page adaptable a 7 roles.
 * BENEFITS: Navegación centralizada, un solo punto de configuración de permisos,
 *           header con nombre de usuario y roles visibles.
 */
export function HomeScreen({ navigation }: Props) {
  const roles = useAuthStore(selectRoles);
  const username = useAuthStore(selectUsername);

  // TODO: Inyectar en composition root
  const tokenStorage = new InMemoryTokenStorage();
  const apiClient = createApiClient();
  const authApi = new AuthApi(apiClient);
  const authRepository = new AuthRepositoryAdapter(authApi, tokenStorage);
  const { logout } = useAuth({ authRepository });

  /**
   * WHAT: Filtra ActionCards según los roles del usuario.
   * WHY: Cada card define sus roles permitidos. Si el usuario
   *      tiene al menos uno de esos roles, ve la card.
   */
  const visibleCards = actionCards.filter((card) =>
    card.roles.some((role) => roles.includes(role)),
  );

  /**
   * WHAT: Cierra sesión y redirige a Login.
   * WHY: El reset() limpia el stack de navegación para que
   *      el usuario no pueda volver atrás al Home.
   */
  const handleLogout = () => {
    logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>
            ¡Hola, {username || 'Usuario'}!
          </Text>
          {roles.length > 0 && (
            <Text style={styles.roles}>{roles.join(' · ')}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Action Cards Grid */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.grid}
      >
        {visibleCards.map((card) => (
          <TouchableOpacity
            key={card.route}
            style={styles.card}
            onPress={() => navigation.navigate(card.route)}
            accessibilityRole="button"
          >
            <Text style={styles.cardTitle}>{card.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ──── Estilos ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: 60,
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    ...typography.h2,
    color: colors.textOnPrimary,
  },
  roles: {
    ...typography.bodySmall,
    color: colors.textOnPrimary,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  logoutText: {
    ...typography.button,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.primary,
    textAlign: 'center',
  },
});
