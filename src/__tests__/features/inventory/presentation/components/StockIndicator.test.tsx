/**
 * WHAT: Tests TDD para StockIndicator — barra de progreso coloreada de stock.
 * WHY: Validar que el indicador renderiza la barra con color semántico
 *      (rojo/amarillo/verde) según ratio current/max y texto de estado.
 * BENEFITS: Componente puramente presentacional — fácil de testear. Sin mocks.
 *
 * TDD: RED — tests escritos antes de la implementación, deben fallar.
 *
 * PR 3.5a — 3.5a.1
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// ──── Import (dynamic — component doesn't exist yet, will fail in RED phase) ────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { StockIndicator } = require(
  '@features/inventory/presentation/components/StockIndicator',
) as { StockIndicator: React.ComponentType<{ current: number; min: number; max: number }> };

// ──── Suite ────

describe('StockIndicator — indicador de nivel de stock', () => {
  // ═══════════════════════════════════════════════════════════════
  // COLOR SEMÁNTICO — ratio current/max
  // ═══════════════════════════════════════════════════════════════

  it('renderiza barra roja cuando stock < 50% del umbral (crítico)', () => {
    render(<StockIndicator current={2} min={0} max={10} />);

    const indicator = screen.getByTestId('stock-indicator');
    expect(indicator).toBeOnTheScreen();

    const fill = screen.getByTestId('stock-indicator-fill');
    expect(fill).toHaveStyle({ backgroundColor: '#C62828' });

    expect(screen.getByText('Crítico — 2 de 10')).toBeOnTheScreen();
  });

  it('renderiza barra amarilla cuando stock entre 50% y 100% del umbral (bajo)', () => {
    render(<StockIndicator current={7} min={0} max={10} />);

    const fill = screen.getByTestId('stock-indicator-fill');
    expect(fill).toHaveStyle({ backgroundColor: '#F57F17' });

    expect(screen.getByText('Bajo — 7 de 10')).toBeOnTheScreen();
  });

  it('renderiza barra verde cuando stock >= umbral (normal)', () => {
    render(<StockIndicator current={15} min={0} max={10} />);

    const fill = screen.getByTestId('stock-indicator-fill');
    expect(fill).toHaveStyle({ backgroundColor: '#2E7D32' });

    expect(screen.getByText('Normal — 15 unidades')).toBeOnTheScreen();
  });
});
