import { Alert, Button, Form, Input, Typography } from "antd";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/useAuth.js";
import { tratarErroApi } from "../../utils/tratarErroApi.js";
import { Logo } from "../../components/Logo.jsx";

export function Login() {
    const { entrar } = useAuth();
    const [enviando, setEnviando] = useState(false);
    const [mensagemErro, setMensagemErro] = useState(null);

    async function aoEnviar(valores) {
        setMensagemErro(null);
        setEnviando(true);

        try {
            await entrar(valores.email, valores.senha);
        } catch (erro) {
            setMensagemErro(tratarErroApi(erro));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div>
            <div style={{ marginBottom: 8 }}>
                <Logo />
            </div>
            <Typography.Text type="secondary">
                Gestão administrativa da propriedade rural
            </Typography.Text>

            {mensagemErro && (
                <Alert
                    type="error"
                    showIcon
                    message={mensagemErro}
                    style={{ marginBottom: 16 }}
                />
            )}

            <Form
                layout="vertical"
                onFinish={aoEnviar}
                onValuesChange={() => setMensagemErro(null)}
            >
                <Form.Item
                    name="email"
                    label="E-mail"
                    rules={[
                        { required: true, message: "Informe o e-mail." },
                        { type: "email", message: "E-mail inválido." },
                    ]}
                >
                    <Input autoComplete="email" autoFocus />
                </Form.Item>

                <Form.Item
                    name="senha"
                    label="Senha"
                    rules={[
                        { required: true, message: "Informe a senha." },
                    ]}
                >
                    <Input.Password autoComplete="current-password" />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={enviando}
                    >
                        Entrar
                    </Button>
                </Form.Item>
            </Form>

            <Link to="/cadastro">Criar conta</Link>
        </div>
    );
}
