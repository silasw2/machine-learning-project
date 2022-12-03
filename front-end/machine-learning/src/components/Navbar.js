import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Classification from "../views/Classification";
import PoseDetection from "../views/PoseDetection";

const Tab = createBottomTabNavigator();

const NavBar = (props) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "black",
        },
        unmountOnBlur: true
      }}
    >
      <Tab.Screen
        name="Classification"
        children={() => <Classification />}
        options={{
          tabBarLabel: "Classification"
        }}
      />
      <Tab.Screen
        name="Pose Detection"
        children={() => <PoseDetection />}
      />
    </Tab.Navigator>
  );
};

export default NavBar;
