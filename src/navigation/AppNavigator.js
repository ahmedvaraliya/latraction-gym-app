import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import AuthScreen from '../screens/auth/AuthScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import OwnerDashboard from '../screens/owner/OwnerDashboard';
import AddMemberScreen from '../screens/owner/AddMemberScreen';
import MemberListScreen from '../screens/owner/MemberListScreen';
import AttendanceScreen from '../screens/owner/AttendanceScreen';
import PaymentsScreen from '../screens/owner/PaymentsScreen';
import OwnerBroadcastScreen from '../screens/owner/OwnerBroadcastScreen';

import MemberDashboard from '../screens/member/MemberDashboard';
import AttendanceHistoryScreen from '../screens/member/AttendanceHistoryScreen';

import ScanPassScreen from '../screens/owner/ScanPassScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={AuthScreen} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
        <Stack.Screen name="AddMember" component={AddMemberScreen} />
        <Stack.Screen name="MemberList" component={MemberListScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="Payments" component={PaymentsScreen} />
        <Stack.Screen name="OwnerBroadcast" component={OwnerBroadcastScreen} />
        
        <Stack.Screen name="MemberDashboard" component={MemberDashboard} />
        <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />

        <Stack.Screen name="ScanPass" component={ScanPassScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}