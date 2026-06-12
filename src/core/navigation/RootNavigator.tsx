/**
 * RootNavigator — Navegador raíz con auth guard.
 *
 * WHAT: NavigationContainer que verifica tokens al montar y redirige
 *       automáticamente a Login o Home según el estado de autenticación.
 *       Equivalente a GoRouter con redirects del Flutter original.
 * WHY: El auth guard es crítico para la seguridad — usuarios no
 *      autenticados nunca deben ver pantallas protegidas. La verificación
 *      ocurre UNA vez al iniciar (no en cada navegación).
 * BENEFITS: Navegación type-safe (RootStackParamList), redirección
 *           automática, splash visual durante la verificación, placeholders
 *           para desarrollo incremental de features.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de
 *      RootNavigator.test.tsx.
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ITokenStorage } from '@core/storage/tokenStorage';
import { colors } from '@core/theme/colors';
import type { RootStackParamList } from './types';

// ──── Screens Reales — PR 3.0 ─────────────────────────────────────
import { LoginScreen } from '@features/auth/presentation/screens/LoginScreen';
import { RegisterScreen } from '@features/auth/presentation/screens/RegisterScreen';
import { HomeScreen } from '@features/auth/presentation/screens/HomeScreen';
import { ProductsListScreen } from '@features/products/presentation/screens/ProductsListScreen';
import { ProductDetailScreen } from '@features/products/presentation/screens/ProductDetailScreen';
import { ProductFormScreen } from '@features/products/presentation/screens/ProductFormScreen';

// ──── Stack Navigator ─────────────────────────────────────────────────

/**
 * WHAT: Stack navigator tipado con RootStackParamList.
 * WHY: TypeScript valida que todas las rutas y params sean correctos
 *      en compilación. Sin esto, un typo en navigate() sería runtime error.
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

// ──── Pantalla Placeholder ───────────────────────────────────────────

/**
 * WHAT: Pantalla placeholder genérica para TODAS las rutas.
 * WHY: Permite registrar las 25 rutas del RootStackParamList en el
 *      navigator sin tener las pantallas reales implementadas. Cada
 *      feature implementará su screen en PRs posteriores.
 * BENEFITS: Desarrollo incremental — el router funciona desde el día 1.
 *           Los tests pueden verificar qué pantalla está activa.
 *
 * Props: route.name — nombre de la ruta actual (ej: 'Home', 'Login')
 */
function PlaceholderScreen({ route }: { route: { name: string } }) {
  return (
    <View
      accessibilityLabel={`Pantalla: ${route.name}`}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator
        size="large"
        color={colors.primary}
        accessibilityLabel="Indicador de carga"
      />
    </View>
  );
}

// ──── Pantalla Splash ────────────────────────────────────────────────

/**
 * WHAT: Splash screen temporal que se muestra mientras se verifica
 *       la autenticación (checkAuth pendiente).
 * WHY: Mismo patrón que SplashProvider del Flutter: el usuario ve
 *      feedback visual inmediato mientras la app determina si hay
 *      sesión activa. Evita flash de Login antes de redirigir a Home.
 * BENEFITS: UX fluida — sin pantalla en blanco durante la verificación.
 *           En PRs posteriores se reemplazará por SplashScreen con
 *           animación Lottie del gato.
 */
function SplashScreen() {
  return (
    <View
      accessibilityLabel="Pantalla Splash — verificando sesión"
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary,
      }}
    >
      <ActivityIndicator
        size="large"
        color={colors.textOnPrimary}
        accessibilityLabel="Indicador de carga"
      />
    </View>
  );
}

// ──── Props ──────────────────────────────────────────────────────────

interface RootNavigatorProps {
  /** WHAT: Almacenamiento de tokens inyectado por el composition root.
   *  WHY: Inyección de dependencias — el navigator no instancia
   *       tokenStorage, lo recibe. Facilita testing con mocks y
   *       permite cambiar implementación (InMemory → Keychain)
   *       sin tocar el navigator. */
  tokenStorage: ITokenStorage;
}

// ──── RootNavigator ──────────────────────────────────────────────────

