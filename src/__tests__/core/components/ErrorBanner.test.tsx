/**
 * WHAT: Tests unitarios para ErrorBanner — banner de error con dismiss y retry.
 * WHY: TDD RED — los tests definen el contrato del componente antes de implementar.
 *      Consistencia visual con branded_error_banner.dart del Flutter original.
 *      Mismo diseño de banner rojo con acciones opcionales.
 * BENEFITS: Cobertura completa de renderizado condicional y callbacks.
 *           Sin errores de layout ni regresiones al modificar el diseño.
 *
 * TDD: RED — tests escritos antes que la implementación.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { ErrorBanner } from '@core/components/ErrorBanner';

describe('ErrorBanner — mensaje de error', () => {
  /**
   * WHAT: El banner debe mostrar el mensaje de error pasado como prop.
   * WHY: El mensaje es el contenido principal — el usuario debe entender qué falló.
   */
  test('renderiza el mensaje de error', () => {
    // Arrange
    const mensaje = 'Error de conexión: no se pudo contactar al servidor';

    // Act
    render(<ErrorBanner message={mensaje} />);

    // Assert
    expect(screen.getByText(mensaje)).toBeOnTheScreen();
  });
});

describe('ErrorBanner — botón Reintentar condicional', () => {
  /**
   * WHAT: Si onRetry está definido, se debe mostrar el botón "Reintentar".
   * WHY: El botón de retry es opcional — algunos errores no son reintentables
   *      (ej. 404, datos inválidos).
   */
  test('muestra el botón "Reintentar" cuando onRetry está definido', () => {
    // Arrange
    const onRetry = jest.fn();

    // Act
    render(<ErrorBanner message="Error" onRetry={onRetry} />);

    // Assert
    expect(screen.getByText('Reintentar')).toBeOnTheScreen();
  });

  /**
   * WHAT: Si onRetry NO está definido, no se debe mostrar "Reintentar".
   * WHY: Sin callback, el botón no tendría acción — sería confuso para el usuario.
   */
  test('no muestra "Reintentar" cuando onRetry no está definido', () => {
    // Act
    render(<ErrorBanner message="Error" />);

    // Assert
    expect(screen.queryByText('Reintentar')).not.toBeOnTheScreen();
  });

  /**
   * WHAT: Al presionar "Reintentar", se debe llamar al callback onRetry.
   * WHY: Triangulación — verificamos que el botón no solo se renderiza
   *      sino que también dispara la acción correcta.
   */
  test('llama a onRetry al presionar "Reintentar"', () => {
    // Arrange
    const onRetry = jest.fn();

    // Act
    render(<ErrorBanner message="Error" onRetry={onRetry} />);
    fireEvent.press(screen.getByText('Reintentar'));

    // Assert
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorBanner — botón dismiss condicional', () => {
  /**
   * WHAT: Si onDismiss está definido, se debe mostrar el botón "✕".
   * WHY: El dismiss es opcional — algunos banners de error son persistentes
   *      (ej. error crítico que requiere acción del usuario).
   */
  test('muestra el botón "✕" cuando onDismiss está definido', () => {
    // Arrange
    const onDismiss = jest.fn();

    // Act
    render(<ErrorBanner message="Error" onDismiss={onDismiss} />);

    // Assert
    expect(screen.getByText('✕')).toBeOnTheScreen();
  });

  /**
   * WHAT: Si onDismiss NO está definido, no se debe mostrar "✕".
   * WHY: Sin callback, el botón no tendría acción.
   */
  test('no muestra "✕" cuando onDismiss no está definido', () => {
    // Act
    render(<ErrorBanner message="Error" />);

    // Assert
    expect(screen.queryByText('✕')).not.toBeOnTheScreen();
  });

  /**
   * WHAT: Al presionar "✕", se debe llamar al callback onDismiss.
   * WHY: Triangulación — verificamos que el botón no solo se renderiza
   *      sino que también dispara la acción.
   */
  test('llama a onDismiss al presionar "✕"', () => {
    // Arrange
    const onDismiss = jest.fn();

    // Act
    render(<ErrorBanner message="Error" onDismiss={onDismiss} />);
    fireEvent.press(screen.getByText('✕'));

    // Assert
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
