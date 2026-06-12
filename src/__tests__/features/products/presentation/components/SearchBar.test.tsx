/**
 * WHAT: Tests TDD para SearchBar — barra de búsqueda con debounce y clear.
 * WHY: Validar debounce (300ms), botón de limpiar condicional, placeholder,
 *      y callback onChangeText. Equivalente al search bar de products_list.dart.
 * BENEFITS: Cobertura completa — renderizado, interacción y comportamiento temporal.
 *
 * TDD: RED → estos tests fallan hasta implementar SearchBar.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { SearchBar } from '@features/products/presentation/components/SearchBar';

describe('SearchBar — renderizado inicial', () => {
  /**
   * WHAT: SearchBar debe mostrar el placeholder cuando value está vacío.
   * WHY: El placeholder guía al usuario — "Buscar por nombre o SKU...".
   */
  it('muestra el placeholder cuando value está vacío', () => {
    // Arrange
    const onChangeText = jest.fn();

    // Act
    render(<SearchBar value="" onChangeText={onChangeText} />);

    // Assert
    expect(
      screen.getByPlaceholderText('Buscar por nombre o SKU...'),
    ).toBeOnTheScreen();
  });

  /**
   * WHAT: SearchBar debe mostrar el valor inicial pasado como prop.
   * WHY: Si el store tiene searchQuery = "jabón", el input debe reflejarlo.
   *      NOTA: queryByPlaceholderText busca por la prop placeholder, no por
   *      visibilidad — el prop siempre existe aunque el input tenga value.
   *      Por eso usamos getByDisplayValue para verificar el valor real.
   */
  it('renderiza el valor inicial desde la prop value', () => {
    // Arrange
    const onChangeText = jest.fn();

    // Act
    render(
      <SearchBar value="jabón" onChangeText={onChangeText} />,
    );

    // Assert — TextInput muestra el valor, no vacío
    expect(screen.getByDisplayValue('jabón')).toBeOnTheScreen();
  });

  /**
   * WHAT: Debe aceptar un placeholder personalizado.
   * WHY: Reusabilidad en otros contextos (ej. filtrar por otro campo).
   */
  it('acepta un placeholder personalizado via prop', () => {
    // Arrange
    const onChangeText = jest.fn();

    // Act
    render(
      <SearchBar
        value=""
        onChangeText={onChangeText}
        placeholder="Filtrar clientes..."
      />,
    );

    // Assert
    expect(
      screen.getByPlaceholderText('Filtrar clientes...'),
    ).toBeOnTheScreen();
  });
});

describe('SearchBar — interacción de texto', () => {
  /**
   * WHAT: onChangeText DEBE ser debounced a 300ms.
   * WHY: Evitar llamadas al store en cada keystroke — solo después de
   *      300ms de inactividad. El TextInput muestra el texto inmediatamente.
   */
  it('debouncea onChangeText: no llama antes de 300ms', () => {
    // Arrange
    jest.useFakeTimers();
    const onChangeText = jest.fn();

    // Act
    render(<SearchBar value="" onChangeText={onChangeText} />);

    // Simular escritura del usuario
    fireEvent.changeText(
      screen.getByPlaceholderText('Buscar por nombre o SKU...'),
      'det',
    );

    // Assert — inmediatamente después, onChangeText NO fue llamado
    expect(onChangeText).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  /**
   * WHAT: Después de 300ms sin cambios, debe llamar a onChangeText.
   * WHY: Triangulación — verificamos que el debounce efectivamente
   *      dispara el callback una vez transcurrido el tiempo de espera.
   */
  it('llama a onChangeText después de 300ms de inactividad', () => {
    // Arrange
    jest.useFakeTimers();
    const onChangeText = jest.fn();

    // Act
    render(<SearchBar value="" onChangeText={onChangeText} />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Buscar por nombre o SKU...'),
      'detergente',
    );

    // Avanzar 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Assert — después de 300ms, onChangeText fue llamado
    expect(onChangeText).toHaveBeenCalledWith('detergente');
    expect(onChangeText).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  /**
   * WHAT: Escritura rápida DEBE reiniciar el timer en cada keystroke.
   * WHY: Si el usuario sigue escribiendo, cada carácter resetea los 300ms.
   *      Solo se llama onChangeText con el último valor después del silencio.
   */
  it('reinicia el timer en cada keystroke sin llamar onChangeText antes', () => {
    // Arrange
    jest.useFakeTimers();
    const onChangeText = jest.fn();

    // Act
    render(<SearchBar value="" onChangeText={onChangeText} />);

    // Keystroke 1
    fireEvent.changeText(
      screen.getByPlaceholderText('Buscar por nombre o SKU...'),
      'd',
    );
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Keystroke 2 — reinicia el timer
    fireEvent.changeText(
      screen.getByPlaceholderText('Buscar por nombre o SKU...'),
      'de',
    );
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Keystroke 3 — reinicia el timer otra vez
    fireEvent.changeText(
      screen.getByPlaceholderText('Buscar por nombre o SKU...'),
      'det',
    );
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Assert — onChangeText NO fue llamado (el timer se reinició en cada stroke)
    expect(onChangeText).not.toHaveBeenCalled();

    // Avanzar hasta completar 300ms desde el último keystroke
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Ahora sí — 300ms acumulados desde el último stroke
    expect(onChangeText).toHaveBeenCalledWith('det');
    expect(onChangeText).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});

describe('SearchBar — botón de limpiar', () => {
  /**
   * WHAT: Cuando value NO está vacío, debe aparecer el botón "✕".
   * WHY: UX estándar — el usuario necesita poder limpiar la búsqueda
   *      sin borrar carácter por carácter.
   */
  it('muestra botón "✕" cuando value tiene texto', () => {
    // Arrange
    const onChangeText = jest.fn();

    // Act
    render(<SearchBar value="jabón" onChangeText={onChangeText} />);

    // Assert
    expect(screen.getByText('✕')).toBeOnTheScreen();
  });

  /**
   * WHAT: Cuando value está vacío, el botón "✕" NO debe aparecer.
   * WHY: No tiene sentido mostrar un botón de limpiar cuando no hay texto.
   */
  it('no muestra "✕" cuando value está vacío', () => {
    // Arrange
    const onChangeText = jest.fn();

    // Act
    render(<SearchBar value="" onChangeText={onChangeText} />);

    // Assert
    expect(screen.queryByText('✕')).not.toBeOnTheScreen();
  });

  /**
   * WHAT: Al presionar "✕", debe llamar onChangeText con string vacío.
   * WHY: El botón de limpiar debe vaciar tanto el input como el store.
   */
  it('llama onChangeText("") al presionar el botón limpiar', () => {
    // Arrange
    jest.useFakeTimers();
    const onChangeText = jest.fn();

    // Act
    render(<SearchBar value="jabón" onChangeText={onChangeText} />);
    fireEvent.press(screen.getByText('✕'));

    // Assert — debe llamar inmediatamente, sin debounce
    expect(onChangeText).toHaveBeenCalledWith('');
    expect(onChangeText).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
