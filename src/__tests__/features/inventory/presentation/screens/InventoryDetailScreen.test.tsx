/**
 * WHAT: Tests TDD para InventoryDetailScreen — pantalla de detalle de inventario.
 * WHY: Validar renderizado de detalles (productName, currentStock), StockIndicator,
 *      role-gating del botón Ajustar Stock (admin/STOCK_MANAGER ven, viewer no),
 *      estados loading (LoadingIndicator), 404 (Producto no encontrado),
 *      y error genérico.
 * BENEFITS: Cobertura completa de la pantalla de detalle de inventario.
 *
 * TDD: RED — tests escritos antes de la implementación, deben fallar.
 *
 * PR 3.5a — 3.5a.2
 *
 * Mock strategy:
 * - jest.mock useInventory → control total de datos y funciones
 * - jest.mock useAuthStore → control de roles para role-gating
 * - jest.mock @react-navigation/native → route params y navigate/goBack
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// ──── Types ───────────────────────────────────────────────────────────

import type { Inventory } from '@features/inventory/domain';

// ──── Mock Data ───────────────────────────────────────────────────────

const mockInventoryDetail: Inventory = {
  productId: 1,
  productName: 'Cloro Concentrado',
  currentStock: 2,
  minStockThreshold: 10,
};

// ──── Mock Navigation ─────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...(actual as Record<string, unknown>),
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: { productId: 1 },
    }),
  };
});

// ──── Mock useAuthStore — role-gating ──────────────────────────────────

jest.mock('@features/auth/presentation/stores/authStore', () => {
  const actual = jest.requireActual(
    '@features/auth/presentation/stores/authStore',
  );
  return {
    ...(actual as Record<string, unknown>),
    useAuthStore: jest.fn(),
  };
});

// ──── Mock useInventory — valores controlados por test ────────────────

const mockRefetch = jest.fn();
const mockSelectInventory = jest.fn();
const mockOpenAdjustDialog = jest.fn();
const mockCloseAdjustDialog = jest.fn();

interface MockUseInventoryReturn {
  lowStockItems: Inventory[];
  isLoadingLowStock: boolean;
  isErrorLowStock: boolean;
  lowStockError: Error | null;
  refetchLowStock: jest.Mock;
  inventoryDetail: Inventory | undefined;
  isLoadingDetail: boolean;
  isErrorDetail: boolean;
  detailError: Error | null;
  adjustStock?: jest.Mock;
  isAdjusting: boolean;
  selectedInventoryId: number | null;
  selectInventory: jest.Mock;
  isAdjustDialogOpen: boolean;
  adjustDialogProductId: number | null;
  openAdjustDialog: jest.Mock;
  closeAdjustDialog: jest.Mock;
}

function createMockUseInventory(
  overrides: Partial<MockUseInventoryReturn> = {},
): MockUseInventoryReturn {
  return {
    lowStockItems: [],
    isLoadingLowStock: false,
    isErrorLowStock: false,
    lowStockError: null,
    refetchLowStock: mockRefetch,
    inventoryDetail: mockInventoryDetail,
    isLoadingDetail: false,
    isErrorDetail: false,
    detailError: null,
    isAdjusting: false,
    selectedInventoryId: null,
    selectInventory: mockSelectInventory,
    isAdjustDialogOpen: false,
    adjustDialogProductId: null,
    openAdjustDialog: mockOpenAdjustDialog,
    closeAdjustDialog: mockCloseAdjustDialog,
    ...overrides,
  };
}

jest.mock(
  '@features/inventory/presentation/hooks/useInventory',
  () => ({
    useInventory: jest.fn(),
  }),
);

// ──── Import (dynamic — after mocks) ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useInventory } = require(
  '@features/inventory/presentation/hooks/useInventory',
) as { useInventory: jest.Mock };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useAuthStore } = require(
  '@features/auth/presentation/stores/authStore',
) as { useAuthStore: jest.Mock };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { InventoryDetailScreen } = require(
  '@features/inventory/presentation/screens/InventoryDetailScreen',
) as { InventoryDetailScreen: React.ComponentType };

// ──── Helpers ─────────────────────────────────────────────────────────

function setupUseInventory(overrides: Partial<MockUseInventoryReturn> = {}) {
  useInventory.mockReturnValue(createMockUseInventory(overrides));
}

function setRoles(roles: string[]) {
  useAuthStore.mockImplementation(
    (selector: (state: Record<string, unknown>) => unknown): unknown => {
      if (typeof selector === 'function') {
        return selector({ session: { roles }, status: 'authenticated' });
      }
      return { session: { roles }, status: 'authenticated' };
    },
  );
}

function renderScreen() {
  return render(<InventoryDetailScreen />);
}

// ──── Suite ───────────────────────────────────────────────────────────

describe('InventoryDetailScreen — pantalla de detalle de inventario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupUseInventory();
    setRoles(['ADMIN']);
  });

  // ═══════════════════════════════════════════════════════════════
  // RENDERIZADO — detalles + StockIndicator
  // ═══════════════════════════════════════════════════════════════

  it('renderiza detalles del producto, StockIndicator y botón Ajustar Stock (admin)', () => {
    renderScreen();

    // Product name
    expect(screen.getByText('Cloro Concentrado')).toBeOnTheScreen();

    // Stock info
    expect(screen.getByText('Stock actual: 2 / 10')).toBeOnTheScreen();

    // StockIndicator presente
    expect(screen.getByTestId('stock-indicator')).toBeOnTheScreen();

    // Ajustar Stock visible para admin
    expect(screen.getByText('Ajustar Stock')).toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // ROLE GATING — admin ve, viewer no
  // ═══════════════════════════════════════════════════════════════

  it('muestra botón Ajustar Stock solo para admin/STOCK_MANAGER, lo oculta para viewer', () => {
    // Admin — visible
    setRoles(['ADMIN']);
    const { unmount } = renderScreen();
    expect(screen.getByText('Ajustar Stock')).toBeOnTheScreen();
    unmount();

    // STOCK_MANAGER — visible
    setRoles(['STOCK_MANAGER']);
    const { getByText: gm } = render(<InventoryDetailScreen />);
    expect(gm('Ajustar Stock')).toBeOnTheScreen();

    // Viewer — hidden
    // Need to re-render: unmount previous and render new
    // Actually, unmount was called above so we need a fresh render
    setRoles(['VIEWER']);
    const { queryByText: qb } = render(<InventoryDetailScreen />);
    expect(qb('Ajustar Stock')).not.toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // ESTADOS CONDICIONALES — loading, error, 404
  // ═══════════════════════════════════════════════════════════════

  it('muestra LoadingIndicator mientras carga y estado de error/404', () => {
    // Loading state
    setupUseInventory({ isLoadingDetail: true, inventoryDetail: undefined });
    renderScreen();

    expect(screen.getByTestId('loading-indicator')).toBeOnTheScreen();
    expect(screen.queryByText('Cloro Concentrado')).not.toBeOnTheScreen();

    // Error/404 state
    setupUseInventory({
      isLoadingDetail: false,
      isErrorDetail: true,
      detailError: new Error('Producto no encontrado'),
      inventoryDetail: undefined,
    });

    // Need fresh render after changing useInventory mock
    const { getByText: getTextErr } = render(<InventoryDetailScreen />);
    expect(getTextErr('Producto no encontrado')).toBeOnTheScreen();
  });
});
