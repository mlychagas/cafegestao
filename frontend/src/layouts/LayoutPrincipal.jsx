import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.js";
import { Avatar, Button, Flex, Layout, Menu, Popconfirm, Typography } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import menuItens from "./menuItens.jsx";
import { useState } from "react";
import { Logo } from "../components/Logo.jsx";

export function LayoutPrincipal() {
    const { Sider, Header, Content } = Layout;
    const { usuario, sair } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const iniciais = usuario.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
    const [recolhido, setRecolhido] = useState(false)
    const [mobile, setMobile] = useState(false)

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={230} breakpoint="lg"
                collapsedWidth={0} collapsed={recolhido}
                onCollapse={(valor) => setRecolhido(valor)}
                onBreakpoint={(quebrou) => setMobile(quebrou)}
                style={mobile ? { position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 1000 } :
                    { position: 'sticky', top: 0, height: '100vh' }}>
                <Flex vertical style={{ height: '100%' }}>
                    <div style={{ padding: 20 }}>
                        <Logo corIcone="#7FA671" corTexto="#fff" tamanhoIcone={22} tamanhoTexto={17} />
                    </div>
                    <Menu
                        theme="dark"
                        mode="inline"
                        items={menuItens}
                        selectedKeys={[location.pathname]}
                        onClick={({ key }) => {
                            navigate(key);
                            if (mobile) {
                                setRecolhido(true)
                            }
                        }}

                    />
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '14px 20px' }}>
                        <Popconfirm
                            title="Deseja sair do sistema?"
                            okText="Sair"
                            cancelText="Cancelar"
                            onConfirm={sair}
                            placement="topLeft"
                        >
                            <Button type="text" block style={{ color: '#EFE6DC', textAlign: 'left' }} icon={<LogoutOutlined />}>Sair</Button>
                        </Popconfirm>
                    </div>
                </Flex>
            </Sider>
            <Layout>
                <Header style={{ padding: '0 28px', borderBottom: '1px solid #E0DCD5' }}>
                    <Flex justify="flex-end" align="center" gap={12} style={{ height: '100%' }}>
                        <Avatar style={{ backgroundColor: '#2F5233' }}>{iniciais}</Avatar>
                        <Typography.Text strong style={{ whiteSpace: 'nowrap' }}>{usuario.nome}</Typography.Text>

                    </Flex>
                </Header>
                <Content style={{ padding: 28 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}