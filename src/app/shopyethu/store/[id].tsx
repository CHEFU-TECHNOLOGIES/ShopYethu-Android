import { Redirect, useLocalSearchParams } from "expo-router";

export default function SharedStoreRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return <Redirect href={{ pathname: "/store/[id]", params: { id } }} />;
}
