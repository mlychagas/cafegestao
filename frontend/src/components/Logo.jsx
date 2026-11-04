import { Flex, Typography } from "antd";
import { CoffeeOutlined } from "@ant-design/icons";

export function Logo({
    corIcone = "#2F5233",
    corTexto = "#4A2E1B",
    tamanhoIcone = 28,
    tamanhoTexto = 20,
}) {
    return (
        <Flex align="center" gap={10}>
            <CoffeeOutlined style={{ color: corIcone, fontSize: tamanhoIcone }} />
            <Typography.Text
                style={{ color: corTexto, fontWeight: 800, fontSize: tamanhoTexto, whiteSpace: "nowrap" }}
            >
                CaféGestão
            </Typography.Text>
        </Flex>
    );
}