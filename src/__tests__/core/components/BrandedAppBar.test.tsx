/**
 * WHAT: Tests unitarios para BrandedAppBar — AppBar corporativa de MundoLimpio.
 * WHY: TDD RED — los tests definen el contrato del componente antes de implementar.
 *      Consistencia visual con branded_app_bar.dart del proyecto Flutter original.
 *      Verifica título, botón de logout condicional y callback onLogout.
 * BENEFITS: Cobertura completa de renderizado condicional. Sin regresiones visuales
 *           cuando se modifique el diseño en un solo lugar.
 *
 * TDD: RED — tests escritos antes que la implementación.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { BrandedAppBar } from '@core/components/BrandedAppBar';

describe('BrandedAppBar — renderizado del título', () => {
  /**
   * WHAT: El AppBar debe mostrar el título pasado como prop.
   * WHY: El título es el contenido principal visible en la AppBar.
   *      Equivalente a AppBar(title: Text("...")) en Flutter.
   */
  test('renderiza el título correctamente', () => {
    // Arrange
    const titulo = 'MundoLimpio — Inicio';

    // Act
    render(<BrandedAppBar title={titulo} />);

    // Assert
    expect(screen.getByText(titulo)).toBeOnTheScreen();
  });
});

describe('BrandedAppBar — botón de logout condicional', () => {
  /**
   * WHAT: Si onLogout está definido, se debe mostrar el botón "Salir".
   * WHY: El botón de logout es opcional — no todas las pantallas autenticadas
   *      necesitan un botón de logout visible (ej. screens dentro de tabs).
   */
  test('muestra el botón "Salir" cuando onLogout está definido', () => {
    // Arrange
    const onLogout = jest.fn();

    // Act
    render(<BrandedAppBar title="Inicio" onLogout={onLogout} />);

    // Assert
    expect(screen.getByText('Salir')).toBeOnTheScreen();
  });

  /**
   * WHAT: Si onLogout NO está definido, el botón "Salir" no debe aparecer.
   * WHY: Renderizado condicional — evitamos un botón que no hace nada.
   */
  test('no muestra el botón "Salir" cuando onLogout no está definido', () => {
    // Act
    render(<BrandedAppBar title="Inicio" />);

    // Assert
    expect(screen.queryByText('Salir')).not.toBeOnTheScreen();
  });

  /**
   * WHAT: Al presionar "Salir", se debe llamar al callback onLogout.
   * WHY: Triangulación — verificamos que el botón no solo se renderiza
   *      sino que también dispara la acción correcta.
   */
  test('llama a onLogout al presionar el botón "Salir"', () => {
    // Arrange
    const onLogout = jest.fn();

    // Act
    render(<BrandedAppBar title="Inicio" onLogout={onLogout} />);
    fireEvent.press(screen.getByText('Salir'));

    // Assert
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
