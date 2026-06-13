/**
 * WHAT: Tests TDD para AdjustDialog — modal de ajuste de stock.
 * WHY: Validar renderizado de formulario (tipo, cantidad, razón), validación Zod,
 *      submit con adjustStock, cancel con closeAdjustDialog,
 *      y feedback de errores del servidor.
 * BENEFITS: Cobertura completa del diálogo de ajuste de stock.
 *
 * TDD: RED (now GREEN validation) — tests escritos antes de la implementación.
 *
 * PR 3.5b — 3.5b.1
 *
 * Mock strategy:
 * - jest.mock react-native/Libraries/Modal/Modal → render visible children inline
 * - jest.mock useInventoryStore → control de isAdjustDialogOpen, adjustDialogProductId, closeAdjustDialog
 * - jest.mock useInventory → control de adjustStock, isAdjusting, adjustError
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// ──── Mock Modal — render children when visible=true, null when false ───
// Named function component so RNTL detects it as a host wrapper
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const RealReact = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');

  function MockModal(props: {
    children: React.ReactNode;
    visible?: boolean;
    testID?: string;
  }) {
    // RNTL detectHostComponentNames renders Modal without visible prop
    // so we only hide when visible is explicitly false
    if (props.visible === false) return null;
    return RealReact.createElement(
      View,
      { testID: props.testID || 'modal' },
      props.children,
    );
  }

  MockModal.displayName = 'Modal';
  return MockModal;
});

// ──── Mocks ───────────────────────────────────────────────────────────

const mockCloseAdjustDialog = jest.fn();
const mockAdjustStock = jest.fn();

jest.mock(
  '@features/inventory/presentation/stores/inventoryStore',
  () => {
    const actual = jest.requireActual(
      '@features/inventory/presentation/stores/inventoryStore',
    );
    return {
      ...(actual as Record<string, unknown>),
      useInventoryStore: jest.fn(),
    };
  },
);

jest.mock(
  '@features/inventory/presentation/hooks/useInventory',
  () => ({
    useInventory: jest.fn(),
  }),
);

// ──── Dynamic imports (after mocks) ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useInventoryStore } = require(
  '@features/inventory/presentation/stores/inventoryStore',
) as { useInventoryStore: jest.Mock };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useInventory } = require(
  '@features/inventory/presentation/hooks/useInventory',
) as { useInventory: jest.Mock };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  adjustFormSchema,
  AdjustDialog,
}: {
  adjustFormSchema: import('zod').ZodObject<{
    type: import('zod').ZodEnum<['+', '-']>;
    quantity: import('zod').ZodNumber;
    reason: import('zod').ZodString;
  }>;
  AdjustDialog: React.ComponentType;
} = require('@features/inventory/presentation/components/AdjustDialog');

// ──── Helpers ──────────────────────────────────────────────────────────

  /**
   * WHAT: Configura el mock de useInventoryStore con valores controlados.
   * WHY: El diálogo usa selectores (selectIsAdjustDialogOpen, etc.) para leer
   *      del store. El mock debe invocar el selector con un estado falso.
   */
  function setupStore(overrides: Record<string, unknown> = {}) {
    const mockState = {
      selectedInventoryId: null,
      isAdjustDialogOpen: false,
      adjustDialogProductId: null,
      selectInventory: jest.fn(),
      openAdjustDialog: jest.fn(),
      closeAdjustDialog: mockCloseAdjustDialog,
      reset: jest.fn(),
      ...overrides,
    };

    useInventoryStore.mockImplementation(
      (selector?: (state: typeof mockState) => unknown) => {
        if (typeof selector === 'function') {
          return selector(mockState);
        }
        return mockState;
      },
    );
  }

/**
 * WHAT: Configura el mock de useInventory con los valores que necesita el diálogo.
 * WHY: El diálogo usa adjustStock (mutación), isAdjusting, adjustError
 *      y closeAdjustDialog del hook. No necesita queries de lista/detalle.
 */
