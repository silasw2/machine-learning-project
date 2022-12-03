import { LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import NavBar from "./src/components/Navbar";
LogBox.ignoreAllLogs(); //Ignore all log notifications

export default function App() {
  return (
    <NavigationContainer>
      <NavBar />
    </NavigationContainer>
  );
}
