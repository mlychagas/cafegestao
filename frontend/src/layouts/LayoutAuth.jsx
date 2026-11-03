import { Card, Flex } from "antd";
import { Outlet } from "react-router-dom";

export function LayoutAuth() {
    return (
        <Flex
            justify="center"
            align="center"
            style={{ minHeight: "100vh", backgroundColor: "#F7F5F2" }}
        >
            <Card style={{ width: 380, maxWidth: "90vw", borderRadius: 16 }}>
                <Outlet />
            </Card>
        </Flex>
    );
}