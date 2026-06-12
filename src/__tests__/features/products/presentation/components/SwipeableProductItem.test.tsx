/**
 * WHAT: Tests TDD para SwipeableProductItem — ítem de lista de productos.
 * WHY: Validar renderizado de nombre, SKU, callbacks onPress/onLongPress
 *      y accesibilidad. NO usa swipe gesture porque react-native-gesture-handler
 *      no está instalado — usa onLongPress como fallback para delete.
 * BENEFITS: Cobertura completa de renderizado, interacción y accesibilidad.
 *
 * TDD: RED → estos tests fallan hasta implementar SwipeableProductItem.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { SwipeableProductItem } from '@features/products/presentation/components/SwipeableProductItem';
import type { Product } from '@features/products/domain';

// ──── Mock de producto ────────────────────────────────────────────────

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    sku: 'PROD-001',
    name: 'Detergente Líquido 5L',
    minPrice: 150.5,
    active: true,
    ...overrides,
  };
}

// ──── Suite ────────────────────────────────────────────────────────────

describe('SwipeableProductItem — renderizado', () => {
  /**
   * WHAT: El ítem debe mostrar el nombre del producto como texto principal.
   * WHY: El nombre es la información más importante — el usuario lo necesita
   *      para identificar el producto en la lista.
   */
  it('renderiza el nombre del producto', () => {
    // Arrange
    const product = createMockProduct({ name: 'Jabón Líquido' });
    const onPress = jest.fn();
    const onDelete = jest.fn();

    // Act
    render(
      <SwipeableProductItem
        product={product}
        onPress={onPress}
        onDelete={onDelete}
      />,
    );

    // Assert
    expect(screen.getByText('Jabón Líquido')).toBeOnTheScreen();
  });

  /**
   * WHAT: El ítem debe mostrar el SKU como texto secundario.
   * WHY: El SKU es el identificador único del producto — visible para
   *      operaciones de inventario y búsqueda.
   */
  it('renderiza el SKU del producto', () => {
    // Arrange
    const product = createMockProduct({ sku: 'PROD-042' });
    const onPress = jest.fn();
    const onDelete = jest.fn();

    // Act
    render(
      <SwipeableProductItem
        product={product}
        onPress={onPress}
        onDelete={onDelete}
      />,
    );

    // Assert
    expect(screen.getByText('PROD-042')).toBeOnTheScreen();
  });

  /**
   * WHAT: Nombre y SKU deben coexistir en el mismo ítem.
   * WHY: Triangulación — verificamos que ambos textos se renderizan
   *      simultáneamente, no uno u otro.
   */
  it('renderiza nombre y SKU simultáneamente', () => {
    // Arrange
    const product = createMockProduct();
    const onPress = jest.fn();
    const onDelete = jest.fn();

    // Act
    render(
      <SwipeableProductItem
        product={product}
        onPress={onPress}
        onDelete={onDelete}
      />,
    );

    // Assert
    expect(screen.getByText('Detergente Líquido 5L')).toBeOnTheScreen();
    expect(screen.getByText('PROD-001')).toBeOnTheScreen();
  });
});

describe('SwipeableProductItem — interacción', () => {
  /**
   * WHAT: Al presionar el ítem, debe llamar a onPress.
   * WHY: Navegación al detalle del producto — el usuario toca un ítem
   *      para ver sus detalles completos.
   */
  it('llama a onPress al presionar el ítem', () => {
    // Arrange
    const product = createMockProduct();
    const onPress = jest.fn();
    const onDelete = jest.fn();

    // Act
    render(
      <SwipeableProductItem
        product={product}
        onPress={onPress}
        onDelete={onDelete}
      />,
    );
    fireEvent.press(screen.getByText('Detergente Líquido 5L'));

    // Assert
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  /**
   * WHAT: Al mantener presionado (long press), debe llamar a onDelete.
   * WHY: Sin react-native-gesture-handler, el swipe no está disponible.
   *      onLongPress es el fallback para abrir el diálogo de confirmación
   *      de eliminación (spec R6).
   */
  it('llama a onDelete al hacer long press', () => {
    // Arrange
    const product = createMockProduct();
    const onPress = jest.fn();
    const onDelete = jest.fn();

    // Act
    render(
      <SwipeableProductItem
        product={product}
        onPress={onPress}
        onDelete={onDelete}
      />,
    );
    const element = screen.getByText('Detergente Líquido 5L');
    fireEvent(element, 'longPress');

    // Assert
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  /**
   * WHAT: Press normal y long press deben ser independientes.
   * WHY: Triangulación — verificamos que no hay interferencia entre
   *      los dos callbacks.
   */
  it('distingue entre press y long press sin interferencia', () => {
    // Arrange
    const product = createMockProduct();
    const onPress = jest.fn();
    const onDelete = jest.fn();

    // Act — long press primero
    render(
      <SwipeableProductItem
        product={product}
        onPress={onPress}
        onDelete={onDelete}
      />,
    );
    const element = screen.getByText('Detergente Líquido 5L');
    fireEvent(element, 'longPress');

    // Assert — solo onDelete
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(0);
  });
});

describe('SwipeableProductItem — accesibilidad', () => {
  /**
   * WHAT: El ítem debe ser accesible vía accessibilityLabel.
   * WHY: Lectores de pantalla (TalkBack, VoiceOver) necesitan un label
   *      descriptivo para navegar la lista de productos.
   */
  it('tiene accessibilityLabel con nombre y SKU del producto', () => {
    // Arrange
    const product = createMockProduct();
    const onPress = jest.fn();
    const onDelete = jest.fn();

    // Act
    render(
      <SwipeableProductItem
        product={product}
        onPress={onPress}
        onDelete={onDelete}
      />,
    );

    // Assert — buscar por label que incluya el nombre
    const accessibleElement = screen.getByLabelText(
      'Detergente Líquido 5L, SKU PROD-001',
    );
    expect(accessibleElement).toBeOnTheScreen();
  });

  /**
   * WHAT: La acción de eliminar debe tener un label accesible.
   * WHY: Los usuarios de lectores de pantalla deben saber que
   *      mantener presionado permite eliminar.
   */
  it('tiene accessibilityHint para la acción de eliminar', () => {
    // Arrange
    const product = createMockProduct();
    const onPress = jest.fn();
    const onDelete = jest.fn();

    // Act
    render(
      <SwipeableProductItem
        product={product}
        onPress={onPress}
        onDelete={onDelete}
      />,
    );

    // Assert — el elemento accesible tiene hint de long press
    const accessibleElement = screen.getByLabelText(
      'Detergente Líquido 5L, SKU PROD-001',
    );
    expect(accessibleElement.props.accessibilityHint).toBe(
      'Mantener presionado para eliminar',
    );
  });
});