function setupUseInventory(overrides: Record<string, unknown> = {}) {
  useInventory.mockReturnValue({
    lowStockItems: [],
    isLoadingLowStock: false,
    isErrorLowStock: false,
    lowStockError: null,
    refetchLowStock: jest.fn(),
    inventoryDetail: undefined,
    isLoadingDetail: false,
    isErrorDetail: false,
    detailError: null,
    adjustStock: mockAdjustStock,
    isAdjusting: false,
    selectedInventoryId: null,
    selectInventory: jest.fn(),
    isAdjustDialogOpen: false,
    adjustDialogProductId: null,
    openAdjustDialog: jest.fn(),
    closeAdjustDialog: jest.fn(),
    adjustError: null,
    isAdjustError: false,
    ...overrides,
  });
}

/** Renderiza el diálogo con los mocks configurados previamente */
function renderDialog() {
  return render(<AdjustDialog />);
}

// ──── Suite ────────────────────────────────────────────────────────────

describe('AdjustDialog — modal de ajuste de stock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // RENDERIZADO — campos del formulario visibles
  // ═══════════════════════════════════════════════════════════════

  describe('Renderizado condicional', () => {
    it('NO renderiza el diálogo cuando isAdjustDialogOpen=false', () => {
      setupStore({ isAdjustDialogOpen: false });
      setupUseInventory();
      renderDialog();

      expect(screen.queryByTestId('modal')).not.toBeOnTheScreen();
    });

    it('renderiza campos de tipo, cantidad, razón y botones cuando isAdjustDialogOpen=true', () => {
      setupStore({ isAdjustDialogOpen: true, adjustDialogProductId: 5 });
      setupUseInventory();
      renderDialog();

      // Modal visible
      expect(screen.getByTestId('modal')).toBeOnTheScreen();

      // Campos del formulario
      expect(screen.getByText('+ Incremento')).toBeOnTheScreen();
      expect(screen.getByText('− Decremento')).toBeOnTheScreen();
      expect(screen.getByPlaceholderText('Cantidad')).toBeOnTheScreen();
      expect(screen.getByPlaceholderText('Razón del ajuste')).toBeOnTheScreen();

      // Botones
      expect(screen.getByText('Confirmar')).toBeOnTheScreen();
      expect(screen.getByText('Cancelar')).toBeOnTheScreen();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // VALIDACIÓN — Zod schema
  // ═══════════════════════════════════════════════════════════════

  describe('Validación Zod del formulario', () => {
    it('acepta datos válidos con tipo +, cantidad positiva y razón con texto', () => {
      const result = adjustFormSchema.safeParse({
        type: '+',
        quantity: 5,
        reason: 'Reposición',
      });
      expect(result.success).toBe(true);
    });

    it('acepta datos válidos con tipo −, cantidad positiva y razón con texto', () => {
      const result = adjustFormSchema.safeParse({
        type: '-',
        quantity: 3,
        reason: 'Merma por vencimiento',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza cantidad <= 0', () => {
      const r1 = adjustFormSchema.safeParse({ type: '+', quantity: 0, reason: 'Repo' });
      expect(r1.success).toBe(false);

      const r2 = adjustFormSchema.safeParse({ type: '+', quantity: -1, reason: 'Repo' });
      expect(r2.success).toBe(false);
    });

    it('rechaza razón vacía', () => {
      const result = adjustFormSchema.safeParse({ type: '+', quantity: 5, reason: '' });
      expect(result.success).toBe(false);
    });

    it('rechaza tipo inválido', () => {
      const result = adjustFormSchema.safeParse({ type: 'X', quantity: 5, reason: 'Repo' });
      expect(result.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SUBMIT — llama a adjustStock con los valores correctos
  // ═══════════════════════════════════════════════════════════════

  describe('Submit del formulario', () => {
    it('llama a adjustStock con productId del store, tipo INCREMENT, cantidad y razón', async () => {
      setupStore({ isAdjustDialogOpen: true, adjustDialogProductId: 5 });
      setupUseInventory();
      renderDialog();

      // Tipo ya es '+' por defecto (defaultValues: { type: '+' })

      // Llenar cantidad
      const quantityInput = screen.getByPlaceholderText('Cantidad');
      fireEvent.changeText(quantityInput, '10');

      // Llenar razón
      const reasonInput = screen.getByPlaceholderText('Razón del ajuste');
      fireEvent.changeText(reasonInput, 'Reposición de stock');

      // Enviar formulario
      const submitButton = screen.getByText('Confirmar');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAdjustStock).toHaveBeenCalledWith(5, {
          type: 'INCREMENT',
          quantity: 10,
          reason: 'Reposición de stock',
        });
      });
    });

    it('llama a adjustStock con tipo DECREMENT cuando se selecciona −', async () => {
      setupStore({ isAdjustDialogOpen: true, adjustDialogProductId: 3 });
      setupUseInventory();
      renderDialog();

      // Seleccionar tipo Decremento
      const decrementButton = screen.getByText('− Decremento');
      fireEvent.press(decrementButton);

      // Llenar campos
      fireEvent.changeText(screen.getByPlaceholderText('Cantidad'), '4');
      fireEvent.changeText(screen.getByPlaceholderText('Razón del ajuste'), 'Merma');

      // Enviar
      fireEvent.press(screen.getByText('Confirmar'));

      await waitFor(() => {
        expect(mockAdjustStock).toHaveBeenCalledWith(3, {
          type: 'DECREMENT',
          quantity: 4,
          reason: 'Merma',
        });
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CANCEL — cierra el diálogo
  // ═══════════════════════════════════════════════════════════════

  describe('Cancelación del diálogo', () => {
    it('cierra el diálogo al presionar Cancelar', () => {
      setupStore({ isAdjustDialogOpen: true, adjustDialogProductId: 5 });
      setupUseInventory();
      renderDialog();

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.press(cancelButton);

      expect(mockCloseAdjustDialog).toHaveBeenCalledTimes(1);
      expect(mockAdjustStock).not.toHaveBeenCalled();
    });

    it('NO llama a adjustStock al cancelar (triangulación — path distinto a submit)', () => {
      setupStore({ isAdjustDialogOpen: true, adjustDialogProductId: 7 });
      setupUseInventory();
      renderDialog();

      // Llenar algunos campos
      fireEvent.changeText(screen.getByPlaceholderText('Cantidad'), '5');
      fireEvent.changeText(screen.getByPlaceholderText('Razón del ajuste'), 'Iba a enviar pero cancelé');

      // Cancelar en vez de enviar
      fireEvent.press(screen.getByText('Cancelar'));

      // Solo cierra, no envía
      expect(mockCloseAdjustDialog).toHaveBeenCalledTimes(1);
      expect(mockAdjustStock).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ERROR — muestra errores del servidor
  // ═══════════════════════════════════════════════════════════════

  describe('Errores del servidor', () => {
    it('muestra mensaje de error cuando adjustError está presente', () => {
      setupStore({ isAdjustDialogOpen: true, adjustDialogProductId: 5 });
      setupUseInventory({
        adjustError: new Error('Stock insuficiente. Solo hay 3 unidades disponibles'),
        isAdjustError: true,
      });
      renderDialog();

      expect(
        screen.getByText('Stock insuficiente. Solo hay 3 unidades disponibles'),
      ).toBeOnTheScreen();
    });

    it('NO muestra error cuando adjustError es null', () => {
      setupStore({ isAdjustDialogOpen: true, adjustDialogProductId: 5 });
      setupUseInventory({ adjustError: null, isAdjustError: false });
      renderDialog();

      expect(screen.queryByText(/Stock insuficiente/)).not.toBeOnTheScreen();
    });
  });
});
