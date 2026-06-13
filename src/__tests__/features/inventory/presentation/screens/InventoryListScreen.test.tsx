/**
 * WHAT: Tests TDD para InventoryListScreen — pantalla de listado de stock bajo.
 * WHY: Validar renderizado de FlatList con WarningBadge, estados condicionales
 *      (loading/empty/error), pull-to-refresh con SyncService.drain(),
 *      y navegación a InventoryDetail al presionar un item.
 * BENEFITS: Cobertura completa de la pantalla principal de inventario.
 *
 * TDD: RED — tests escritos antes de la implementación, deben fallar.
 *
 * PR 3.4 — 3.4.2
 *
 * Mock strategy:
 * - jest.mock useInventory → control total de datos y funciones
 * - jest.mock SyncService → verificar llamada a drain()
 * - jest.mock @react-navigation/native → capturar llamadas a navigate
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// ──── Types ───────────────────────────────────────────────────────────

import type { Inventory } from '@features/inventory/domain';

// ──── Mock Data ───────────────────────────────────────────────────────

const mockInventory1: Inventory = {
  productId: 1,
  productName: 'Cloro Concentrado',
  currentStock: 2,
  minStockThreshold: 10,
};

const mockInventory2: Inventory = {
  productId: 2,
  productName: 'Detergente Industrial',
  currentStock: 7,
  minStockThreshold: 15,
};

const mockInventory3: Inventory = {
  productId: 3,
  productName: 'Jabón Líquido',
  currentStock: 25,
  minStockThreshold: 20,
};

const mockLowStockItems: Inventory[] = [
  mockInventory1,
  mockInventory2,
  mockInventory3,
];

// ──── Mock Navigation ─────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

// ──── Mock SyncService ─────────────────────────────────────────────────

const mockSyncDrain = jest.fn().mockResolvedValue(undefined);

jest.mock('@core/sync/SyncService', () => ({
  SyncService: {
    instance: { drain: mockSyncDrain },
  },
}));

// ──── Mock useInventory — valores controlados por test ──────────────────

const mockRefetch = jest.fn();
const mockSelectInventory = jest.fn();

interface MockUseInventoryReturn {
  lowStockItems: Inventory[];
  isLoadingLowStock: boolean;
  isErrorLowStock: boolean;
  lowStockError: Error | null;
  refetchLowStock: jest.Mock;
  inventoryDetail?: Inventory;
  isLoadingDetail: boolean;
  isErrorDetail: boolean;
  detailError: Error | null;
  adjustStock?: jest.Mock;
  isAdjusting: boolean;
  selectedInventoryId: number | null;
  selectInventory: jest.Mock;
  isAdjustDialogOpen: boolean;
  adjustDialogProductId: number | null;
  openAdjustDialog?: jest.Mock;
  closeAdjustDialog?: jest.Mock;
}

function createMockUseInventory(
  overrides: Partial<MockUseInventoryReturn> = {},
): MockUseInventoryReturn {
  return {
    lowStockItems: mockLowStockItems,
    isLoadingLowStock: false,
    isErrorLowStock: false,
    lowStockError: null,
    refetchLowStock: mockRefetch,
    isLoadingDetail: false,
    isErrorDetail: false,
    detailError: null,
    isAdjusting: false,
    selectedInventoryId: null,
    selectInventory: mockSelectInventory,
    isAdjustDialogOpen: false,
    adjustDialogProductId: null,
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
const { InventoryListScreen } = require(
  '@features/inventory/presentation/screens/InventoryListScreen',
) as { InventoryListScreen: React.ComponentType };

// ──── Helpers ─────────────────────────────────────────────────────────

function setupUseInventory(overrides: Partial<MockUseInventoryReturn> = {}) {
  useInventory.mockReturnValue(createMockUseInventory(overrides));
}

function renderScreen() {
  return render(<InventoryListScreen />);
}

// ──── Suite ───────────────────────────────────────────────────────────

describe('InventoryListScreen — pantalla de stock bajo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupUseInventory();
  });

  // ═══════════════════════════════════════════════════════════════
  // RENDERIZADO
  // ═══════════════════════════════════════════════════════════════

  it('renderiza FlatList con productos de stock bajo y WarningBadge', () => {
    renderScreen();

    // AppBar
    expect(screen.getByText('Inventario')).toBeOnTheScreen();

    // Productos en la lista
    expect(screen.getByText('Cloro Concentrado')).toBeOnTheScreen();
    expect(screen.getByText('Detergente Industrial')).toBeOnTheScreen();
    expect(screen.getByText('Jabón Líquido')).toBeOnTheScreen();

    // WarningBadges — presente por testID
    const badges = screen.getAllByTestId('warning-badge');
    expect(badges).toHaveLength(3);
  });

  // ═══════════════════════════════════════════════════════════════
  // ESTADOS CONDICIONALES
  // ═══════════════════════════════════════════════════════════════

  it('muestra LoadingIndicator mientras carga, EmptyState sin items, ErrorBanner en fallo', () => {
    // Estado: loading
    setupUseInventory({ isLoadingLowStock: true, lowStockItems: [] });
    const { unmount } = renderScreen();

    expect(screen.getByTestId('loading-indicator')).toBeOnTheScreen();
    expect(screen.queryByText('Cloro Concentrado')).not.toBeOnTheScreen();

    // Estado: empty
    unmount();
    setupUseInventory({ isLoadingLowStock: false, lowStockItems: [] });
    const { getByText: getByText2 } = render(<InventoryListScreen />);

    expect(getByText2('No hay productos con stock bajo')).toBeOnTheScreen();

    // Estado: error
    const errorMsg = 'Error de conexión';
    setupUseInventory({
      isErrorLowStock: true,
      lowStockError: new Error(errorMsg),
      lowStockItems: [],
    });

    // Need to remount
    const { getByText: getByText3 } = render(<InventoryListScreen />);
    expect(getByText3('Reintentar')).toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // PULL TO REFRESH — SyncService.drain()
  // ═══════════════════════════════════════════════════════════════

  it('llama a SyncService.drain() y refetchLowStock al hacer pull-to-refresh', () => {
    renderScreen();

    const flatList = screen.getByTestId('inventory-flatlist');
    fireEvent(flatList, 'refresh');

    // Verificar que SyncService.drain() fue llamado
    expect(mockSyncDrain).toHaveBeenCalledTimes(1);

    // Verificar que refetchLowStock también fue llamado
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  // ═══════════════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════

  it('navega a InventoryDetail al presionar un item', () => {
    renderScreen();

    fireEvent.press(screen.getByText('Cloro Concentrado'));

    expect(mockNavigate).toHaveBeenCalledWith({
      name: 'InventoryDetail',
      params: { productId: 1 },
    });
  });
});
