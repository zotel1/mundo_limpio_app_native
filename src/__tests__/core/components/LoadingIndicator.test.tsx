/**
 * WHAT: Tests unitarios para LoadingIndicator — spinner de carga centrado.
 * WHY: TDD RED — los tests definen el contrato del componente antes de implementar.
 *      Consistencia visual con cat_loading_indicator.dart del Flutter original.
 *      Fácil de reemplazar por animación del gato después sin cambiar la API.
 * BENEFITS: Cobertura del spinner, mensaje opcional y tamaño por defecto.
 *
 * TDD: RED — tests escritos antes que la implementación.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { LoadingIndicator } from '@core/components/LoadingIndicator';

describe('LoadingIndicator — spinner de carga', () => {
  /**
   * WHAT: El componente debe contener un ActivityIndicator.
   * WHY: El indicador visual es el elemento principal — el usuario
   *      necesita saber que algo está cargando.
   */
  test('renderiza un ActivityIndicator', () => {
    // Act
    render(<LoadingIndicator />);

    // Assert
    // ActivityIndicator en React Native Testing Library se identifica
    // como un componente nativo. Usamos testID para ser explícitos.
    const spinner = screen.getByTestId('loading-indicator');
    expect(spinner).toBeOnTheScreen();
  });
});

describe('LoadingIndicator — mensaje opcional', () => {
  /**
   * WHAT: Si se proporciona la prop `message`, debe mostrarse debajo del spinner.
   * WHY: Feedback contextual — ej. "Cargando productos...", "Verificando sesión...".
   *      Equivalente al `label` del Flutter original.
   */
  test('muestra el mensaje cuando se proporciona', () => {
    // Arrange
    const mensaje = 'Cargando productos...';

    // Act
    render(<LoadingIndicator message={mensaje} />);

    // Assert
    expect(screen.getByText(mensaje)).toBeOnTheScreen();
  });

  /**
   * WHAT: Si NO se proporciona `message`, no debe renderizarse ningún texto.
   * WHY: Sin mensaje, el spinner solo muestra el indicador visual — suficiente
   *      para pantallas pequeñas o cargas rápidas.
   */
  test('no muestra mensaje cuando no se proporciona', () => {
    // Act
    render(<LoadingIndicator />);

    // Assert
    // No debe haber ningún componente Text con contenido
    const textElements = screen.queryAllByTestId('loading-message');
    expect(textElements).toHaveLength(0);
  });
});

describe('LoadingIndicator — tamaño', () => {
  /**
   * WHAT: El tamaño por defecto del ActivityIndicator debe ser 'large'.
   * WHY: Consistencia visual — en la app Flutter el spinner es grande
   *      (equivalente a CircularProgressIndicator sin constraints).
   *      'large' da presencia visual adecuada para estados de carga.
   */
  test('el tamaño por defecto es "large"', () => {
    // Act
    render(<LoadingIndicator />);

    // Assert
    const spinner = screen.getByTestId('loading-indicator');
    expect(spinner.props.size).toBe('large');
  });

  /**
   * WHAT: Si se pasa size="small", el ActivityIndicator debe reflejarlo.
   * WHY: Triangulación — verificamos que la prop size se propaga correctamente
   *      al ActivityIndicator nativo. Útil en listas o componentes pequeños.
   */
  test('acepta size="small" y lo propaga al ActivityIndicator', () => {
    // Act
    render(<LoadingIndicator size="small" />);

    // Assert
    const spinner = screen.getByTestId('loading-indicator');
    expect(spinner.props.size).toBe('small');
  });
});
