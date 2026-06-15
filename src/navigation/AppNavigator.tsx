import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PhoneAuthScreen from '../screens/PhoneAuthScreen';
import HomeScreen from '../screens/HomeScreen';
import DestinationScreen from '../screens/DestinationScreen';
import RideConfirmScreen from '../screens/RideConfirmScreen';
import WaitingScreen from '../screens/WaitingScreen';
import RidingScreen from '../screens/RidingScreen';
import PaymentCompleteScreen from '../screens/PaymentCompleteScreen';
import MyPageScreen from '../screens/MyPageScreen';
import FamilyLinkScreen from '../screens/FamilyLinkScreen';
import FamilyMonitorScreen from '../screens/FamilyMonitorScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import VoiceOnlyScreen from '../screens/VoiceOnlyScreen';
import ComponentTestScreen from '../screens/ComponentTestScreen';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  PhoneAuth: undefined;
  MainTabs: undefined;
  Destination: undefined;
  RideConfirm: { destinationName: string };
  Waiting: undefined;
  Riding: undefined;
  PaymentComplete: undefined;
  FamilyLink: undefined;
  FamilyMonitor: undefined;
  Emergency: undefined;
  VoiceOnly: undefined;
  ComponentTest: undefined;
};

export type TabParamList = {
  Home: undefined;
  MyPage: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: typography.bodyMin, fontWeight: typography.fontWeightBold },
        tabBarStyle: { height: 72, paddingBottom: 8 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 28, color }}>🏠</Text>,
          tabBarAccessibilityLabel: '홈 화면',
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          tabBarLabel: '내 정보',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 28, color }}>👤</Text>,
          tabBarAccessibilityLabel: '내 정보 화면',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontSize: typography.title, fontWeight: typography.fontWeightBold },
          headerBackTitle: '뒤로',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} options={{ title: '휴대폰 인증' }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Destination" component={DestinationScreen} options={{ title: '목적지 선택' }} />
        <Stack.Screen name="RideConfirm" component={RideConfirmScreen} options={{ title: '호출 확인' }} />
        <Stack.Screen name="Waiting" component={WaitingScreen} options={{ title: '기사 배정 중' }} />
        <Stack.Screen name="Riding" component={RidingScreen} options={{ title: '이동 중' }} />
        <Stack.Screen name="PaymentComplete" component={PaymentCompleteScreen} options={{ title: '결제 완료' }} />
        <Stack.Screen name="FamilyLink" component={FamilyLinkScreen} options={{ title: '보호자 연동' }} />
        <Stack.Screen name="FamilyMonitor" component={FamilyMonitorScreen} options={{ title: '위치 모니터링' }} />
        <Stack.Screen name="Emergency" component={EmergencyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VoiceOnly" component={VoiceOnlyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ComponentTest" component={ComponentTestScreen} options={{ title: '컴포넌트 테스트' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