/**
 * WHAT: Navegador raíz con guard de autenticación integrado.
 * WHY: Verifica tokens al montar (useEffect) y redirige según
 *      el resultado. Si isAuthenticated → Home, si no → Login.
 *      La splash se muestra mientras isLoading = true.
 * BENEFITS: Type-safe (RootStackParamList), sin posibilidad de
 *           navegar a rutas protegidas sin autenticación, UX fluida
 *           con splash durante la verificación.
 *
 * Flujo:
 *   1. Montar → isLoading=true → mostrar SplashScreen
 *   2. useEffect → llamar tokenStorage.hasTokens()
 *   3a. hasTokens() = true  → isAuthenticated=true, isLoading=false → Home
 *   3b. hasTokens() = false → isAuthenticated=false, isLoading=false → Login
 *   3c. hasTokens() rechaza  → isAuthenticated=false, isLoading=false → Login
 *   4. Desmontar → cleanup: mounted=false (previene setState en unmounted)
 */
export function RootNavigator({ tokenStorage }: RootNavigatorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // WHAT: Efecto de inicialización — verifica tokens UNA vez al montar.
  // WHY: Mismo comportamiento que AuthProvider.checkAuth() en Flutter.
  //      El flag `mounted` previene "setState on unmounted component".
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const hasTokens = await tokenStorage.hasTokens();
        if (mounted) {
          setIsAuthenticated(hasTokens);
          setIsLoading(false);
        }
        // TODO: En PR de feature/auth, además de hasTokens, verificar
        //       expiración del access token y hacer refresh automático
        //       si expiró (usando tokenStorage.readAccessToken() y
        //       verificando el payload JWT).
      } catch {
        // WHAT: Fail secure — ante cualquier error de Keychain o storage,
        //       asumimos que el usuario NO está autenticado.
        // WHY: Es más seguro pedir login innecesario que mostrar datos
        //      protegidos sin verificación real de tokens.
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [tokenStorage]);

  // WHAT: Splash mientras se verifica la autenticación.
  // WHY: Se renderiza FUERA del NavigationContainer para evitar
  //      que el navigator intente navegar antes de saber el estado.
  if (isLoading) {
    return <SplashScreen />;
  }

  // WHAT: NavigationContainer con estado inicial dinámico.
  // WHY: initialRouteName depende de isAuthenticated.
  //      Si autenticado → Home, si no → Login.
  //      El usuario no puede navegar hacia atrás al Splash
  //      porque initialRouteName es un replace implícito.
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Home' : 'Login'}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {/* Splash — registrada como ruta pero no accesible vía back navigation */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* Auth (público) — accesible sin autenticación */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* Home (autenticado) — punto de entrada post-login */}
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* Products (Fase 2) */}
        <Stack.Screen name="ProductsList" component={ProductsListScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="ProductForm" component={ProductFormScreen} />

        {/* Inventory (Fase 3) */}
        <Stack.Screen name="InventoryList" component={PlaceholderScreen} />
        <Stack.Screen name="InventoryDetail" component={PlaceholderScreen} />

        {/* Sales (Fase 4) */}
        <Stack.Screen name="SalesCreate" component={PlaceholderScreen} />
        <Stack.Screen name="SalesResult" component={PlaceholderScreen} />
        <Stack.Screen name="SalesHistory" component={PlaceholderScreen} />
        <Stack.Screen name="SaleDetail" component={PlaceholderScreen} />

        {/* Receipts (Fase 5) */}
        <Stack.Screen name="ReceiptCapture" component={PlaceholderScreen} />
        <Stack.Screen name="ReceiptReview" component={PlaceholderScreen} />
        <Stack.Screen name="ReceiptConfirmed" component={PlaceholderScreen} />
        <Stack.Screen name="ReceiptsHistory" component={PlaceholderScreen} />
        <Stack.Screen name="ReceiptDetail" component={PlaceholderScreen} />

        {/* Production (Fase 6) */}
        <Stack.Screen name="BulkProductList" component={PlaceholderScreen} />
        <Stack.Screen name="BulkProductForm" component={PlaceholderScreen} />
        <Stack.Screen name="ProductionBatchList" component={PlaceholderScreen} />
        <Stack.Screen name="ProductionBatchCreate" component={PlaceholderScreen} />

        {/* Users — ADMIN only (Fase 6) */}
        <Stack.Screen name="UsersList" component={PlaceholderScreen} />
        <Stack.Screen name="UserDetail" component={PlaceholderScreen} />

        {/* Backups — ADMIN only (Fase 6) */}
        <Stack.Screen name="BackupList" component={PlaceholderScreen} />
        <Stack.Screen name="BackupDetail" component={PlaceholderScreen} />

        {/* Notifications — post-MVP (Fase 7) */}
        <Stack.Screen name="Notifications" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
