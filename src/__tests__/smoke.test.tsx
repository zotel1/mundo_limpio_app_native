/**
 * Smoke test — verifica que Jest + RNTL están correctamente configurados.
 *
 * WHAT: Test mínimo que valida que el entorno de testing funciona.
 * WHY: Si este test falla, hay un problema de configuración en Jest o RNTL.
 *      Es la primera línea de defensa antes de escribir tests de features.
 * BENEFITS: Diagnóstico rápido de problemas de infraestructura de testing.
 *
 * Fase 0 — Scaffold: este test no prueba lógica de negocio, solo infraestructura.
 */
import {render} from '@testing-library/react-native';
import React from 'react';
import {Text} from 'react-native';
import '@testing-library/jest-native/extend-expect';
import {server} from '../../jest.setup';

describe('Jest + RNTL — Smoke Test (Fase 0)', () => {
  it('debe renderizar un componente React Native usando RNTL', () => {
    // Arrange
    const testId = 'smoke-test';

    // Act
    const {getByTestId} = render(<Text testID={testId}>MundoLimpio</Text>);

    // Assert
    expect(getByTestId(testId)).toBeTruthy();
    expect(getByTestId(testId)).toHaveTextContent('MundoLimpio');
  });

  it('debe tener MSW server disponible (aún sin handlers)', () => {
    // Assert
    expect(server).toBeDefined();
    expect(typeof server.listen).toBe('function');
    expect(typeof server.close).toBe('function');
    expect(typeof server.resetHandlers).toBe('function');
  });
});
