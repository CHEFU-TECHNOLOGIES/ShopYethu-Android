import { Redirect } from "expo-router";
import AppTabs from "@/components/app-tabs";
import { useWelcome } from "@/lib/welcome";

export default function TabsLayout() {
    const { ready, completed } = useWelcome();
    if (!ready) return null;
    if (!completed) return <Redirect href="/welcome" />;
    return <AppTabs />;
}
